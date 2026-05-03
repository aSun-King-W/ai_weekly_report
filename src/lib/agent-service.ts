// Agent核心服务，处理function calling和工具协调
import OpenAI from 'openai';
import { AgentContext, AgentResult, GitHubCommit, ReportOptions } from '../types/index.ts';
import { getToolsDefinition, executeToolCalls } from './tools.ts';
import { getAIService } from './ai-service.ts';
import { logger } from './logger.ts';

// 错误分类日志
interface ErrorClassification {
  type: 'api_call_failed' | 'tool_execution_failed' | 'response_parsing_failed' | 'unknown';
  originalError: string;
  stage: string;
  details?: string;
}

function classifyError(error: unknown, stage: string): ErrorClassification {
  if (error instanceof OpenAI.APIError) {
    return {
      type: 'api_call_failed',
      originalError: `[${error.status}] ${error.message}`,
      stage,
      details: `API错误 ${error.status || ''}`.trim(),
    };
  }

  if (error instanceof SyntaxError) {
    return {
      type: 'response_parsing_failed',
      originalError: error.message,
      stage,
      details: `JSON解析失败: ${error.message}`,
    };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('timeout') || msg.includes('socket') || msg.includes('econn')) {
      return {
        type: 'api_call_failed',
        originalError: error.message,
        stage,
        details: '网络连接失败',
      };
    }
    if (msg.includes('tool') || msg.includes('execute')) {
      return {
        type: 'tool_execution_failed',
        originalError: error.message,
        stage,
        details: `工具执行失败: ${error.message}`,
      };
    }
    return {
      type: 'response_parsing_failed',
      originalError: error.message,
      stage,
      details: error.message,
    };
  }

  return {
    type: 'unknown',
    originalError: String(error),
    stage,
    details: '未知错误',
  };
}

// 系统提示词
const SYSTEM_PROMPT = `你是一个AI周报生成助手，专门帮助用户获取GitHub提交记录并生成专业周报。

## 核心工作流程（必须严格遵守）

当用户请求生成周报/报告时，你的思考步骤（CoT）：
1. 识别用户查询中的关键信息：仓库名(owner/repo)、时间范围、风格偏好、长度要求
2. 调用 get_github_commits 获取原始提交数据
3. 将获取到的 commits 数据传递给 generate_report 生成最终周报
4. 输出 generate_report 返回的内容（原样输出，不加任何额外文字）

## 工具调用规则

### 第一步：get_github_commits
- 必须从查询中解析出 owner 和 repo（例如 "facebook/react" → owner="facebook", repo="react"）
- 如果用户指定了时间范围（如"最近7天"、"从2024-01-01到2024-01-07"），转换为 ISO 格式传入 since/until
- 如果用户没有指定时间范围，默认获取最近7天的记录（不传 since/until 参数）
- 如果仓库名较长（如 "facebook/react-native-community/react-native-app-auth"），只取前两部分作为 owner/repo

### 第二步：generate_report
- 将 get_github_commits 返回的 commits 数组原样传入
- 根据用户查询推断 options：
  - style: 用户提到"技术"/"technical"→technical；"专业"/"正式"→professional；"轻松"/"友好"→casual；未指定→professional
  - length: 用户提到"简洁"/"简单"/"concise"→concise；"详细"/"detailed"→detailed；"完整"/"详尽"→comprehensive；未指定→detailed
  - includeMetrics: 用户提到"统计"/"指标"/"metrics"→true；除非明确说不需要，否则默认为true

## 输出规则
- 在调用 generate_report 后，**直接原样输出工具返回的内容**，不要添加任何自己的总结、解释、问候语或额外文字
- 工具返回的内容已经是完整的、格式化好的周报（Markdown格式）
- 如果 get_github_commits 返回空数组（空仓库），仍然调用 generate_report 并传入空数组，让工具处理
- 如果 get_github_commits 返回错误信息，将该错误信息直接告知用户，不再继续调用 generate_report

## 语言规则
- 始终使用中文与用户交流
- 工具返回的周报内容是中文，保持原样输出

## 关键约束
- 禁止：在未调用 generate_report 工具的情况下直接生成周报文本
- 禁止：在 generate_report 返回内容前后添加额外说明
- 禁止：猜测或虚构提交数据——必须通过 get_github_commits 获取
- 禁止：询问用户是否要下载——这是API自动处理的

## 边缘情况处理
- 如果用户只给了仓库名没说明意图，默认执行生成周报流程
- 如果 get_github_commits 执行失败（仓库不存在/无权限），将错误信息告知用户，停止后续流程
- 如果用户请求英文，仍按上述流程执行，工具调用参数不变`;

const MAX_TOOL_CALLS = 10;
const API_TIMEOUT_MS = 60000;

export class AgentService {
  private client: OpenAI;

  constructor(apiKey: string) {
    // DeepSeek API兼容OpenAI API格式
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
      timeout: API_TIMEOUT_MS,
      maxRetries: 2,
    });
  }

  /**
   * 从自然语言查询中推断报告选项
   */
  static inferReportOptions(query: string): ReportOptions {
    const q = query.toLowerCase();

    // 推断风格
    let style: ReportOptions['style'] = 'professional';
    if (q.includes('技术') || q.includes('technical') || q.includes('tech')) {
      style = 'technical';
    } else if (q.includes('轻松') || q.includes('友好') || q.includes('casual') || q.includes('随意')) {
      style = 'casual';
    } else if (q.includes('专业') || q.includes('正式') || q.includes('professional')) {
      style = 'professional';
    }

    // 推断长度
    let length: ReportOptions['length'] = 'detailed';
    if (q.includes('简洁') || q.includes('简单') || q.includes('concise') || q.includes('brief') || q.includes('精简')) {
      length = 'concise';
    } else if (q.includes('详细') || q.includes('detailed') || q.includes('详尽')) {
      length = 'detailed';
    } else if (q.includes('完整') || q.includes('comprehensive') || q.includes('全面')) {
      length = 'comprehensive';
    }

    // 推断是否包含指标
    const includeMetrics = !(q.includes('不需要指标') || q.includes('不要统计') || q.includes('no metrics'));

    return { style, length, includeMetrics };
  }

  /**
   * 处理用户查询
   */
  async processQuery(query: string, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const toolExecutionTimes: Record<string, number> = {};
    const errors: ErrorClassification[] = [];

    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ];

      const tools = getToolsDefinition();

      // 第一次调用：获取工具调用决策
      let response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 1000,
        temperature: 0.7,
      });

      let toolCallCount = 0;
      let shouldContinue = true;

      // 架构绕过状态：捕获真实提交数据，拦截 generate_report
      let realCommits: GitHubCommit[] | null = null;
      let extractedOptions: ReportOptions | null = null;

      // 循环处理工具调用，直到AI返回最终文本响应
      while (shouldContinue) {
        const choice = response.choices?.[0];
        if (!choice?.message) {
          errors.push({
            type: 'response_parsing_failed',
            originalError: '响应中缺少choices[0].message',
            stage: 'response_check',
            details: `响应结构异常: choices=${response.choices?.length || 0}`,
          });
          break;
        }

        const toolCalls = choice.message.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          toolCallCount += toolCalls.length;

          if (toolCallCount > MAX_TOOL_CALLS) {
            errors.push({
              type: 'response_parsing_failed',
              originalError: `工具调用次数超过限制(${MAX_TOOL_CALLS})`,
              stage: 'tool_call_loop',
            });
            break;
          }

          // 将AI的响应添加到消息历史
          messages.push(choice.message);

          // 执行工具调用
          const toolStartTime = Date.now();

          // 转换OpenAI工具调用到我们的格式
          const convertedToolCalls = toolCalls
            .filter((tc): tc is OpenAI.ChatCompletionMessageToolCall & { function: Record<string, unknown> } =>
              tc.type === 'function' && typeof (tc as unknown as Record<string, unknown>).function === 'object'
            )
            .map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: (tc.function as Record<string, unknown>).name as string,
                arguments: String((tc.function as Record<string, unknown>).arguments || '{}'),
              },
            }));

          if (convertedToolCalls.length === 0) {
            errors.push({
              type: 'response_parsing_failed',
              originalError: '工具调用列表为空或格式不正确',
              stage: 'tool_conversion',
              details: `原始工具调用数: ${toolCalls.length}`,
            });
            break;
          }

          // ---- 架构绕过：拦截 generate_report，捕获真实 commits ----
          // 按工具类型分组
          const githubCalls = convertedToolCalls.filter(tc => tc.function.name === 'get_github_commits');
          const reportGenCalls = convertedToolCalls.filter(tc => tc.function.name === 'generate_report');
          const otherCalls = convertedToolCalls.filter(tc =>
            tc.function.name !== 'get_github_commits' && tc.function.name !== 'generate_report'
          );

          // 1) 执行 get_github_commits，捕获真实提交数据
          if (githubCalls.length > 0) {
            const results = await executeToolCalls(githubCalls, context);
            for (const result of results) {
              if (typeof result.content === 'string') {
                try {
                  const parsed = JSON.parse(result.content);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    realCommits = parsed;
                  }
                } catch {
                  // 非 JSON → 错误消息，realCommits 保持 null
                }
              }
            }
            messages.push(...results);
          }

          // 2) 拦截 generate_report：只提取 options，不执行
          if (reportGenCalls.length > 0) {
            for (const call of reportGenCalls) {
              try {
                const args = JSON.parse(call.function.arguments);
                if (args.options) {
                  extractedOptions = args.options;
                }
              } catch {
                // JSON 解析失败，忽略此调用
              }
              // 添加占位结果以保持消息历史一致性
              messages.push({
                tool_call_id: call.id,
                role: 'tool' as const,
                name: 'generate_report',
                content: '[系统正在使用已验证的真实提交数据生成报告...]',
              });
            }
          }

          // 3) 执行其他工具调用
          if (otherCalls.length > 0) {
            const otherResults = await executeToolCalls(otherCalls, context);
            messages.push(...otherResults);
          }

          toolExecutionTimes['tool_execution'] = (toolExecutionTimes['tool_execution'] || 0) + (Date.now() - toolStartTime);

          // 4) 绕过判定：有真实提交数据 → 直接程序化生成报告
          if (realCommits && realCommits.length > 0) {
            const options = extractedOptions || AgentService.inferReportOptions(query);
            const aiService = getAIService();
            const reportResult = await aiService.generateReport(realCommits, options);

            logger.info('agent', 'bypass_triggered', {
              metadata: {
                commitCount: realCommits.length,
                optionsSource: extractedOptions ? 'model_extracted' : 'inferred',
              },
            });

            return {
              content: reportResult.report,
              toolCalls: toolCallCount,
              metadata: {
                executionTime: Date.now() - startTime,
                toolExecutionTimes,
                bypass: true,
                commitCount: realCommits.length,
              },
            };
          }

          // 获取下一个响应（无绕过时继续正常循环）
          response = await this.client.chat.completions.create({
            model: 'deepseek-chat',
            messages,
            tools,
            tool_choice: 'auto',
            max_tokens: 4000,
            temperature: 0.7,
          });
        } else {
          // 没有工具调用，AI返回了最终文本响应
          shouldContinue = false;
        }
      }

      const finalChoice = response.choices?.[0];
      const content = finalChoice?.message?.content || '';
      const executionTime = Date.now() - startTime;

      // 记录错误分类日志
      if (errors.length > 0) {
        console.warn('[AgentService] 执行过程中出现异常:', JSON.stringify(errors, null, 2));
      }

      // 结构化日志
      const selectedTools = response.choices?.[0]?.message?.tool_calls
        ?.filter(tc => tc.type === 'function')
        ?.map(tc => tc.function.name) || [];

      logger.info('agent', 'process_query', {
        duration: executionTime,
        metadata: {
          toolCallCount,
          selectedTools,
          hasContent: !!content,
          errorCount: errors.length,
        },
      });

      // 记录每个工具的耗时
      for (const [tool, time] of Object.entries(toolExecutionTimes)) {
        logger.info('agent', `tool_${tool}`, {
          duration: Math.round(time),
          metadata: { tool },
        });
      }

      // 记录每个错误
      for (const err of errors) {
        logger.error('agent', `error_${err.type}`, err.originalError, {
          metadata: { stage: err.stage },
        });
      }

      // 如果content为空但执行过程中有错误，返回错误信息
      if (!content && errors.length > 0) {
        const errorDetail = errors.map(e => `[${e.type}] ${e.details}`).join('; ');
        return {
          content: `抱歉，处理您的请求时出现错误：${errorDetail}`,
          toolCalls: toolCallCount,
          metadata: {
            executionTime,
            toolExecutionTimes,
            errors: errors.map(e => ({ type: e.type, detail: e.details || e.originalError })),
          },
        };
      }

      // 检测退化响应：AI没调用任何工具就直接输出短文本（可能是模型理解偏差）
      if (toolCallCount === 0 && content.length < 100 && (query.includes('repo') || query.includes('周报') || query.includes('报告'))) {
        logger.warn('agent', 'degenerate_response_detected', {
          metadata: {
            query: query.substring(0, 60),
            contentLength: content.length,
            content: content.substring(0, 100),
          },
        });
      }

      return {
        content,
        toolCalls: toolCallCount,
        metadata: {
          executionTime,
          toolExecutionTimes,
          errors: errors.length > 0 ? errors.map(e => ({ type: e.type, detail: e.details || e.originalError })) : undefined,
        },
      };
    } catch (error) {
      const classification = classifyError(error, 'process_query');
      const executionTime = Date.now() - startTime;
      console.error('[AgentService] 处理查询失败:', classification);

      logger.error('agent', 'process_query', classification.originalError, {
        duration: executionTime,
        metadata: { stage: classification.stage, type: classification.type },
      });

      // 处理不同类型的错误
      let errorMessage = '处理请求时发生错误';

      if (error instanceof OpenAI.APIError) {
        switch (error.status) {
          case 401:
            errorMessage = 'DeepSeek API密钥无效';
            break;
          case 429:
            errorMessage = 'API调用频率限制，请稍后重试';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'AI服务暂时不可用，请稍后重试';
            break;
          default:
            errorMessage = `DeepSeek API错误: ${error.message}`;
        }
      } else if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('timeout') || message.includes('socket') || message.includes('econn')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (classification.type === 'response_parsing_failed') {
          errorMessage = `响应解析失败: ${error.message}`;
        } else if (classification.type === 'tool_execution_failed') {
          errorMessage = `工具执行失败: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }

      return {
        content: `抱歉，处理您的请求时出现错误：${errorMessage}`,
        toolCalls: 0,
        metadata: {
          executionTime: Date.now() - startTime,
          errors: [{ type: classification.type, detail: classification.details || classification.originalError }],
        },
      };
    }
  }

  /**
   * 简化接口：直接生成周报（封装常见工作流程）
   */
  async generateWeeklyReport(
    owner: string,
    repo: string,
    context: AgentContext,
    options?: {
      since?: string;
      until?: string;
      style?: 'professional' | 'casual' | 'technical';
      length?: 'concise' | 'detailed' | 'comprehensive';
      includeMetrics?: boolean;
    }
  ): Promise<AgentResult> {
    const defaultOptions = {
      style: 'professional' as const,
      length: 'detailed' as const,
      includeMetrics: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // 构建查询
    let query = `为仓库 ${owner}/${repo} 生成周报`;

    if (options?.since || options?.until) {
      const sinceStr = options.since ? `从 ${options.since}` : '';
      const untilStr = options.until ? `到 ${options.until}` : '';
      query += ` ${sinceStr} ${untilStr}`.trim();
    }

    query += `，使用${mergedOptions.style}风格，${mergedOptions.length}长度`;
    if (mergedOptions.includeMetrics) {
      query += '，包含统计指标';
    }

    return this.processQuery(query, context);
  }
}

// 单例实例
let agentServiceInstance: AgentService | null = null;

/**
 * 获取AgentService实例（单例模式）
 */
export function getAgentService(): AgentService {
  if (!agentServiceInstance) {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY或ANTHROPIC_API_KEY环境变量未设置');
    }

    agentServiceInstance = new AgentService(apiKey);
  }

  return agentServiceInstance;
}
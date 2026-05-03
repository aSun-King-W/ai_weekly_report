// Agent核心服务，处理function calling和工具协调
import OpenAI from 'openai';
import { AgentContext, AgentResult } from '../types/index.ts';
import { getToolsDefinition, executeToolCalls } from './tools.ts';
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
const SYSTEM_PROMPT = `你是一个AI周报生成助手，专门帮助用户获取GitHub提交记录并生成周报。

你可以使用以下工具：
1. get_github_commits - 获取指定GitHub仓库的提交记录
2. generate_report - 基于提交记录生成周报

工作流程：
1. 用户请求生成周报时，首先使用get_github_commits工具获取提交记录
2. 然后使用generate_report工具基于获取的提交记录生成周报
3. 如果用户直接提供了提交记录，可以直接使用generate_report工具

重要规则：
- 始终使用中文与用户交流
- 如果用户没有指定时间范围，默认获取最近7天的提交记录
- 如果用户没有指定报告选项，使用默认选项：风格为professional，长度为detailed，包含统计指标
- 如果用户只提供了仓库信息，你需要主动询问是否需要指定时间范围或报告选项
- 如果工具执行失败，向用户解释错误原因并提供解决方案
- 当用户请求生成周报时，你必须依次调用两个工具：先get_github_commits，然后generate_report
- 在调用generate_report工具时，必须将get_github_commits工具返回的提交记录作为commits参数传递
- 不要在没有调用generate_report工具的情况下直接生成周报文本
- 在调用generate_report工具后，直接输出工具返回的完整周报内容（Markdown格式），不要添加任何自己的总结、解释或额外文字
- 工具返回的内容已经是完整的、格式化的周报，你只需要原样输出即可
- 如果用户需要下载文件，他们可以通过API参数实现，你不需要在响应中提及下载功能

请根据用户请求，智能地决定需要调用哪些工具以及调用顺序。`;

const MAX_TOOL_CALLS = 10;
const API_TIMEOUT_MS = 30000;

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
        max_tokens: 4000,
        temperature: 0.7,
      });

      let toolCallCount = 0;
      let shouldContinue = true;

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

          const toolResults = await executeToolCalls(convertedToolCalls, context);
          toolExecutionTimes['tool_execution'] = (toolExecutionTimes['tool_execution'] || 0) + (Date.now() - toolStartTime);

          // 将工具结果添加到消息历史
          messages.push(...toolResults);

          // 获取下一个响应
          response = await this.client.chat.completions.create({
            model: 'deepseek-chat',
            messages,
            tools,
            tool_choice: 'auto',
            max_tokens: 8000,
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
// Agent核心服务，处理function calling和工具协调
import OpenAI from 'openai';
import { AgentContext, AgentResult } from '@/types';
import { getToolsDefinition, executeToolCalls } from './tools';

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

export class AgentService {
  private client: OpenAI;

  constructor(apiKey: string) {
    // DeepSeek API兼容OpenAI API格式
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  /**
   * 处理用户查询
   */
  async processQuery(query: string, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const toolExecutionTimes: Record<string, number> = {};

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
        const toolCalls = response.choices[0]?.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          // 有工具调用，执行它们
          toolCallCount += toolCalls.length;

          // 将AI的响应添加到消息历史
          messages.push(response.choices[0].message);

          // 执行工具调用
          const toolStartTime = Date.now();

          // 转换OpenAI工具调用到我们的格式
          const convertedToolCalls = toolCalls.map(tc => {
            // 类型保护：确保是function工具调用
            if (tc.type !== 'function') {
              throw new Error(`不支持的工具类型: ${tc.type}`);
            }
            // 使用类型断言访问function属性
            const toolCall = tc as any;
            return {
              id: tc.id,
              type: tc.type as 'function',
              function: {
                name: toolCall.function.name,
                arguments: toolCall.function.arguments,
              },
            };
          });

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

          // 继续循环，检查是否有更多工具调用
          shouldContinue = true;
        } else {
          // 没有工具调用，AI返回了最终文本响应
          shouldContinue = false;
        }
      }

      const content = response.choices[0]?.message?.content || '';
      const executionTime = Date.now() - startTime;

      return {
        content,
        toolCalls: toolCallCount,
        metadata: {
          executionTime,
          toolExecutionTimes,
        },
      };
    } catch (error) {
      console.error('Agent处理查询失败:', error);

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
        if (message.includes('network') || message.includes('timeout') || message.includes('socket')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        content: `抱歉，处理您的请求时出现错误：${errorMessage}`,
        toolCalls: 0,
        metadata: {
          executionTime: Date.now() - startTime,
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
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY环境变量未设置');
    }

    agentServiceInstance = new AgentService(apiKey);
  }

  return agentServiceInstance;
}
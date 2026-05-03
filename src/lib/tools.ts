// 工具定义和实现模块
import { GitHubCommit, ReportOptions, ToolDefinition, ToolCall, ToolResult, AgentContext } from '../types/index.ts';
import { getAIService } from './ai-service.ts';
import { logger } from './logger.ts';

// GitHub API响应类型
interface GitHubApiCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

/**
 * 获取GitHub提交记录工具
 */
export async function getGitHubCommits(
  params: {
    owner: string;
    repo: string;
    since?: string;
    until?: string;
    page?: number;
    per_page?: number;
  },
  context: AgentContext
): Promise<GitHubCommit[]> {
  const { owner, repo, since, until, page = 1, per_page = 20 } = params;
  const { accessToken } = context;
  const startTime = Date.now();

  if (!accessToken) {
    throw new Error('未提供有效的GitHub访问令牌');
  }

  if (!owner || !repo) {
    throw new Error('缺少必要的参数：owner 和 repo');
  }

  // 调用GitHub API获取commit记录
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: Math.min(per_page, 50).toString(), // GitHub API限制每页最多100条，为节省上下文窗口限制为50
  });

  if (since) {
    queryParams.append('since', since);
  }
  if (until) {
    queryParams.append('until', until);
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Weekly-Report-App',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const duration = Date.now() - startTime;
    console.error('GitHub API错误:', response.status, errorText);

    logger.error('github', 'get_commits', `GitHub API ${response.status}`, {
      duration,
      metadata: { owner, repo, status: response.status },
    });

    // 处理空仓库的情况
    if (response.status === 409) {
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message === 'Git Repository is empty.') {
          // 对于空仓库，返回空数组
          return [];
        }
      } catch {
        // 如果不是预期的空仓库错误，继续正常错误处理
      }
    }

    let errorMessage = `GitHub API错误: ${response.status} ${response.statusText}`;

    // 特定错误处理
    if (response.status === 401 || response.status === 403) {
      errorMessage = 'GitHub认证失败，请重新登录';
    } else if (response.status === 404) {
      errorMessage = '仓库不存在或无权访问';
    } else if (response.status === 422) {
      errorMessage = '请求参数无效';
    } else if (response.status === 429) {
      errorMessage = 'GitHub API速率限制，请稍后重试';
    }

    throw new Error(errorMessage);
  }

  const commitsData: GitHubApiCommit[] = await response.json();
  const duration = Date.now() - startTime;

  logger.info('github', 'get_commits', {
    duration,
    metadata: { owner, repo, commitCount: commitsData.length, page, repoFull: `${owner}/${repo}` },
  });

  // 格式化响应数据
  const formattedCommits: GitHubCommit[] = commitsData.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author.name,
      email: commit.commit.author.email,
      date: commit.commit.author.date,
    },
    url: commit.html_url,
    repository: {
      name: repo,
      owner: owner,
    },
  }));

  return formattedCommits;
}

/**
 * 生成报告工具
 */
export async function generateReport(
  params: {
    commits: GitHubCommit[];
    options: ReportOptions;
  },
  _context: AgentContext
): Promise<string> {
  const { commits, options } = params;
  void _context;

  if (!commits || !Array.isArray(commits) || commits.length === 0) {
    throw new Error('提交记录不能为空');
  }

  if (!options) {
    throw new Error('报告选项不能为空');
  }

  // 验证环境变量
  if (!process.env.DEEPSEEK_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('DeepSeek API密钥未配置');
  }

  // 获取AI服务实例
  const aiService = getAIService();

  // 使用AI生成报告
  const result = await aiService.generateReport(commits, options);

  return result.report;
}

/**
 * 获取工具定义
 */
export function getToolsDefinition(): ToolDefinition[] {
  return [
    {
      type: 'function',
      function: {
        name: 'get_github_commits',
        description: '【必须第一个调用】获取指定GitHub仓库的提交记录。生成周报/报告前必须先调用此工具获取原始数据。支持按时间范围过滤、分页。调用后获得的数据应直接传给generate_report工具。适用于：用户请求生成周报/报告时，需要先获取仓库的提交历史。',
        parameters: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: '仓库所有者的用户名或组织名（必填）。例如：用户请求 "facebook/react" 则 owner="facebook"',
            },
            repo: {
              type: 'string',
              description: '仓库名称（必填）。例如：用户请求 "facebook/react" 则 repo="react"',
            },
            since: {
              type: 'string',
              description: '起始日期（ISO 8601格式）。当用户指定了时间范围时设置，如"从2024-01-01"、"最近7天"（自动计算）。默认不传时获取最近7天。示例："2024-01-01T00:00:00Z"',
            },
            until: {
              type: 'string',
              description: '结束日期（ISO 8601格式）。当用户指定了截止时间时设置。默认不传时获取到当前时间。示例："2024-01-07T23:59:59Z"',
            },
            page: {
              type: 'number',
              description: '页码，从1开始，默认为1。用于翻页获取更多提交',
            },
            per_page: {
              type: 'number',
              description: '每页返回的提交数量，默认为30，最大100。如果用户需要完整报告可以调大此值',
            },
          },
          required: ['owner', 'repo'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_report',
        description: '【必须在get_github_commits之后调用】基于GitHub提交记录数组生成格式化的周报/报告。接收get_github_commits返回的commits数组作为输入，生成符合指定风格和长度的专业报告。如果用户没有明确指定报告选项，使用默认值：professional风格、detailed长度、包含统计指标。',
        parameters: {
          type: 'object',
          properties: {
            commits: {
              type: 'array',
              description: '从get_github_commits工具获取的提交记录数组。必须直接传递该工具返回的原始数据，不可修改或截断。如果提交数过多（超过50个），可以传入主要部分并在options中备注总数。',
              items: {
                type: 'object',
                properties: {
                  sha: { type: 'string', description: '提交的SHA哈希值' },
                  message: { type: 'string', description: '提交信息/commit message' },
                  author: {
                    type: 'object',
                    description: '提交作者信息',
                    properties: {
                      name: { type: 'string', description: '作者姓名' },
                      email: { type: 'string', description: '作者邮箱' },
                      date: { type: 'string', description: '提交日期(ISO格式)' },
                    },
                  },
                  url: { type: 'string', description: '提交的GitHub URL链接' },
                  repository: {
                    type: 'object',
                    description: '所属仓库信息',
                    properties: {
                      name: { type: 'string', description: '仓库名称' },
                      owner: { type: 'string', description: '仓库所有者' },
                    },
                  },
                },
              },
            },
            options: {
              type: 'object',
              description: '报告选项。如果用户未指定，使用默认值：professional风格、detailed长度、includeMetrics=true',
              properties: {
                style: {
                  type: 'string',
                  enum: ['professional', 'casual', 'technical'],
                  description: '报告风格：professional=专业正式(适合汇报)，casual=轻松友好(适合内部沟通)，technical=技术导向(包含技术细节)',
                },
                length: {
                  type: 'string',
                  enum: ['concise', 'detailed', 'comprehensive'],
                  description: '报告长度：concise=简洁(500字左右)，detailed=详细(800-1200字)，comprehensive=完整(1500字以上)',
                },
                includeMetrics: {
                  type: 'boolean',
                  description: '是否包含统计指标（提交数、功能/修复/优化分类等统计）。默认为true',
                },
              },
              required: ['style', 'length', 'includeMetrics'],
            },
          },
          required: ['commits', 'options'],
        },
      },
    },
  ];
}

/**
 * 执行工具调用
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  context: AgentContext
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    const toolStartTime = Date.now();
    try {
      const { name, arguments: argsStr } = toolCall.function;

      const args = JSON.parse(argsStr);

      let content: string;

      switch (name) {
        case 'get_github_commits':
          const commits = await getGitHubCommits(args, context);
          content = JSON.stringify(commits);
          break;

        case 'generate_report':
          const report = await generateReport(args, context);
          content = report;
          break;

        default:
          throw new Error(`未知的工具: ${name}`);
      }

      const toolDuration = Date.now() - toolStartTime;

      logger.info('agent', `tool_${name}`, {
        duration: toolDuration,
        metadata: { tool: name, success: true },
      });

      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name,
        content,
      });
    } catch (error) {
      const toolDuration = Date.now() - toolStartTime;
      const errorMessage = error instanceof Error ? error.message : '工具执行失败';

      logger.error('agent', `tool_${toolCall.function.name}`, errorMessage, {
        duration: toolDuration,
        metadata: { tool: toolCall.function.name, success: false },
      });

      // 返回结构化的错误信息，便于AI理解并给出友好的用户提示
      const errorType = errorMessage.includes('认证') || errorMessage.includes('token') || errorMessage.includes('401') ? 'auth_error'
        : errorMessage.includes('不存在') || errorMessage.includes('404') ? 'not_found'
        : errorMessage.includes('速率') || errorMessage.includes('429') ? 'rate_limit'
        : errorMessage.includes('空') || errorMessage.includes('empty') ? 'empty_repo'
        : errorMessage.includes('网络') || errorMessage.includes('timeout') ? 'network_error'
        : 'execution_error';

      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify({
          error: errorMessage,
          success: false,
          errorType,
          hint: errorType === 'not_found' ? '请告知用户仓库不存在，建议检查仓库名称拼写' :
            errorType === 'auth_error' ? '请告知用户认证失败，建议重新登录GitHub' :
            errorType === 'rate_limit' ? '请告知用户API速率限制，建议稍后重试' :
            errorType === 'empty_repo' ? '请告知用户该仓库为空，没有提交记录' :
            errorType === 'network_error' ? '请告知用户网络连接问题，建议检查网络后重试' :
            '请告知用户工具执行失败，并提供错误详情',
        }),
      });
    }
  }

  return results;
}
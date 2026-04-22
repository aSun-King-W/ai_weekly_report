// 工具定义和实现模块
import { GitHubCommit, ReportOptions, ToolDefinition, ToolCall, ToolResult, AgentContext } from '@/types';
import { getAIService } from './ai-service.ts';

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
  const { owner, repo, since, until, page = 1, per_page = 30 } = params;
  const { accessToken } = context;

  if (!accessToken) {
    throw new Error('未提供有效的GitHub访问令牌');
  }

  if (!owner || !repo) {
    throw new Error('缺少必要的参数：owner 和 repo');
  }

  // 调用GitHub API获取commit记录
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: Math.min(per_page, 100).toString(), // GitHub API限制每页最多100条
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
    console.error('GitHub API错误:', response.status, errorText);

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
  context: AgentContext
): Promise<string> {
  const { commits, options } = params;

  if (!commits || !Array.isArray(commits) || commits.length === 0) {
    throw new Error('提交记录不能为空');
  }

  if (!options) {
    throw new Error('报告选项不能为空');
  }

  // 验证环境变量
  if (!process.env.ANTHROPIC_API_KEY) {
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
        description: '获取指定GitHub仓库的提交记录。可以指定时间范围、分页参数等。',
        parameters: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: '仓库所有者的用户名或组织名',
            },
            repo: {
              type: 'string',
              description: '仓库名称',
            },
            since: {
              type: 'string',
              description: '起始日期（ISO格式，例如：2024-01-01T00:00:00Z）',
            },
            until: {
              type: 'string',
              description: '结束日期（ISO格式，例如：2024-01-07T23:59:59Z）',
            },
            page: {
              type: 'number',
              description: '页码，默认为1',
            },
            per_page: {
              type: 'number',
              description: '每页数量，默认为30，最大100',
            },
          },
          required: ['owner', 'repo'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_report',
        description: '基于GitHub提交记录生成周报。可以指定报告风格、长度和是否包含统计指标。',
        parameters: {
          type: 'object',
          properties: {
            commits: {
              type: 'array',
              description: 'GitHub提交记录数组',
              items: {
                type: 'object',
                properties: {
                  sha: { type: 'string' },
                  message: { type: 'string' },
                  author: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' },
                      date: { type: 'string' },
                    },
                  },
                  url: { type: 'string' },
                  repository: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      owner: { type: 'string' },
                    },
                  },
                },
              },
            },
            options: {
              type: 'object',
              description: '报告选项',
              properties: {
                style: {
                  type: 'string',
                  enum: ['professional', 'casual', 'technical'],
                  description: '报告风格',
                },
                length: {
                  type: 'string',
                  enum: ['concise', 'detailed', 'comprehensive'],
                  description: '报告长度',
                },
                includeMetrics: {
                  type: 'boolean',
                  description: '是否包含统计指标',
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
    try {
      const { name, arguments: argsStr } = toolCall.function;

      // 调试：记录arguments内容
      console.log(`[executeToolCalls] 工具: ${name}, arguments长度: ${argsStr?.length || 0}`);
      if (argsStr && argsStr.length > 1000) {
        console.log(`[executeToolCalls] arguments前1000字符: ${argsStr.substring(0, 1000)}`);
      } else if (argsStr) {
        console.log(`[executeToolCalls] arguments: ${argsStr}`);
      }

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

      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name,
        content,
      });
    } catch (error) {
      console.error(`执行工具 ${toolCall.function.name} 失败:`, error);

      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: JSON.stringify({
          error: error instanceof Error ? error.message : '工具执行失败',
          success: false,
        }),
      });
    }
  }

  return results;
}
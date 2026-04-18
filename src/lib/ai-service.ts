// AI服务模块 - 用于集成DeepSeek API生成周报
import OpenAI from 'openai';
import { GitHubCommit, ReportOptions, ReportResult } from '@/types';
import { cleanHyphenation } from '@/lib/utils';

export class AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    // DeepSeek API兼容OpenAI API格式
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  /**
   * 基于GitHub提交记录生成周报
   */
  async generateReport(commits: GitHubCommit[], options: ReportOptions): Promise<ReportResult> {
    const startTime = Date.now();

    try {
      // 构建提示词
      const systemPrompt = this.buildSystemPrompt(options);
      const userPrompt = this.buildUserPrompt(commits, options);

      // 调用DeepSeek API
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
        stream: false,
      });

      const generationTime = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || '';

      // 清理连字符问题 - 返回原始内容，让调用者根据需要处理
      const cleanedContent = content;
      // 注意：不再调用cleanHyphenation，让调用者决定如何处理

      // 如果没有生成内容，使用备用方案
      if (!cleanedContent.trim()) {
        return this.generateFallbackReport(commits, options, generationTime);
      }

      return {
        report: cleanedContent,
        metadata: {
          commitCount: commits.length,
          generationTime,
          style: options.style,
          length: options.length,
          tokenUsage: response.usage,
        },
      };
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(options: ReportOptions): string {
    const styleDescriptions = {
      professional: '专业、正式、商务风格，适合团队汇报。使用严谨的语言，突出工作成果和价值。',
      casual: '轻松、友好、非正式风格，适合内部沟通。可以使用轻松的语气，强调团队协作。',
      technical: '技术导向、详细、包含技术细节，适合技术团队。关注技术实现、架构改进和代码质量。',
    };

    const lengthDescriptions = {
      concise: '简洁明了，突出重点，控制在500字左右。',
      detailed: '详细全面，包含具体细节，800-1200字。',
      comprehensive: '完整详尽，包含所有相关信息，1500字以上。',
    };

    const style = styleDescriptions[options.style] || styleDescriptions.professional;
    const length = lengthDescriptions[options.length] || lengthDescriptions.detailed;

    return `你是一个专业的软件开发周报生成助手。请根据用户提供的GitHub提交记录生成高质量的周报。

报告要求：
1. 风格：${style}
2. 长度：${length}
3. 格式：使用Markdown格式，包含适当的标题和章节
4. 语言：使用中文

重要格式规范：
- 避免在单词或短语中间使用连字符（-）后换行
- 不要生成类似"AI-"、"真实-"、"开发-"等格式的文本
- 如果需要在行尾断开长单词，请使用完整的单词，不要使用连字符
- 确保文本的自然换行，不要人为添加连字符

重要原则：
- 基于实际的提交记录内容生成报告，不要虚构或添加无关内容
- 分析提交记录中的工作类型（功能开发、问题修复、重构、文档等）
- 识别重要的技术成就和业务价值
- 如果提交记录较少，可以适当详细描述每个提交的工作
- 如果提交记录很多，进行归纳总结，突出主要工作方向

报告结构建议：
1. 本周工作概览（整体进展和主要成果）
2. 主要工作内容（按功能/模块/任务分类）
3. 重要技术进展
4. 遇到的问题和解决方案（如果有）
5. 下周工作计划（基于当前工作进展推断）
6. 总结

请确保报告内容真实反映提交记录中的工作，不要包含模板化的固定内容。`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(commits: GitHubCommit[], options: ReportOptions): string {
    // 按日期分组提交记录，便于AI理解时间线
    const commitsByDate = new Map<string, GitHubCommit[]>();

    commits.forEach(commit => {
      const date = new Date(commit.author.date).toLocaleDateString('zh-CN');
      if (!commitsByDate.has(date)) {
        commitsByDate.set(date, []);
      }
      commitsByDate.get(date)!.push(commit);
    });

    // 构建格式化的提交记录文本
    let commitText = '';
    const sortedDates = Array.from(commitsByDate.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    sortedDates.forEach(date => {
      const dateCommits = commitsByDate.get(date)!;
      commitText += `\n## ${date}（${dateCommits.length}个提交）\n`;

      dateCommits.forEach((commit, index) => {
        const time = new Date(commit.author.date).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        commitText += `${index + 1}. [${time}] ${commit.message} (${commit.author.name})\n`;
      });
    });

    // 添加仓库信息（如果所有提交来自同一仓库）
    const repositories = new Set(commits.map(c => `${c.repository.owner}/${c.repository.name}`));
    const repoInfo = repositories.size === 1
      ? `\n仓库：${Array.from(repositories)[0]}`
      : `\n涉及仓库：${Array.from(repositories).join(', ')}`;

    // 添加时间范围
    const dates = commits.map(c => new Date(c.author.date));
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    const dateRange = `\n时间范围：${earliest.toLocaleDateString('zh-CN')} 至 ${latest.toLocaleDateString('zh-CN')}`;

    // 添加统计信息（如果用户要求）
    let metricsText = '';
    if (options.includeMetrics) {
      // 简单分析提交类型
      const commitMessages = commits.map(c => c.message.toLowerCase());
      const featureCount = commitMessages.filter(m =>
        m.includes('add') || m.includes('feat') || m.includes('implement') ||
        m.includes('功能') || m.includes('新增')
      ).length;

      const fixCount = commitMessages.filter(m =>
        m.includes('fix') || m.includes('bug') || m.includes('修复') ||
        m.includes('解决') || m.includes('问题')
      ).length;

      const refactorCount = commitMessages.filter(m =>
        m.includes('refactor') || m.includes('重构') || m.includes('优化') ||
        m.includes('improve') || m.includes('clean')
      ).length;

      metricsText = `\n\n统计信息：
- 提交总数：${commits.length}
- 功能开发：${featureCount}个提交
- 问题修复：${fixCount}个提交
- 代码优化：${refactorCount}个提交
- 其他类型：${commits.length - featureCount - fixCount - refactorCount}个提交`;
    }

    return `请基于以下GitHub提交记录生成周报：${repoInfo}${dateRange}

提交记录（按日期分组）：${commitText}${metricsText}

报告选项：
- 风格：${options.style}
- 长度：${options.length}
- 包含统计指标：${options.includeMetrics ? '是' : '否'}

请生成一份高质量的周报，真实反映上述工作内容。`;
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          return new Error('DeepSeek API密钥无效，请检查ANTHROPIC_API_KEY环境变量');
        case 429:
          return new Error('API调用频率限制，请稍后重试');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('AI服务暂时不可用，请稍后重试');
        default:
          return new Error(`DeepSeek API错误: ${error.message}`);
      }
    }

    // 网络错误
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('timeout') || message.includes('socket')) {
        return new Error('网络连接失败，请检查网络后重试');
      }
    }

    return new Error('未知的API错误，请稍后重试');
  }

  /**
   * 生成备用报告（当API调用失败时使用）
   */
  private generateFallbackReport(
    commits: GitHubCommit[],
    options: ReportOptions,
    generationTime: number
  ): ReportResult {
    // 简单汇总提交记录
    const commitSummary = commits
      .slice(0, 20) // 最多显示20个提交
      .map((commit, index) => {
        const date = new Date(commit.author.date).toLocaleDateString('zh-CN');
        return `${index + 1}. [${date}] ${commit.message}`;
      })
      .join('\n');

    const moreText = commits.length > 20 ? `\n...还有${commits.length - 20}个提交` : '';

    const report = `# 本周工作周报（基础版）

**生成时间**：${new Date().toLocaleDateString('zh-CN')}
**提交数量**：${commits.length}个
**报告风格**：${options.style}
**报告长度**：${options.length}

## 提交记录概览
${commitSummary}${moreText}

## 工作分类
基于提交信息分析，本周工作主要包括：
- 功能开发：${commits.filter(c => c.message.toLowerCase().includes('feat') || c.message.toLowerCase().includes('add')).length}个提交
- 问题修复：${commits.filter(c => c.message.toLowerCase().includes('fix') || c.message.toLowerCase().includes('bug')).length}个提交
- 代码优化：${commits.filter(c => c.message.toLowerCase().includes('refactor') || c.message.toLowerCase().includes('优化')).length}个提交

*注：由于AI服务暂时不可用，生成了基础版报告。建议稍后重试以获取更详细的AI分析报告。*`;

    return {
      report,
      metadata: {
        commitCount: commits.length,
        generationTime,
        style: options.style,
        length: options.length,
        isFallback: true,
      },
    };
  }
}

// 单例实例
let aiServiceInstance: AIService | null = null;

/**
 * 获取AIService实例（单例模式）
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY环境变量未设置');
    }

    aiServiceInstance = new AIService(apiKey);
  }

  return aiServiceInstance;
}
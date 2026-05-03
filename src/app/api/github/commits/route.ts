// GET /api/github/commits - 获取指定仓库的commit记录

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GitHubCommit } from '@/types';
import { CACHE_TTL, PAGINATION } from '@/lib/constants';
import { logger } from '@/lib/logger';

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

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('github', 'api_commits', {
        duration: Date.now() - startTime,
        metadata: { status: 401, reason: 'missing_auth' },
      });
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未提供有效的认证令牌',
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);

    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const since = searchParams.get('since');
    const until = searchParams.get('until');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '30');

    if (!owner || !repo) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少必要的参数：owner 和 repo',
      }, { status: 400 });
    }

    // 调用GitHub API获取commit记录
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: Math.min(perPage, PAGINATION.MAX_PAGE_SIZE).toString(),
    });

    if (since) {
      queryParams.append('since', since);
    }
    if (until) {
      queryParams.append('until', until);
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
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
            // 对于空仓库，返回空数组而不是错误
            const headers = new Headers();
            headers.set('Cache-Control', `public, max-age=${CACHE_TTL.GITHUB}, stale-while-revalidate=60`);

            return NextResponse.json<ApiResponse>({
              success: true,
              data: [],
            }, { headers });
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

      return NextResponse.json<ApiResponse>({
        success: false,
        error: errorMessage,
        message: errorText,
      }, { status: response.status });
    }

    const commitsData = await response.json();

    // 格式化响应数据
    const formattedCommits: GitHubCommit[] = commitsData.map((commit: GitHubApiCommit) => ({
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

    // 添加缓存头
    const headers = new Headers();
    headers.set('Cache-Control', `public, max-age=${CACHE_TTL.GITHUB}, stale-while-revalidate=60`);

    logger.info('github', 'api_commits', {
      duration: Date.now() - startTime,
      metadata: { owner, repo, commitCount: formattedCommits.length, status: 200 },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: formattedCommits,
    }, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('获取commit记录失败:', error);

    logger.error('github', 'api_commits', errorMessage, {
      duration: Date.now() - startTime,
      metadata: { status: 500 },
    });

    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取commit记录时发生错误',
      message: errorMessage,
    }, { status: 500 });
  }
}
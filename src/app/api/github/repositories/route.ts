// GET /api/github/repositories - 获取用户GitHub仓库列表

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { CACHE_TTL, PAGINATION } from '@/lib/constants';

// GitHub API响应类型
interface GitHubApiRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未提供有效的认证令牌',
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);

    // 获取分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || PAGINATION.DEFAULT_PAGE_SIZE.toString());
    const sort = searchParams.get('sort') || 'updated';
    const direction = searchParams.get('direction') || 'desc';

    // 调用GitHub API获取仓库列表
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: Math.min(perPage, PAGINATION.MAX_PAGE_SIZE).toString(),
      sort,
      direction,
    });

    const response = await fetch(`https://api.github.com/user/repos?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Weekly-Report-App',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API错误:', response.status, errorText);

      let errorMessage = `GitHub API错误: ${response.status} ${response.statusText}`;

      // 特定错误处理
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'GitHub认证失败，请重新登录';
      } else if (response.status === 404) {
        errorMessage = '资源不存在或无权访问';
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

    const reposData = await response.json();

    // 格式化响应数据
    const formattedRepositories = reposData.map((repo: GitHubApiRepository) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      updated_at: repo.updated_at,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
    }));

    // 添加缓存头
    const headers = new Headers();
    headers.set('Cache-Control', `public, max-age=${CACHE_TTL.GITHUB}, stale-while-revalidate=60`);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: formattedRepositories,
    }, { headers });
  } catch (error) {
    console.error('获取仓库列表失败:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取仓库列表时发生错误',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
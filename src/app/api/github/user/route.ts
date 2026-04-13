// GET /api/github/user - 获取GitHub用户信息

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { CACHE_TTL } from '@/lib/constants';

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

    // 调用GitHub API获取用户信息
    const response = await fetch('https://api.github.com/user', {
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
        errorMessage = '用户不存在或无权访问';
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

    const userData = await response.json();

    // 格式化响应数据
    const formattedUser = {
      login: userData.login,
      id: userData.id,
      avatar_url: userData.avatar_url,
      name: userData.name || userData.login,
      email: userData.email || null,
      bio: userData.bio || '',
      location: userData.location || '',
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };

    // 添加缓存头
    const headers = new Headers();
    headers.set('Cache-Control', `public, max-age=${CACHE_TTL.GITHUB}, stale-while-revalidate=60`);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: formattedUser,
    }, { headers });
  } catch (error) {
    console.error('获取用户信息失败:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取用户信息时发生错误',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
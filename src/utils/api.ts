// API工具函数

import { ApiResponse } from '@/types';

/**
 * 处理API响应，统一错误处理
 * @param response fetch响应对象
 * @returns 解析后的数据
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || data.message || 'Unknown API error');
  }

  return data.data as T;
}

/**
 * 安全的fetch包装函数
 * @param url 请求URL
 * @param options fetch选项
 * @returns 处理后的响应数据
 */
export async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return await handleApiResponse<T>(response);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * 创建带认证头的fetch选项
 * @param token 认证令牌
 * @param options 原始fetch选项
 * @returns 带认证头的选项
 */
export function withAuth(token: string, options?: RequestInit): RequestInit {
  return {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  };
}

/**
 * 创建API请求URL
 * @param endpoint API端点
 * @param params 查询参数
 * @returns 完整的URL
 */
export function createApiUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(endpoint, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param fn 要重试的函数
 * @param maxAttempts 最大尝试次数
 * @param delayMs 重试延迟
 * @returns 函数结果
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        await delay(delayMs * attempt); // 指数退避
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
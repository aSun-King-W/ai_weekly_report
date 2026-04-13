// GitHub数据获取钩子

import { useState, useCallback } from 'react';
import { GitHubCommit } from '@/types';
import { safeFetch } from '@/utils/api';

/**
 * GitHub仓库信息
 */
export interface GitHubRepository {
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
}

/**
 * GitHub用户信息
 */
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * 使用GitHub数据的钩子
 */
export function useGitHub() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取用户仓库列表
   */
  const fetchRepositories = useCallback(async (token: string): Promise<GitHubRepository[]> => {
    setLoading(true);
    setError(null);

    try {
      const repos = await safeFetch<GitHubRepository[]>('/api/github/repositories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return repos;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取仓库列表失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取仓库的提交记录
   */
  const fetchCommits = useCallback(async (
    token: string,
    owner: string,
    repo: string,
    since?: string,
    until?: string,
    page = 1,
    perPage = 30
  ): Promise<GitHubCommit[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        owner,
        repo,
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (since) params.append('since', since);
      if (until) params.append('until', until);

      const commits = await safeFetch<GitHubCommit[]>(`/api/github/commits?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return commits;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取提交记录失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取用户信息
   */
  const fetchUserInfo = useCallback(async (token: string): Promise<GitHubUser> => {
    setLoading(true);
    setError(null);

    try {
      const user = await safeFetch<GitHubUser>('/api/github/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用户信息失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchRepositories,
    fetchCommits,
    fetchUserInfo,
  };
}
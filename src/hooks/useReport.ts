// 报告生成钩子

import { useState, useCallback } from 'react';
import { GitHubCommit, ReportOptions, ReportResult } from '@/types';
import { safeFetch } from '@/utils/api';

/**
 * 报告历史记录
 */
export interface ReportHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  commitCount: number;
  style: string;
  length: string;
  preview: string;
}

/**
 * 使用报告生成的钩子
 */
export function useReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  /**
   * 生成周报
   */
  const generateReport = useCallback(async (
    commits: GitHubCommit[],
    options: ReportOptions
  ): Promise<ReportResult> => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await safeFetch<ReportResult>('/api/generate/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commits,
          options,
        }),
      });

      setReport(result.report);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成报告失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 保存报告
   */
  const saveReport = useCallback(async (reportId: string, reportData: Record<string, unknown>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await safeFetch('/api/report/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reportId,
          ...reportData,
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存报告失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取报告历史
   */
  const fetchReportHistory = useCallback(async (token: string): Promise<ReportHistoryItem[]> => {
    setLoading(true);
    setError(null);

    try {
      const history = await safeFetch<ReportHistoryItem[]>('/api/report/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return history;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取报告历史失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 清空当前报告
   */
  const clearReport = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    report,
    generateReport,
    saveReport,
    fetchReportHistory,
    clearReport,
  };
}
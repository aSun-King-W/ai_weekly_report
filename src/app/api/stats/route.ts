// GET /api/stats - 返回日志聚合统计信息

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const stats = logger.getStats();
    const recentLogs = logger.getRecentLogs(20);

    const moduleSummary = Object.entries(stats.moduleStats).map(([module, data]) => ({
      module,
      requests: data.count,
      errors: data.errors,
      avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      errorRate: data.count > 0 ? Number(((data.errors / data.count) * 100).toFixed(1)) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRequests: stats.totalRequests,
          successCount: stats.successCount,
          errorCount: stats.errorCount,
          successRate: stats.totalRequests > 0
            ? Number(((stats.successCount / stats.totalRequests) * 100).toFixed(1))
            : 100,
          avgDuration: stats.totalRequests > 0
            ? Math.round(stats.totalDuration / stats.totalRequests)
            : 0,
          totalTokensUsed: stats.totalTokens,
        },
        modules: moduleSummary,
        errorTypes: stats.errorTypes,
        activity: {
          hourly: stats.hourlyActivity,
          daily: stats.dailyActivity,
        },
        recentLogs: recentLogs.map(log => ({
          time: log.timestamp,
          level: log.level,
          module: log.module,
          action: log.action,
          duration: log.duration,
          success: log.success,
          error: log.error,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '获取统计信息失败',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

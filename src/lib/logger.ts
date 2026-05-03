// 结构化日志工具 - 支持文件输出和内存聚合
import fs from 'fs';
import path from 'path';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogModule = 'agent' | 'ai-service' | 'github' | 'auth';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: LogModule;
  action: string;
  duration?: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface StatsAggregation {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  totalDuration: number;
  totalTokens: number;
  moduleStats: Record<string, { count: number; errors: number; totalDuration: number }>;
  errorTypes: Record<string, number>;
  hourlyActivity: Record<string, number>;
  dailyActivity: Record<string, number>;
}

class Logger {
  private buffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  private logDir: string;
  private statsCache: StatsAggregation | null = null;
  private statsCacheTime = 0;
  private statsCacheTtl = 5000; // 5 seconds

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
  }

  private ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch {
      // 在生产环境中可能没有文件写入权限，静默降级
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().slice(0, 10); // 2026-05-03
    return path.join(this.logDir, `${date}.jsonl`);
  }

  log(entry: Omit<LogEntry, 'timestamp'>) {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // 写入缓冲区（用于 Stats API）
    this.buffer.push(fullEntry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.maxBufferSize);
    }

    // 写入文件（按日期轮转）
    this.writeToFile(fullEntry);

    // 清除统计缓存
    this.statsCache = null;
  }

  private writeToFile(entry: LogEntry) {
    try {
      const filePath = this.getLogFileName();
      fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf-8');
    } catch {
      // 文件写入失败时静默降级
    }
  }

  // ── 便捷方法 ──

  info(module: LogModule, action: string, data?: Partial<LogEntry>) {
    this.log({ level: 'info', module, action, success: true, ...data });
  }

  warn(module: LogModule, action: string, data?: Partial<LogEntry>) {
    this.log({ level: 'warn', module, action, success: false, ...data });
  }

  error(module: LogModule, action: string, error: string, data?: Partial<LogEntry>) {
    this.log({ level: 'error', module, action, success: false, error, ...data });
  }

  // ── 统计聚合 ──

  getStats(): StatsAggregation {
    const now = Date.now();
    if (this.statsCache && now - this.statsCacheTime < this.statsCacheTtl) {
      return this.statsCache;
    }

    const entries = [...this.buffer];
    const stats: StatsAggregation = {
      totalRequests: entries.length,
      successCount: 0,
      errorCount: 0,
      totalDuration: 0,
      totalTokens: 0,
      moduleStats: {},
      errorTypes: {},
      hourlyActivity: {},
      dailyActivity: {},
    };

    for (const entry of entries) {
      if (entry.success) stats.successCount++;
      else stats.errorCount++;

      if (entry.duration) stats.totalDuration += entry.duration;
      if (entry.tokenUsage?.total) stats.totalTokens += entry.tokenUsage.total;

      // 按模块统计
      if (!stats.moduleStats[entry.module]) {
        stats.moduleStats[entry.module] = { count: 0, errors: 0, totalDuration: 0 };
      }
      stats.moduleStats[entry.module].count++;
      if (!entry.success) stats.moduleStats[entry.module].errors++;
      if (entry.duration) stats.moduleStats[entry.module].totalDuration += entry.duration;

      // 错误分类
      if (!entry.success && entry.error) {
        const errorKey = this.categorizeError(entry.error);
        stats.errorTypes[errorKey] = (stats.errorTypes[errorKey] || 0) + 1;
      }

      // 时间维度
      const hour = entry.timestamp.slice(11, 13);
      stats.hourlyActivity[hour] = (stats.hourlyActivity[hour] || 0) + 1;
      const day = entry.timestamp.slice(0, 10);
      stats.dailyActivity[day] = (stats.dailyActivity[day] || 0) + 1;
    }

    this.statsCache = stats;
    this.statsCacheTime = now;
    return stats;
  }

  private categorizeError(error: string): string {
    const lower = error.toLowerCase();
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('auth')) return 'auth_error';
    if (lower.includes('429') || lower.includes('rate limit')) return 'rate_limit';
    if (lower.includes('timeout') || lower.includes('network') || lower.includes('econn')) return 'network_error';
    if (lower.includes('500') || lower.includes('502') || lower.includes('503')) return 'server_error';
    if (lower.includes('tool') || lower.includes('execution')) return 'tool_execution_error';
    if (lower.includes('parse') || lower.includes('json')) return 'parse_error';
    return 'other';
  }

  getRecentLogs(limit = 50): LogEntry[] {
    return this.buffer.slice(-limit).reverse();
  }

  getLogsByModule(module: LogModule, limit = 20): LogEntry[] {
    return this.buffer.filter(e => e.module === module).slice(-limit).reverse();
  }
}

// 全局单例
export const logger = new Logger();

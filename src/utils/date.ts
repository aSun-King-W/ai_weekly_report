// 日期时间工具函数

/**
 * 获取本周的开始和结束日期（周一至周日）
 * @returns { start: Date, end: Date } 本周的开始和结束日期
 */
export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六
  const diffToMonday = day === 0 ? -6 : 1 - day; // 如果是周日，则向前推6天；否则计算到周一的差值

  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setUTCHours(0, 0, 0, 0); // 使用UTC时间

  const end = new Date(start);
  end.setDate(start.getDate() + 7); // 下一周的周一
  end.setUTCHours(0, 0, 0, -1); // 减去1毫秒，包含整周（UTC时间23:59:59.999）

  return { start, end };
}

/**
 * 获取上周的开始和结束日期
 * @returns { start: Date, end: Date } 上周的开始和结束日期
 */
export function getLastWeekRange(): { start: Date; end: Date } {
  const { start } = getThisWeekRange();
  const lastWeekStart = new Date(start);
  lastWeekStart.setDate(start.getDate() - 7);

  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 7); // 下一周的周一
  lastWeekEnd.setUTCHours(0, 0, 0, -1); // 减去1毫秒，包含整周（UTC时间23:59:59.999）

  return { start: lastWeekStart, end: lastWeekEnd };
}

/**
 * 获取最近N天的日期范围
 * @param days 天数
 * @returns { start: Date, end: Date } 日期范围
 */
export function getLastNDaysRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  end.setDate(end.getDate() + 1); // 明天
  end.setUTCHours(0, 0, 0, -1); // 减去1毫秒，包含今天（UTC时间23:59:59.999）

  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  start.setUTCHours(0, 0, 0, 0); // UTC时间00:00:00.000

  return { start, end };
}

/**
 * 格式化日期为YYYY-MM-DD字符串
 * @param date 日期对象
 * @returns 格式化的日期字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为GitHub API所需的ISO格式（包含时间部分）
 * @param date 日期对象
 * @returns ISO格式的日期时间字符串
 */
export function formatDateForGitHub(date: Date): string {
  // GitHub API需要完整的ISO 8601格式，包含时间部分
  return date.toISOString();
}

/**
 * 格式化日期时间为ISO字符串（不含时区信息）
 * @param date 日期对象
 * @returns ISO格式的日期时间字符串
 */
export function formatDateTime(date: Date): string {
  return date.toISOString().slice(0, 19);
}

/**
 * 计算两个日期之间的天数差
 * @param start 开始日期
 * @param end 结束日期
 * @returns 天数差
 */
export function getDaysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * 检查日期是否在范围内
 * @param date 要检查的日期
 * @param start 范围开始
 * @param end 范围结束
 * @returns 是否在范围内
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}
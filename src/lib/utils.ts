// 工具函数

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并Tailwind CSS类名
 * 使用clsx和tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化数字，添加千位分隔符
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 截断文本
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + suffix;
}

/**
 * 生成随机ID
 */
export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[key] = deepMerge(result[key] as any, source[key] as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[key] = source[key] as any;
    }
  }

  return result;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 检查是否在浏览器环境
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * 安全获取localStorage
 */
export function getLocalStorage<T = unknown>(key: string, defaultValue: T | null = null): T | null {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as T : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全设置localStorage
 */
export function setLocalStorage(key: string, value: unknown): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to set localStorage:', error);
  }
}

/**
 * 移除localStorage
 */
export function removeLocalStorage(key: string): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove localStorage:', error);
  }
}
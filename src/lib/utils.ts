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

/**
 * 清理文本中的连字符换行问题
 * 处理"AI-"、"真实-"等跨行连字符问题
 *
 * 新增功能：
 * 1. 支持替换为不间断连字符（\u2011），防止PDF中强制换行
 * 2. 更全面的中英文混合连字符处理
 * 3. 保护合法的连字符使用（如日期、URL等）
 */
export function cleanHyphenation(text: string, options: { useNonBreakingHyphen?: boolean } = {}): string {
  if (!text) return text;

  const { useNonBreakingHyphen = true } = options;

  // 第一步：处理跨行连字符问题
  let result = text;

  // 处理跨行连字符：单词-换行-单词
  if (useNonBreakingHyphen) {
    // 对于PDF生成：使用不间断连字符并移除换行
    result = result.replace(/(\S+)-(\r?\n\s*)(\S+)/g, '$1\u2011$3');
  } else {
    // 对于网页显示：保留换行符，只移除连字符周围的空格
    result = result.replace(/(\S+)-(\r?\n\s*)(\S+)/g, '$1$2$3');
  }

  // 处理行尾连字符（后面可能有空格）
  result = result.replace(/(\S+)-\s*$/gm, '$1');
  // 处理行首连字符
  result = result.replace(/^\s*-(\S+)/gm, '$1');

  // 第二步：保护合法的连字符使用
  // 保护日期格式：YYYY-MM-DD
  const datePattern = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;
  const dateMatches: Array<{ original: string; replacement: string }> = [];
  let match;
  while ((match = datePattern.exec(result)) !== null) {
    dateMatches.push({
      original: match[0],
      replacement: match[1] + '\u2011DATE\u2011' + match[2] + '\u2011DATE\u2011' + match[3]
    });
  }

  // 保护URL中的连字符
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urlMatches: Array<{ original: string; replacement: string }> = [];
  while ((match = urlPattern.exec(result)) !== null) {
    if (match[0].includes('-')) {
      urlMatches.push({
        original: match[0],
        replacement: match[0].replace(/-/g, '\u2011URL\u2011')
      });
    }
  }

  // 暂时替换受保护的内容
  dateMatches.forEach((m, i) => {
    result = result.replace(m.original, `__DATE_PLACEHOLDER_${i}__`);
  });
  urlMatches.forEach((m, i) => {
    result = result.replace(m.original, `__URL_PLACEHOLDER_${i}__`);
  });

  // 第三步：处理常见的错误连字符模式
  // 处理中英文混合的连字符（中间有空格）
  result = result.replace(/([\u4e00-\u9fffA-Za-z]+)-\s+([\u4e00-\u9fffA-Za-z]+)/g,
    useNonBreakingHyphen ? '$1\u2011$2' : '$1$2');

  // 处理数字和字母混合的连字符
  result = result.replace(/([A-Za-z0-9]+)-\s+([A-Za-z0-9]+)/g,
    useNonBreakingHyphen ? '$1\u2011$2' : '$1$2');

  // 清理多余的连字符（前后有空格），但保护Markdown列表项（行开头的" - "）
  if (useNonBreakingHyphen) {
    // 对于PDF生成：清理所有"空格-空格"模式
    result = result.replace(/\s+-\s+/g, ' ');
  } else {
    // 对于网页显示：不清理行开头的" - "（Markdown列表）
    // 使用更复杂的正则，避免匹配行开头的" - "
    result = result.replace(/(?<=\S)\s+-\s+/g, ' ');
  }

  // 处理单词内部的错误连字符（如"AI-"、"ML-"等）
  result = result.replace(/\b(AI|ML|API|UI|UX|SDK|HTTP|HTTPS|JSON|XML|HTML|CSS|JS|TS|PHP|PY|GO|JAVA|C\+\+|C#|SQL|NOSQL|REACT|VUE|ANGULAR|NODE)-\s*/g,
    useNonBreakingHyphen ? '$1\u2011' : '$1');

  // 处理中文技术术语后的连字符
  result = result.replace(/(算法|模型|框架|系统|平台|服务|接口|协议|标准|规范)-\s*/g,
    useNonBreakingHyphen ? '$1\u2011' : '$1');

  // 第四步：将普通连字符替换为不间断连字符（防止PDF强制换行）
  if (useNonBreakingHyphen) {
    // 替换普通连字符为不间断连字符，但避免破坏单词边界
    result = result.replace(/(\w)-(\w)/g, '$1\u2011$2');
    // 处理中文-英文、英文-中文之间的连字符
    result = result.replace(/([\u4e00-\u9fff])-([A-Za-z])/g, '$1\u2011$2');
    result = result.replace(/([A-Za-z])-([\u4e00-\u9fff])/g, '$1\u2011$2');
  }

  // 第五步：恢复受保护的内容
  dateMatches.forEach((m, i) => {
    result = result.replace(`__DATE_PLACEHOLDER_${i}__`,
      useNonBreakingHyphen ? m.replacement.replace(/\u2011DATE\u2011/g, '-') : m.original);
  });
  urlMatches.forEach((m, i) => {
    result = result.replace(`__URL_PLACEHOLDER_${i}__`,
      useNonBreakingHyphen ? m.replacement.replace(/\u2011URL\u2011/g, '-') : m.original);
  });

  // 第六步：清理可能因替换产生的多余空格，但保留换行符
  // 只将多个连续空格和制表符替换为单个空格，保留换行符
  result = result
    .replace(/[ \t]+/g, ' ')  // 匹配多个连续空格或制表符
    .replace(/^[ \t]+|[ \t]+$/gm, '')  // 清理每行开头和结尾的空格/制表符
    .trim();

  return result;
}
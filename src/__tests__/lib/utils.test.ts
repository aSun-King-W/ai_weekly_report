import {
  cn,
  formatNumber,
  truncate,
  generateId,
  deepMerge,
  debounce,
  throttle,
  isBrowser,
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  cleanHyphenation,
} from '../../lib/utils.ts';

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toBe('base visible');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatNumber', () => {
  it('formats with thousands separator', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('truncate', () => {
  it('returns original text when under maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates text exceeding maxLength', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('uses custom suffix', () => {
    expect(truncate('hello world', 5, ' [more]')).toBe('hello [more]');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('handles exact maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('generateId', () => {
  it('generates string of default length 8', () => {
    expect(generateId()).toHaveLength(8);
  });

  it('generates string of specified length', () => {
    expect(generateId(16)).toHaveLength(16);
  });

  it('only contains alphanumeric characters', () => {
    const id = generateId(100);
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('generates different IDs on successive calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('deepMerge', () => {
  it('merges simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    expect(deepMerge(target, source)).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('deeply merges nested objects', () => {
    const target = { a: { x: 1, y: 2 }, b: 3 };
    const source = { a: { y: 99, z: 100 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { x: 1, y: 99, z: 100 }, b: 3 });
  });

  it('does not mutate the target', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { c: 3 } };
    const result = deepMerge(target, source);
    expect(target).toEqual({ a: 1, b: { c: 2 } });
    expect(result).toEqual({ a: 1, b: { c: 3 } });
  });

  it('replaces arrays, does not merge them', () => {
    const target = { items: [1, 2, 3] };
    const source = { items: [4, 5] };
    expect(deepMerge(target, source)).toEqual({ items: [4, 5] });
  });
});

describe('debounce', () => {
  jest.useFakeTimers();

  it('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels previous pending call on rapid invocations', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    debounced();
    debounced();
    debounced();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  jest.useFakeTimers();

  it('executes immediately on first call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('blocks subsequent calls within limit', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows calls after limit passes', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    jest.advanceTimersByTime(200);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('isBrowser', () => {
  it('returns false in Node.js environment', () => {
    expect(isBrowser).toBe(false);
  });
});

describe('localStorage utilities (Node environment)', () => {
  it('getLocalStorage returns default in Node', () => {
    expect(getLocalStorage('test')).toBeNull();
    expect(getLocalStorage('test', { fallback: true })).toEqual({ fallback: true });
  });

  it('setLocalStorage does not throw in Node', () => {
    expect(() => setLocalStorage('test', { key: 'value' })).not.toThrow();
  });

  it('removeLocalStorage does not throw in Node', () => {
    expect(() => removeLocalStorage('test')).not.toThrow();
  });
});

describe('cleanHyphenation', () => {
  it('handles empty input', () => {
    expect(cleanHyphenation('')).toBe('');
    expect(cleanHyphenation(undefined as unknown as string)).toBe(undefined);
    expect(cleanHyphenation(null as unknown as string)).toBe(null);
  });

  it('protects dates in YYYY-MM-DD format', () => {
    const input = '日期范围：2024-01-15 至 2024-12-31';
    const result = cleanHyphenation(input, { useNonBreakingHyphen: false });
    expect(result).toContain('2024-01-15');
    expect(result).toContain('2024-12-31');
    expect(result).not.toContain('2024‑01‑15');
  });

  it('converts hyphen to non-breaking hyphen by default', () => {
    const result = cleanHyphenation('AI-技术');
    expect(result).not.toContain('AI-');
  });

  it('handles trailing hyphen at line end', () => {
    const result = cleanHyphenation('line end- ', { useNonBreakingHyphen: false });
    expect(result).not.toContain('end-');
  });

  it('does not break code blocks', () => {
    const input = '文本\n```\nconst x = 1;\n```\n更多文本';
    const result = cleanHyphenation(input);
    expect(result).toContain('const x = 1;');
  });

  it('does not break inline code', () => {
    const input = '使用 `npx tsc` 命令编译';
    const result = cleanHyphenation(input);
    expect(result).toContain('`npx tsc`');
  });

  it('removes empty list items', () => {
    const input = '列表项\n- \n- 有内容';
    const result = cleanHyphenation(input);
    expect(result).not.toContain('- \n');
    expect(result).toContain('有内容');
  });
});

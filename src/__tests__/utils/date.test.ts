import {
  formatDate,
  getThisWeekRange,
  getLastWeekRange,
  getLastNDaysRange,
  getDaysBetween,
  isDateInRange,
  formatDateForGitHub,
  formatDateTime,
} from '../../utils/date.ts';

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });

  it('pads single-digit month and day', () => {
    const date = new Date('2024-03-05');
    expect(formatDate(date)).toBe('2024-03-05');
  });

  it('handles December date', () => {
    const date = new Date('2024-12-25');
    expect(formatDate(date)).toBe('2024-12-25');
  });

  it('handles leap year February 29', () => {
    const date = new Date('2024-02-29');
    expect(formatDate(date)).toBe('2024-02-29');
  });
});

describe('getThisWeekRange', () => {
  it('returns start (Monday) and end (Sunday) of current week', () => {
    const { start, end } = getThisWeekRange();
    // Use getUTCDay() because setUTCHours sets UTC time, but getDay() returns
    // local time which may differ from UTC day in timezones ahead of UTC
    expect(start.getUTCDay()).toBe(1); // Monday
    expect(end.getUTCDay()).toBe(0);  // Sunday
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });
});

describe('getLastWeekRange', () => {
  it('returns a 7-day range ending before this week', () => {
    const { start, end } = getLastWeekRange();
    const thisWeek = getThisWeekRange();
    expect(end.getTime()).toBeLessThan(thisWeek.start.getTime());
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });
});

describe('getLastNDaysRange', () => {
  it('returns a range for N=7', () => {
    const { start, end } = getLastNDaysRange(7);
    const diffDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it('returns a range for N=1', () => {
    const { start, end } = getLastNDaysRange(1);
    const diffMs = end.getTime() - start.getTime();
    expect(diffMs).toBeGreaterThanOrEqual(0);
    expect(diffMs).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it('end time is close to 00:00:00 UTC of tomorrow', () => {
    const { end } = getLastNDaysRange(7);
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
  });
});

describe('getDaysBetween', () => {
  it('returns 0 for same day', () => {
    const d = new Date('2024-01-15');
    expect(getDaysBetween(d, d)).toBe(0);
  });

  it('returns 1 for consecutive days', () => {
    const d1 = new Date('2024-01-15');
    const d2 = new Date('2024-01-16');
    expect(getDaysBetween(d1, d2)).toBe(1);
  });

  it('returns 7 for a week apart', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-08');
    expect(getDaysBetween(d1, d2)).toBe(7);
  });

  it('handles negative difference (start after end)', () => {
    const d1 = new Date('2024-01-15');
    const d2 = new Date('2024-01-10');
    expect(getDaysBetween(d1, d2)).toBe(-5);
  });

  it('handles year boundary', () => {
    const d1 = new Date('2024-12-31');
    const d2 = new Date('2025-01-01');
    expect(getDaysBetween(d1, d2)).toBe(1);
  });
});

describe('isDateInRange', () => {
  const start = new Date('2024-01-01');
  const end = new Date('2024-01-31');

  it('returns true for date inside range', () => {
    const date = new Date('2024-01-15');
    expect(isDateInRange(date, start, end)).toBe(true);
  });

  it('returns true for start boundary', () => {
    expect(isDateInRange(start, start, end)).toBe(true);
  });

  it('returns true for end boundary', () => {
    expect(isDateInRange(end, start, end)).toBe(true);
  });

  it('returns false for date before range', () => {
    const date = new Date('2023-12-31');
    expect(isDateInRange(date, start, end)).toBe(false);
  });

  it('returns false for date after range', () => {
    const date = new Date('2024-02-01');
    expect(isDateInRange(date, start, end)).toBe(false);
  });
});

describe('formatDateForGitHub', () => {
  it('returns ISO 8601 string', () => {
    const date = new Date('2024-01-15T12:30:00Z');
    const result = formatDateForGitHub(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result).toBe(date.toISOString());
  });
});

describe('formatDateTime', () => {
  it('returns YYYY-MM-DDTHH:mm:ss format', () => {
    const date = new Date('2024-01-15T12:30:45Z');
    const result = formatDateTime(date);
    expect(result).toBe('2024-01-15T12:30:45');
  });

  it('does not include timezone or milliseconds', () => {
    const date = new Date('2024-01-15T12:30:45.123Z');
    const result = formatDateTime(date);
    expect(result).not.toContain('Z');
    expect(result).not.toContain('.');
  });
});

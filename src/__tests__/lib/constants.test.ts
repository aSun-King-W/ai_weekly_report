import {
  GITHUB_API_BASE,
  GITHUB_OAUTH_URL,
  GITHUB_TOKEN_URL,
  CACHE_TTL,
  REPORT_STYLES,
  REPORT_LENGTHS,
  TIME_RANGES,
  DEFAULT_REPORT_OPTIONS,
  PAGINATION,
} from '../../lib/constants.ts';

describe('GitHub API constants', () => {
  it('GITHUB_API_BASE is correct', () => {
    expect(GITHUB_API_BASE).toBe('https://api.github.com');
  });

  it('GITHUB_OAUTH_URL is correct', () => {
    expect(GITHUB_OAUTH_URL).toBe('https://github.com/login/oauth/authorize');
  });

  it('GITHUB_TOKEN_URL is correct', () => {
    expect(GITHUB_TOKEN_URL).toBe('https://github.com/login/oauth/access_token');
  });
});

describe('CACHE_TTL', () => {
  it('GITHUB cache is 300s (5 min)', () => {
    expect(CACHE_TTL.GITHUB).toBe(300);
  });

  it('AI cache is 3600s (1 hr)', () => {
    expect(CACHE_TTL.AI).toBe(3600);
  });

  it('USER cache is 1800s (30 min)', () => {
    expect(CACHE_TTL.USER).toBe(1800);
  });

  it('all cache values are positive integers', () => {
    expect(CACHE_TTL.GITHUB).toBeGreaterThan(0);
    expect(CACHE_TTL.AI).toBeGreaterThan(0);
    expect(CACHE_TTL.USER).toBeGreaterThan(0);
  });
});

describe('REPORT_STYLES', () => {
  it('contains 3 styles', () => {
    expect(REPORT_STYLES).toHaveLength(3);
  });

  it('includes professional, casual, technical', () => {
    const values = REPORT_STYLES.map(s => s.value);
    expect(values).toContain('professional');
    expect(values).toContain('casual');
    expect(values).toContain('technical');
  });

  it('each entry has value and label', () => {
    for (const style of REPORT_STYLES) {
      expect(style).toHaveProperty('value');
      expect(style).toHaveProperty('label');
    }
  });
});

describe('REPORT_LENGTHS', () => {
  it('contains 3 lengths', () => {
    expect(REPORT_LENGTHS).toHaveLength(3);
  });

  it('includes concise, detailed, comprehensive', () => {
    const values = REPORT_LENGTHS.map(l => l.value);
    expect(values).toContain('concise');
    expect(values).toContain('detailed');
    expect(values).toContain('comprehensive');
  });
});

describe('TIME_RANGES', () => {
  it('contains 5 time ranges', () => {
    expect(TIME_RANGES).toHaveLength(5);
  });

  it('each entry has value, label, and days', () => {
    for (const range of TIME_RANGES) {
      expect(range).toHaveProperty('value');
      expect(range).toHaveProperty('label');
      expect(typeof range.days).toBe('number');
    }
  });

  it('custom range has days=0', () => {
    const custom = TIME_RANGES.find(r => r.value === 'custom');
    expect(custom?.days).toBe(0);
  });

  it('standard ranges have positive days', () => {
    const standard = TIME_RANGES.filter(r => r.value !== 'custom');
    for (const range of standard) {
      expect(range.days).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_REPORT_OPTIONS', () => {
  it('defaults to professional style', () => {
    expect(DEFAULT_REPORT_OPTIONS.style).toBe('professional');
  });

  it('defaults to detailed length', () => {
    expect(DEFAULT_REPORT_OPTIONS.length).toBe('detailed');
  });

  it('defaults includeMetrics to true', () => {
    expect(DEFAULT_REPORT_OPTIONS.includeMetrics).toBe(true);
  });
});

describe('PAGINATION', () => {
  it('DEFAULT_PAGE_SIZE is 30', () => {
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(30);
  });

  it('MAX_PAGE_SIZE is 100', () => {
    expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);
  });

  it('MAX_PAGE_SIZE >= DEFAULT_PAGE_SIZE', () => {
    expect(PAGINATION.MAX_PAGE_SIZE).toBeGreaterThanOrEqual(PAGINATION.DEFAULT_PAGE_SIZE);
  });
});

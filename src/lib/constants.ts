// 应用常量配置

// GitHub API配置
export const GITHUB_API_BASE = 'https://api.github.com';
export const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

// 缓存时间配置（秒）
export const CACHE_TTL = {
  GITHUB: 300,      // 5分钟
  CLAUDE: 3600,     // 1小时
  USER: 1800,       // 30分钟
};

// 报告风格选项
export const REPORT_STYLES = [
  { value: 'professional', label: '专业风格' },
  { value: 'casual', label: '轻松风格' },
  { value: 'technical', label: '技术风格' },
] as const;

// 报告长度选项
export const REPORT_LENGTHS = [
  { value: 'concise', label: '简洁版' },
  { value: 'detailed', label: '详细版' },
  { value: 'comprehensive', label: '完整版' },
] as const;

// 时间范围选项
export const TIME_RANGES = [
  { value: 'this-week', label: '本周', days: 7 },
  { value: 'last-week', label: '上周', days: 7 },
  { value: 'last-7-days', label: '最近7天', days: 7 },
  { value: 'last-30-days', label: '最近30天', days: 30 },
  { value: 'custom', label: '自定义', days: 0 },
] as const;

// 默认配置
export const DEFAULT_REPORT_OPTIONS = {
  style: 'professional' as const,
  length: 'detailed' as const,
  includeMetrics: true,
};

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 30,
  MAX_PAGE_SIZE: 100,
};
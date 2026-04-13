// GitHub相关类型
export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  repository: {
    name: string;
    owner: string;
  };
}

// 报告选项类型
export interface ReportOptions {
  style: 'professional' | 'casual' | 'technical';
  length: 'concise' | 'detailed' | 'comprehensive';
  includeMetrics: boolean;
}

// 报告结果类型
export interface ReportResult {
  report: string;
  metadata: {
    commitCount: number;
    generationTime: number;
    style: string;
    length: string;
  };
}

// 用户会话类型
export interface UserSession {
  user: {
    name: string;
    email: string;
    image?: string;
  };
  accessToken?: string;
  expires: string;
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
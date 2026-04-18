// 仪表板页面
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { GitHubRepository } from '@/hooks/useGitHub';
import {
  Calendar,
  ChevronRight,
  FolderGit,
  GitCommit,
  Loader2,
  Sparkles,
  Clock,
  Filter
} from 'lucide-react';
import { useGitHub } from '@/hooks/useGitHub';
import { useReport } from '@/hooks/useReport';
import { GitHubCommit, ReportOptions } from '@/types';
import { REPORT_STYLES, REPORT_LENGTHS, TIME_RANGES, DEFAULT_REPORT_OPTIONS } from '@/lib/constants';
import { getThisWeekRange, getLastWeekRange, getLastNDaysRange, formatDateForGitHub } from '@/utils/date';
import { cn, cleanHyphenation } from '@/lib/utils';
import { downloadReportPDF } from '@/utils/pdf';
import { downloadMarkdownReport } from '@/utils/markdown';
import ReactMarkdown from 'react-markdown';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { loading: githubLoading, error: githubError, fetchRepositories, fetchCommits } = useGitHub();
  const { loading: reportLoading, error: reportError, report, generateReport } = useReport();

  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [timeRange, setTimeRange] = useState<string>('this-week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportOptions, setReportOptions] = useState<ReportOptions>(DEFAULT_REPORT_OPTIONS);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingMarkdown, setExportingMarkdown] = useState(false);

  const loadRepositories = async () => {
    if (!session?.accessToken) return;

    try {
      const repos = await fetchRepositories(session.accessToken);
      setRepositories(repos);
      if (repos.length > 0 && !selectedRepo) {
        setSelectedRepo(repos[0].full_name);
      }
    } catch (err) {
      console.error('加载仓库失败:', err);
    }
  };

  const loadCommits = async () => {
    if (!session?.accessToken || !selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    let since: string | undefined;
    let until: string | undefined;

    // 根据选择的时间范围计算日期
    switch (timeRange) {
      case 'this-week':
        const thisWeek = getThisWeekRange();
        since = formatDateForGitHub(thisWeek.start);
        until = formatDateForGitHub(thisWeek.end);
        break;
      case 'last-week':
        const lastWeek = getLastWeekRange();
        since = formatDateForGitHub(lastWeek.start);
        until = formatDateForGitHub(lastWeek.end);
        break;
      case 'last-7-days':
        const last7Days = getLastNDaysRange(7);
        since = formatDateForGitHub(last7Days.start);
        until = formatDateForGitHub(last7Days.end);
        break;
      case 'last-30-days':
        const last30Days = getLastNDaysRange(30);
        since = formatDateForGitHub(last30Days.start);
        until = formatDateForGitHub(last30Days.end);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          since = customStartDate;
          until = customEndDate;
        } else {
          // 如果没有自定义日期，使用最近7天
          const defaultRange = getLastNDaysRange(7);
          since = formatDateForGitHub(defaultRange.start);
          until = formatDateForGitHub(defaultRange.end);
        }
        break;
    }

    try {
      const commitsData = await fetchCommits(session.accessToken, owner, repo, since, until);
      setCommits(commitsData);
    } catch (err) {
      console.error('加载提交记录失败:', err);
    }
  };

  // 如果未登录，重定向到首页
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // 加载仓库列表
  useEffect(() => {
    if (session?.accessToken && status === 'authenticated') {
      loadRepositories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // 当仓库或时间范围变化时加载提交记录
  useEffect(() => {
    if (selectedRepo && session?.accessToken) {
      loadCommits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo, timeRange, customStartDate, customEndDate]);

  const handleGenerateReport = async () => {
    if (commits.length === 0) {
      alert('请先选择仓库并加载提交记录');
      return;
    }

    try {
      await generateReport(commits, reportOptions);
    } catch (err) {
      console.error('生成报告失败:', err);
    }
  };

  const handleShareReport = () => {
    if (!report) {
      alert('请先生成报告');
      return;
    }

    // TODO: 实现分享功能
    alert('分享功能开发中...');
  };

  const handleExportPDF = async () => {
    if (!report) {
      alert('请先生成报告');
      return;
    }

    setExportingPDF(true);
    try {
      // 构建元数据
      const metadata = {
        commitCount: commits.length,
        repository: selectedRepo || '',
        timeRange: TIME_RANGES.find(range => range.value === timeRange)?.label || timeRange,
        style: REPORT_STYLES.find(style => style.value === reportOptions.style)?.label || reportOptions.style,
        length: REPORT_LENGTHS.find(length => length.value === reportOptions.length)?.label || reportOptions.length,
        generationTime: new Date().getTime(),
        date: new Date().toLocaleDateString('zh-CN'),
      };

      // 生成文件名
      const date = new Date().toISOString().split('T')[0];
      const repoName = selectedRepo ? selectedRepo.split('/')[1] : 'report';
      const filename = `weekly-report-${repoName}-${date}.pdf`;

      await downloadReportPDF(report, metadata, filename);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请重试或检查控制台');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) {
      alert('请先生成报告');
      return;
    }

    setExportingMarkdown(true);
    try {
      // 构建元数据（与PDF导出相同）
      const metadata = {
        commitCount: commits.length,
        repository: selectedRepo || '',
        timeRange: TIME_RANGES.find(range => range.value === timeRange)?.label || timeRange,
        style: REPORT_STYLES.find(style => style.value === reportOptions.style)?.label || reportOptions.style,
        length: REPORT_LENGTHS.find(length => length.value === reportOptions.length)?.label || reportOptions.length,
        generationTime: new Date().getTime(),
        date: new Date().toLocaleDateString('zh-CN'),
      };

      // 生成文件名（使用Markdown扩展名）
      const date = new Date().toISOString().split('T')[0];
      const repoName = selectedRepo ? selectedRepo.split('/')[1] : 'report';
      const filename = `weekly-report-${repoName}-${date}.md`;

      downloadMarkdownReport(report, metadata, filename);
    } catch (error) {
      console.error('导出Markdown失败:', error);
      alert('导出Markdown失败，请重试或检查控制台');
    } finally {
      setExportingMarkdown(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">加载中...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // 会重定向到首页
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 头部区域 */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">周报生成器</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                选择GitHub仓库和时间范围，AI将自动生成周报
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('https://github.com', '_blank')}
              >
                <FolderGit className="mr-2 h-4 w-4" />
                查看GitHub
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateReport}
                loading={reportLoading}
                disabled={commits.length === 0 || reportLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                生成周报
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误显示 */}
      {(githubError || reportError) && (
        <div className="container mx-auto px-4 py-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">错误</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {githubError && <p>{githubError}</p>}
                  {reportError && <p>{reportError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧面板：配置选项 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 仓库选择器 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <FolderGit className="h-5 w-5" />
                选择仓库
              </h2>
              <div className="space-y-3">
                {githubLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm">加载仓库中...</span>
                  </div>
                ) : repositories.length > 0 ? (
                  repositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo.full_name)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                        selectedRepo === repo.full_name
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                      )}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {repo.name}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {repo.private ? '私有' : '公开'} • 更新于 {new Date(repo.updated_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
                    <FolderGit className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      未找到仓库或加载失败
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={loadRepositories}
                    >
                      重新加载
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 时间范围选择器 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Calendar className="h-5 w-5" />
                时间范围
              </h2>
              <div className="space-y-3">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                      timeRange === range.value
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {range.label}
                      </span>
                    </div>
                    {timeRange === range.value && (
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* 自定义日期选择器 */}
              {timeRange === 'custom' && (
                <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 报告选项 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Filter className="h-5 w-5" />
                报告选项
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    报告风格
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {REPORT_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setReportOptions({ ...reportOptions, style: style.value })}
                        className={cn(
                          'rounded-lg border p-2 text-center text-sm transition-colors',
                          reportOptions.style === style.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        )}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    报告长度
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {REPORT_LENGTHS.map((length) => (
                      <button
                        key={length.value}
                        onClick={() => setReportOptions({ ...reportOptions, length: length.value })}
                        className={cn(
                          'rounded-lg border p-2 text-center text-sm transition-colors',
                          reportOptions.length === length.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        )}
                      >
                        {length.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      包含统计指标
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      提交数量、代码行数等
                    </p>
                  </div>
                  <button
                    onClick={() => setReportOptions({ ...reportOptions, includeMetrics: !reportOptions.includeMetrics })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      reportOptions.includeMetrics ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        reportOptions.includeMetrics ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧主内容区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 提交记录列表 */}
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                      <GitCommit className="h-5 w-5" />
                      提交记录
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {commits.length} 个提交
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {selectedRepo ? `正在查看 ${selectedRepo}` : '请选择一个仓库'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCommits}
                    loading={githubLoading}
                  >
                    刷新
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {githubLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-lg">加载提交记录中...</span>
                  </div>
                ) : commits.length > 0 ? (
                  <div className="space-y-4">
                    {commits.map((commit) => (
                      <div
                        key={commit.sha}
                        className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {commit.message}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span>{commit.author.name}</span>
                              <span>•</span>
                              <span>{new Date(commit.author.date).toLocaleString('zh-CN')}</span>
                              <span>•</span>
                              <a
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline dark:text-blue-400"
                              >
                                查看提交
                              </a>
                            </div>
                          </div>
                          <div className="ml-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {commit.sha.substring(0, 7)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <GitCommit className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      没有找到提交记录
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      请检查时间范围设置或仓库权限
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={loadCommits}
                    >
                      重新加载
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 报告预览区域 */}
            {report && (
              <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                        <Sparkles className="h-5 w-5" />
                        生成的周报
                      </h2>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        AI已根据您的提交记录生成周报
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShareReport}
                      >
                        分享
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        loading={exportingPDF}
                        disabled={exportingPDF}
                      >
                        导出PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportMarkdown}
                        loading={exportingMarkdown}
                        disabled={exportingMarkdown}
                      >
                        导出Markdown
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(report)}
                      >
                        复制文本
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="report-container rounded-xl bg-white shadow-lg p-6 md:p-8 dark:bg-gray-900 max-w-5xl mx-auto">
                    <ReactMarkdown>
                      {cleanHyphenation(report, { useNonBreakingHyphen: false })}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
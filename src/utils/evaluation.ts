// Agent评估工具，执行结构化检查
// 支持关键词匹配 + LLM-as-Judge 混合评估

import { evaluateWithHybrid, type JudgeResult } from './ai-judge.ts';

export interface TestCase {
  id: number;
  name: string;
  query: string;
  expectedKeywords: string[];
  description: string;
}

export interface EvaluationResult {
  testCase: TestCase;
  actualOutput: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
  passed: boolean;
  details: {
    hasTitle: boolean;
    hasOverview: boolean;
    hasContent: boolean;
    hasSummary: boolean;
    isMarkdown: boolean;
    length: number;
  };
  /** LLM-as-Judge 评分结果（可选，仅在启用AI评估时存在） */
  judgeResult?: JudgeResult;
}

export interface EvaluationSummary {
  totalTests: number;
  passedTests: number;
  averageMatchPercentage: number;
  results: EvaluationResult[];
  /** AI评估平均分（可选） */
  averageAiScore?: number;
  /** 运行时间 */
  timestamp?: string;
}

/**
 * 14个测试用例定义（原有10个 + 新增4个）
 */
export const TEST_CASES: TestCase[] = [
  // === 原有 10 个用例 ===
  {
    id: 1,
    name: '简单请求',
    query: '为仓库 facebook/react 生成周报',
    expectedKeywords: ['facebook/react', '周报', '提交', '工作', '总结'],
    description: '基本功能测试：简单仓库请求',
  },
  {
    id: 2,
    name: '带日期范围',
    query: '获取 facebook/react 从2024-01-01到2024-01-07的提交并生成报告',
    expectedKeywords: ['facebook/react', '2024-01-01', '2024-01-07', '日期范围', '周报'],
    description: '测试日期范围参数',
  },
  {
    id: 3,
    name: '指定报告风格',
    query: '为 facebook/react 生成技术风格的周报',
    expectedKeywords: ['facebook/react', '技术', '风格', '周报', '技术细节'],
    description: '测试报告风格参数',
  },
  {
    id: 4,
    name: '简洁报告',
    query: '为 facebook/react 生成简洁版周报',
    expectedKeywords: ['facebook/react', '简洁', '周报', '重点'],
    description: '测试简洁长度选项',
  },
  {
    id: 5,
    name: '包含统计指标',
    query: '为 facebook/react 生成包含统计指标的周报',
    expectedKeywords: ['facebook/react', '统计', '指标', '提交数量', '分类'],
    description: '测试统计指标选项',
  },
  {
    id: 6,
    name: '中文请求',
    query: '为 facebook/react 生成一份专业风格的周报',
    expectedKeywords: ['facebook/react', '专业', '风格', '周报', '正式'],
    description: '测试中文自然语言理解',
  },
  {
    id: 7,
    name: '混合参数',
    query: '获取 facebook/react 最近7天的提交，生成详细的技术报告',
    expectedKeywords: ['facebook/react', '最近7天', '技术', '详细', '报告'],
    description: '测试混合参数解析',
  },
  {
    id: 8,
    name: '复杂请求',
    query: '为 nextjs/next.js 生成本周的周报，要求专业风格且包含统计指标',
    expectedKeywords: ['nextjs/next.js', '本周', '专业', '统计指标', '周报'],
    description: '测试复杂多条件请求',
  },
  {
    id: 9,
    name: '边缘情况-空仓库',
    query: '为 empty/repo 生成周报',
    expectedKeywords: ['empty/repo', '空', '仓库', '无提交', '提示'],
    description: '测试空仓库处理',
  },
  {
    id: 10,
    name: '错误情况',
    query: '为 invalid/repo-name 生成周报',
    expectedKeywords: ['invalid/repo-name', '错误', '不存在', '无权访问', '提示'],
    description: '测试错误处理',
  },
  // === 新增 4 个用例 ===
  {
    id: 11,
    name: '英文查询',
    query: 'Generate a weekly report for the repository facebook/react',
    expectedKeywords: ['facebook/react', 'report', 'react', 'weekly'],
    description: '测试英文 query 输入',
  },
  {
    id: 12,
    name: '超长仓库名',
    query: '为 facebook/react-native-community/react-native-app-auth 生成周报',
    expectedKeywords: ['react-native', '周报', '提交', '工作'],
    description: '测试超长仓库名处理',
  },
  {
    id: 13,
    name: '连续相同请求',
    query: '为 facebook/react 生成周报，简洁版',
    expectedKeywords: ['facebook/react', '周报', '简洁', '提交'],
    description: '测试连续两次相同请求的幂等性（可在调用层实现缓存逻辑）',
  },
  {
    id: 14,
    name: '无效token请求',
    query: '为 facebook/react 生成周报',
    expectedKeywords: ['错误', '失败', '无效', '认证'],
    description: '测试无网络/无效token情况下的优雅降级（需在调用时传入无效token）',
  },
];

/**
 * 检查文本是否包含关键词
 */
function checkKeywords(text: string, keywords: string[]): {
  matched: string[];
  missing: string[];
  percentage: number;
} {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const percentage = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 100;

  return { matched, missing, percentage };
}

/**
 * 检查报告结构
 */
function checkReportStructure(report: string): {
  hasTitle: boolean;
  hasOverview: boolean;
  hasContent: boolean;
  hasSummary: boolean;
  isMarkdown: boolean;
  length: number;
} {
  const lines = report.split('\n');
  const hasTitle = lines.some(line => line.startsWith('# '));
  const hasOverview = report.includes('概览') || report.includes('overview') || report.includes('概述');
  const hasContent = report.includes('内容') || report.includes('工作') || report.includes('进展');
  const hasSummary = report.includes('总结') || report.includes('summary') || report.includes('结论');
  const isMarkdown = report.includes('##') || report.includes('**') || report.includes('- ');
  const length = report.length;

  return {
    hasTitle,
    hasOverview,
    hasContent,
    hasSummary,
    isMarkdown,
    length,
  };
}

/**
 * 评估单个测试用例
 */
export async function evaluateTestCase(
  testCase: TestCase,
  executeQuery: (query: string) => Promise<string>,
  useAiJudge: boolean = false
): Promise<EvaluationResult> {
  try {
    const actualOutput = await executeQuery(testCase.query);
    const keywordResult = checkKeywords(actualOutput, testCase.expectedKeywords);
    const structure = checkReportStructure(actualOutput);

    // 通过条件：至少匹配50%的关键词，并且有基本结构
    const passed = keywordResult.percentage >= 50 &&
                   (structure.hasTitle || structure.hasOverview) &&
                   structure.length > 100;

    const result: EvaluationResult = {
      testCase,
      actualOutput,
      matchedKeywords: keywordResult.matched,
      missingKeywords: keywordResult.missing,
      matchPercentage: keywordResult.percentage,
      passed,
      details: structure,
    };

    // 可选：使用 AI Judge 进行额外评估
    if (useAiJudge && actualOutput.length > 50) {
      try {
        const hybridResult = await evaluateWithHybrid(testCase.query, actualOutput, testCase.expectedKeywords);
        result.judgeResult = hybridResult.judgeResult;
        // AI Judge 结果覆盖 passed 状态
        result.passed = hybridResult.passed;
      } catch {
        // AI Judge 失败不影响整体评估
        console.warn(`测试用例 ${testCase.id} AI评估失败，使用关键词匹配结果`);
      }
    }

    return result;
  } catch (error) {
    // 如果执行失败，返回失败结果
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return {
      testCase,
      actualOutput: `执行失败: ${errorMessage}`,
      matchedKeywords: [],
      missingKeywords: testCase.expectedKeywords,
      matchPercentage: 0,
      passed: false,
      details: {
        hasTitle: false,
        hasOverview: false,
        hasContent: false,
        hasSummary: false,
        isMarkdown: false,
        length: 0,
      },
    };
  }
}

/**
 * 运行完整评估
 */
export async function runEvaluation(
  executeQuery: (query: string) => Promise<string>,
  options?: { useAiJudge?: boolean }
): Promise<EvaluationSummary> {
  const { useAiJudge = false } = options || {};
  const results: EvaluationResult[] = [];
  let totalMatchPercentage = 0;
  let passedTests = 0;
  let totalAiScore = 0;
  let aiCount = 0;

  for (const testCase of TEST_CASES) {
    console.log(`[${testCase.id}/${TEST_CASES.length}] ${testCase.name}...`);
    const startTime = Date.now();
    const result = await evaluateTestCase(testCase, executeQuery, useAiJudge);
    const duration = Date.now() - startTime;
    results.push(result);

    totalMatchPercentage += result.matchPercentage;
    if (result.passed) {
      passedTests++;
    }

    if (result.judgeResult) {
      totalAiScore += result.judgeResult.averageScore;
      aiCount++;
    }

    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${duration}ms | 关键词:${result.matchPercentage.toFixed(0)}%${result.judgeResult ? ` | AI:${result.judgeResult.averageScore.toFixed(1)}` : ''}`);
  }

  const averageMatchPercentage = totalMatchPercentage / TEST_CASES.length;

  const summary: EvaluationSummary = {
    totalTests: TEST_CASES.length,
    passedTests,
    averageMatchPercentage,
    results,
    timestamp: new Date().toISOString(),
  };

  if (aiCount > 0) {
    summary.averageAiScore = totalAiScore / aiCount;
  }

  return summary;
}

/**
 * 生成评估报告（Markdown格式，兼容原有格式）
 */
export function generateEvaluationReport(summary: EvaluationSummary): string {
  let report = `# Agent评估报告\n\n`;
  report += `- **生成时间**: ${summary.timestamp || new Date().toISOString()}\n`;
  report += `- **测试用例**: ${summary.totalTests}个\n`;
  report += `- **通过率**: ${summary.passedTests}/${summary.totalTests} (${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%)\n\n`;

  report += `## 总体统计\n`;
  report += `| 指标 | 数值 |\n`;
  report += `|------|------|\n`;
  report += `| 测试用例总数 | ${summary.totalTests} |\n`;
  report += `| 通过测试数 | ${summary.passedTests} |\n`;
  report += `| 通过率 | ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}% |\n`;
  report += `| 平均关键词匹配率 | ${summary.averageMatchPercentage.toFixed(1)}% |\n`;
  if (summary.averageAiScore !== undefined) {
    report += `| AI评估平均分 | ${summary.averageAiScore.toFixed(2)} / 10 |\n`;
  }
  report += '\n';

  report += `## 详细结果\n\n`;

  for (const result of summary.results) {
    report += `### 测试用例 ${result.testCase.id}: ${result.testCase.name}\n`;
    report += `- **描述**: ${result.testCase.description}\n`;
    report += `- **查询**: \`${result.testCase.query}\`\n`;
    report += `- **结果**: ${result.passed ? '✅ 通过' : '❌ 失败'}\n`;
    report += `- **关键词匹配率**: ${result.matchPercentage.toFixed(1)}%\n`;
    report += `- **匹配关键词**: ${result.matchedKeywords.join(', ') || '无'}\n`;
    report += `- **缺失关键词**: ${result.missingKeywords.join(', ') || '无'}\n`;
    report += `- **输出长度**: ${result.details.length}字符\n`;
    report += `- **结构检查**:\n`;
    report += `  - 标题: ${result.details.hasTitle ? '✅' : '❌'}\n`;
    report += `  - 概览: ${result.details.hasOverview ? '✅' : '❌'}\n`;
    report += `  - 内容: ${result.details.hasContent ? '✅' : '❌'}\n`;
    report += `  - 总结: ${result.details.hasSummary ? '✅' : '❌'}\n`;
    report += `  - Markdown格式: ${result.details.isMarkdown ? '✅' : '❌'}\n`;

    // AI 评分
    if (result.judgeResult) {
      const { scores, comments } = result.judgeResult;
      report += `- **AI评分**:\n`;
      report += `  - 相关性: ${scores.relevance}/10\n`;
      report += `  - 覆盖度: ${scores.completeness}/10\n`;
      report += `  - 准确性: ${scores.accuracy}/10\n`;
      report += `  - 结构: ${scores.structure}/10\n`;
      report += `  - 总分: ${result.judgeResult.totalScore}/40 (平均: ${result.judgeResult.averageScore.toFixed(1)}/10)\n`;
      report += `- **AI评语**:\n`;
      report += `  - 相关性: ${comments.relevance}\n`;
      report += `  - 覆盖度: ${comments.completeness}\n`;
      report += `  - 准确性: ${comments.accuracy}\n`;
      report += `  - 结构: ${comments.structure}\n`;
    }
    report += '\n';
  }

  report += `## 改进建议\n\n`;

  if (summary.averageMatchPercentage < 70) {
    report += `1. **关键词匹配率较低** (${summary.averageMatchPercentage.toFixed(1)}%): 需要优化Agent的响应内容，确保包含更多预期关键词。\n`;
  }

  if (summary.passedTests < summary.totalTests * 0.8) {
    report += `2. **通过率不足**: 只有${summary.passedTests}/${summary.totalTests}个测试通过，需要检查失败用例的具体原因。\n`;
  }

  // 分析常见问题
  const structureIssues = summary.results.filter(r => !r.details.hasTitle || !r.details.hasOverview);
  if (structureIssues.length > 0) {
    report += `3. **结构问题**: ${structureIssues.length}个测试用例缺少标题或概览部分，需要优化报告生成逻辑。\n`;
  }

  const lengthIssues = summary.results.filter(r => r.details.length < 100);
  if (lengthIssues.length > 0) {
    report += `4. **长度问题**: ${lengthIssues.length}个测试用例报告长度不足100字符，可能内容过于简略。\n`;
  }

  // AI 评分分析
  if (summary.averageAiScore !== undefined && summary.averageAiScore < 7) {
    report += `5. **AI评分偏低** (${summary.averageAiScore.toFixed(2)}/10): 需要从相关性、覆盖度、准确性、结构等维度综合提升输出质量。\n`;
  }

  report += `\n---\n`;
  report += `\n*报告由 Agent Evaluation System 自动生成于 ${summary.timestamp || new Date().toISOString()}*\n`;

  return report;
}

/**
 * 生成 HTML 格式的评估报告
 */
export function generateHtmlReport(summary: EvaluationSummary): string {
  const passRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
  const resultsRows = summary.results.map(r => {
    const status = r.passed ? '✅' : '❌';
    const aiScore = r.judgeResult ? r.judgeResult.averageScore.toFixed(1) : '-';
    return `
    <tr>
      <td>${r.testCase.id}</td>
      <td>${r.testCase.name}</td>
      <td>${status}</td>
      <td>${r.matchPercentage.toFixed(0)}%</td>
      <td>${aiScore}</td>
      <td>${r.details.length}字</td>
      <td><button onclick="toggleDetail(${r.testCase.id})">详情</button></td>
    </tr>
    <tr id="detail-${r.testCase.id}" style="display:none">
      <td colspan="7">
        <pre>${escapeHtml(r.actualOutput.substring(0, 500))}${r.actualOutput.length > 500 ? '...' : ''}</pre>
      </td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent评估报告</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
  h1 { color: #333; }
  .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
  .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
  .card .value { font-size: 2em; font-weight: bold; color: #2563eb; }
  .card .label { font-size: 0.9em; color: #666; margin-top: 4px; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .chart-box { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f8fafc; font-weight: 600; color: #333; }
  tr:hover { background: #f8fafc; }
  pre { background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 0.85em; max-height: 300px; }
  button { background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  .footer { text-align: center; color: #666; margin-top: 40px; font-size: 0.85em; }
</style>
</head>
<body>
<h1>📊 Agent 评估报告</h1>
<p>生成时间: ${summary.timestamp || new Date().toISOString()}</p>

<div class="summary-cards">
  <div class="card"><div class="value">${summary.totalTests}</div><div class="label">测试用例总数</div></div>
  <div class="card"><div class="value">${summary.passedTests}</div><div class="label">通过数</div></div>
  <div class="card"><div class="value">${passRate}%</div><div class="label">通过率</div></div>
  <div class="card"><div class="value">${summary.averageMatchPercentage.toFixed(0)}%</div><div class="label">平均关键词匹配率</div></div>
  ${summary.averageAiScore !== undefined ? `<div class="card"><div class="value">${summary.averageAiScore.toFixed(1)}</div><div class="label">AI评估平均分/10</div></div>` : ''}
</div>

<div class="charts">
  <div class="chart-box">
    <h3>通过率</h3>
    <canvas id="passChart"></canvas>
  </div>
  <div class="chart-box">
    <h3>各维度评分（AI Judge）</h3>
    <canvas id="radarChart"></canvas>
  </div>
</div>

<h2>详细结果</h2>
<table>
  <thead><tr><th>#</th><th>名称</th><th>结果</th><th>关键词匹配</th><th>AI评分</th><th>长度</th><th></th></tr></thead>
  <tbody>${resultsRows}</tbody>
</table>

<div class="footer">
  <p>报告由 Agent Evaluation System 自动生成</p>
</div>

<script>
function toggleDetail(id) {
  const row = document.getElementById('detail-' + id);
  row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
}

// 通过率图表
const passCtx = document.getElementById('passChart').getContext('2d');
new Chart(passCtx, {
  type: 'doughnut',
  data: {
    labels: ['通过 (${summary.passedTests})', '失败 (${summary.totalTests - summary.passedTests})'],
    datasets: [{
      data: [${summary.passedTests}, ${summary.totalTests - summary.passedTests}],
      backgroundColor: ['#22c55e', '#ef4444'],
    }]
  },
  options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
});

// 雷达图（取AI评分数据的平均值）
const radarCtx = document.getElementById('radarChart').getContext('2d');
const aiResults = ${JSON.stringify(summary.results.filter(r => r.judgeResult).map(r => r.judgeResult!.scores))};
const avgScores = aiResults.length > 0 ? {
  relevance: aiResults.reduce((s, r) => s + r.relevance, 0) / aiResults.length,
  completeness: aiResults.reduce((s, r) => s + r.completeness, 0) / aiResults.length,
  accuracy: aiResults.reduce((s, r) => s + r.accuracy, 0) / aiResults.length,
  structure: aiResults.reduce((s, r) => s + r.structure, 0) / aiResults.length,
} : { relevance: 0, completeness: 0, accuracy: 0, structure: 0 };

new Chart(radarCtx, {
  type: 'radar',
  data: {
    labels: ['相关性', '覆盖度', '准确性', '结构'],
    datasets: [{
      label: 'AI评分',
      data: [avgScores.relevance, avgScores.completeness, avgScores.accuracy, avgScores.structure],
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
      borderColor: '#2563eb',
      pointBackgroundColor: '#2563eb',
    }]
  },
  options: {
    responsive: true,
    scales: { r: { min: 0, max: 10, ticks: { stepSize: 2 } } },
    plugins: { legend: { position: 'bottom' } }
  }
});
</script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

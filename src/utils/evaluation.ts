// Agent评估工具，执行结构化检查

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
}

export interface EvaluationSummary {
  totalTests: number;
  passedTests: number;
  averageMatchPercentage: number;
  results: EvaluationResult[];
}

/**
 * 10个测试用例定义
 */
export const TEST_CASES: TestCase[] = [
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
  const hasOverview = report.includes('概览') || report.includes('overview') || report.includes('总结');
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
  executeQuery: (query: string) => Promise<string>
): Promise<EvaluationResult> {
  try {
    const actualOutput = await executeQuery(testCase.query);
    const keywordResult = checkKeywords(actualOutput, testCase.expectedKeywords);
    const structure = checkReportStructure(actualOutput);

    // 通过条件：至少匹配50%的关键词，并且有基本结构
    const passed = keywordResult.percentage >= 50 &&
                   (structure.hasTitle || structure.hasOverview) &&
                   structure.length > 100;

    return {
      testCase,
      actualOutput,
      matchedKeywords: keywordResult.matched,
      missingKeywords: keywordResult.missing,
      matchPercentage: keywordResult.percentage,
      passed,
      details: structure,
    };
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
  executeQuery: (query: string) => Promise<string>
): Promise<EvaluationSummary> {
  const results: EvaluationResult[] = [];
  let totalMatchPercentage = 0;
  let passedTests = 0;

  for (const testCase of TEST_CASES) {
    console.log(`运行测试用例 ${testCase.id}: ${testCase.name}`);
    const result = await evaluateTestCase(testCase, executeQuery);
    results.push(result);

    totalMatchPercentage += result.matchPercentage;
    if (result.passed) {
      passedTests++;
    }

    console.log(`  结果: ${result.passed ? '通过' : '失败'}, 匹配率: ${result.matchPercentage.toFixed(1)}%`);
  }

  const averageMatchPercentage = totalMatchPercentage / TEST_CASES.length;

  return {
    totalTests: TEST_CASES.length,
    passedTests,
    averageMatchPercentage,
    results,
  };
}

/**
 * 生成评估报告
 */
export function generateEvaluationReport(summary: EvaluationSummary): string {
  let report = `# Agent评估报告\n\n`;
  report += `## 总体统计\n`;
  report += `- 测试用例总数: ${summary.totalTests}\n`;
  report += `- 通过测试数: ${summary.passedTests}\n`;
  report += `- 通过率: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n`;
  report += `- 平均关键词匹配率: ${summary.averageMatchPercentage.toFixed(1)}%\n\n`;

  report += `## 详细结果\n\n`;

  for (const result of summary.results) {
    report += `### 测试用例 ${result.testCase.id}: ${result.testCase.name}\n`;
    report += `- **描述**: ${result.testCase.description}\n`;
    report += `- **查询**: "${result.testCase.query}"\n`;
    report += `- **结果**: ${result.passed ? '✅ 通过' : '❌ 失败'}\n`;
    report += `- **匹配率**: ${result.matchPercentage.toFixed(1)}%\n`;
    report += `- **匹配关键词**: ${result.matchedKeywords.join(', ') || '无'}\n`;
    report += `- **缺失关键词**: ${result.missingKeywords.join(', ') || '无'}\n`;
    report += `- **结构检查**:\n`;
    report += `  - 标题: ${result.details.hasTitle ? '✅' : '❌'}\n`;
    report += `  - 概览: ${result.details.hasOverview ? '✅' : '❌'}\n`;
    report += `  - 内容: ${result.details.hasContent ? '✅' : '❌'}\n`;
    report += `  - 总结: ${result.details.hasSummary ? '✅' : '❌'}\n`;
    report += `  - Markdown格式: ${result.details.isMarkdown ? '✅' : '❌'}\n`;
    report += `  - 长度: ${result.details.length}字符\n`;
    report += `\n`;
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

  report += `\n## 总结\n`;
  report += `Agent整体表现${summary.passedTests >= summary.totalTests * 0.8 ? '良好' : '有待改进'}。`;

  return report;
}
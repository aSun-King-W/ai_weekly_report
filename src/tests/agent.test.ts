// Agent测试文件
import { runEvaluation, generateEvaluationReport, generateHtmlReport } from '../utils/evaluation.ts';
import { getAgentService } from '../lib/agent-service.ts';
import { AgentContext } from '../types/index.ts';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { join } from 'path';

// 加载.env.local文件中的环境变量
function loadEnvFromFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');

    const lines = envContent.split('\n');
    for (const line of lines) {
      // 跳过注释和空行
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // 解析键值对
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // 如果环境变量未设置，则设置它
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    console.log('已从 .env.local 文件加载环境变量');
  } catch (error) {
    console.warn('无法加载 .env.local 文件:', error instanceof Error ? error.message : error);
  }
}

// 加载环境变量
loadEnvFromFile();

// 模拟Agent执行函数（用于测试）
// 在实际使用中，这个函数应该调用真实的Agent服务
async function mockExecuteQuery(query: string): Promise<string> {
  console.log(`模拟执行查询: "${query}"`);

  // 根据查询内容返回模拟响应
  if (query.includes('facebook/react')) {
    if (query.includes('技术风格')) {
      return `# Facebook React仓库技术周报

## 技术工作概览
本周React仓库有15个提交，主要涉及性能优化和新功能开发。

## 主要技术工作
1. 性能优化：改用了新的调度算法
2. 新功能：添加了并发渲染支持
3. 问题修复：解决了内存泄漏问题

## 技术总结
本周技术工作进展顺利，代码质量保持高水平。`;
    } else if (query.includes('简洁版')) {
      return `# React周报（简洁版）
本周提交：15个
主要工作：性能优化、新功能开发
总结：进展良好`;
    } else if (query.includes('统计指标')) {
      return `# React周报（含统计指标）

## 统计信息
- 提交总数：15
- 功能开发：8个提交
- 问题修复：5个提交
- 代码优化：2个提交

## 工作内容
本周工作重点是性能优化和新功能开发。`;
    } else {
      return `# Facebook React仓库周报

## 本周工作概览
本周React仓库共有15个提交，主要工作集中在性能优化和新功能开发。

## 主要工作内容
1. 性能优化：改进了渲染性能
2. 新功能开发：添加了新的API
3. 问题修复：解决了几个关键bug

## 总结
本周工作进展顺利，团队协作良好。`;
    }
  } else if (query.includes('nextjs/next.js')) {
    return `# Next.js仓库周报

## 本周工作概览
本周Next.js仓库有12个提交，主要涉及框架优化和文档更新。

## 主要工作内容
1. 框架优化：改进了编译性能
2. 文档更新：更新了API文档
3. 问题修复：解决了路由相关问题

## 统计指标
- 提交总数：12
- 功能开发：6个
- 问题修复：4个
- 文档更新：2个

## 总结
本周Next.js框架持续优化，用户体验得到提升。`;
  } else if (query.includes('empty/repo')) {
    return `# 空仓库周报

## 提示
仓库 empty/repo 是空的，没有提交记录。

## 建议
请检查仓库是否正确，或尝试其他仓库。`;
  } else if (query.includes('invalid/repo-name')) {
    return `# 错误提示

## 错误信息
仓库 invalid/repo-name 不存在或您无权访问。

## 建议
请检查仓库名称是否正确，或确认您有访问权限。`;
  } else if (query.includes('2024-01-01')) {
    return `# Facebook React仓库周报（2024-01-01至2024-01-07）

## 日期范围
时间范围：2024-01-01 至 2024-01-07

## 工作内容
在指定日期范围内，React仓库有8个提交，主要涉及代码清理和小幅优化。

## 总结
本周工作按计划完成。`;
  } else {
    return `# 通用周报

## 工作概览
本周有多个提交，工作内容多样。

## 主要工作
1. 功能开发
2. 问题修复
3. 代码优化

## 总结
本周工作顺利完成。`;
  }
}

// 实际Agent执行函数（需要环境变量）
async function realExecuteQuery(query: string): Promise<string> {
  console.log(`[realExecuteQuery] 处理查询: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

  // 检查必需的环境变量
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;

  console.log(`[realExecuteQuery] DeepSeek API密钥已设置: ${apiKey ? '是' : '否'}`);
  console.log(`[realExecuteQuery] GitHub令牌已设置: ${accessToken ? '是' : '否'}`);

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY或ANTHROPIC_API_KEY环境变量未设置');
  }
  if (!accessToken) {
    throw new Error('GITHUB_ACCESS_TOKEN环境变量未设置');
  }

  try {
    console.log('[realExecuteQuery] 获取AgentService实例...');
    // 获取AgentService实例
    const agentService = getAgentService();

    // 构建AgentContext
    const context: AgentContext = {
      accessToken,
      // 其他上下文信息可以留空，因为测试不需要用户会话
    };

    console.log('[realExecuteQuery] 调用agentService.processQuery...');

    // 添加超时机制（90秒）
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Agent处理超时（90秒）'));
      }, 90000);
    });

    // 处理查询（带超时）
    const result = await Promise.race([
      agentService.processQuery(query, context),
      timeoutPromise
    ]);

    console.log(`[realExecuteQuery] 调用成功，返回内容长度: ${result.content.length}字符`);

    // 记录错误分类信息（如果有）
    if (result.metadata?.errors && result.metadata.errors.length > 0) {
      console.warn('[realExecuteQuery] 执行中存在异常:', JSON.stringify(result.metadata.errors));
    }

    // 返回内容
    return result.content;
  } catch (error) {
    // 分类错误
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorType = errorMessage.includes('超时') ? 'api_call_failed' :
                      errorMessage.includes('API') ? 'api_call_failed' :
                      errorMessage.includes('tool') ? 'tool_execution_failed' :
                      'unknown';
    console.error(`[realExecuteQuery] [${errorType}] 执行失败: ${errorMessage}`);
    return `执行失败 [${errorType}]: ${errorMessage}`;
  }
}

/**
 * 运行评估测试
 */
async function runAgentEvaluation() {
  console.log('开始Agent评估测试...\n');

  try {
    // 使用模拟执行函数运行评估
    const summary = await runEvaluation(mockExecuteQuery, { useAiJudge: false });

    // 生成评估报告
    const report = generateEvaluationReport(summary);
    const htmlReport = generateHtmlReport(summary);

    console.log('\n' + report);

    // 保存报告到文件
    const fs = await import('fs');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'agent-evaluation-report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    const htmlReportPath = path.join(process.cwd(), 'agent-evaluation-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport, 'utf-8');

    console.log(`\n评估报告已保存到: ${reportPath}`);
    console.log(`HTML报告已保存到: ${htmlReportPath}`);

    // 输出简要结果
    console.log('\n=== 评估结果摘要 ===');
    console.log(`测试用例总数: ${summary.totalTests}`);
    console.log(`通过测试数: ${summary.passedTests}`);
    console.log(`通过率: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`平均匹配率: ${summary.averageMatchPercentage.toFixed(1)}%`);
    if (summary.averageAiScore !== undefined) {
      console.log(`AI评估平均分: ${summary.averageAiScore.toFixed(2)}/10`);
    }

    // 检查是否通过
    if (summary.passedTests >= summary.totalTests * 0.7) {
      console.log('\n✅ Agent评估通过！');
      return 0;
    } else {
      console.log('\n❌ Agent评估未通过，需要改进。');
      return 1;
    }
  } catch (error) {
    console.error('评估过程中发生错误:', error);
    return 1;
  }
}

// 支持带参数运行真实评估
async function runRealEvaluation(useAiJudge: boolean = false) {
  console.log('开始真实环境评估测试...\n');

  // 检查环境变量
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    console.error('错误：缺少必需的环境变量');
    console.error('请设置以下环境变量：');
    console.error('1. DEEPSEEK_API_KEY (或 ANTHROPIC_API_KEY) - DeepSeek API密钥');
    console.error('2. GITHUB_ACCESS_TOKEN - GitHub个人访问令牌');
    console.error('\n您可以通过以下方式设置环境变量：');
    console.error('  - 创建 .env.local 文件并添加变量');
    console.error('  - 在命令行中临时设置：export GITHUB_ACCESS_TOKEN=your_token');
    return 1;
  }

  console.log('环境变量检查通过，开始运行评估...\n');
  console.log('注意：真实评估会调用实际的DeepSeek API和GitHub API，可能会产生API调用费用。\n');

  if (useAiJudge) {
    console.log('注意：AI Judge 模式会额外调用 DeepSeek API 进行质量评估，会增加API调用次数。\n');
  }

  try {
    // 使用真实执行函数运行评估（可选启用AI Judge）
    const summary = await runEvaluation(realExecuteQuery, { useAiJudge });

    // 生成评估报告
    const report = generateEvaluationReport(summary);
    const htmlReport = generateHtmlReport(summary);

    console.log('\n' + report);

    // 保存报告到文件
    const fs = await import('fs');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'agent-evaluation-report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    const htmlReportPath = path.join(process.cwd(), 'agent-evaluation-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport, 'utf-8');

    console.log(`\n评估报告已保存到: ${reportPath}`);
    console.log(`HTML报告已保存到: ${htmlReportPath}`);

    // 输出简要结果
    console.log('\n=== 评估结果摘要 ===');
    console.log(`测试用例总数: ${summary.totalTests}`);
    console.log(`通过测试数: ${summary.passedTests}`);
    console.log(`通过率: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`平均匹配率: ${summary.averageMatchPercentage.toFixed(1)}%`);

    // 检查是否通过
    if (summary.passedTests >= summary.totalTests * 0.7) {
      console.log('\n✅ Agent评估通过！');
      return 0;
    } else {
      console.log('\n❌ Agent评估未通过，需要改进。');
      return 1;
    }
  } catch (error) {
    console.error('评估过程中发生错误:', error);
    return 1;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const useReal = args.includes('--real');
  const useAiJudge = args.includes('--ai-judge');

  if (useAiJudge) {
    console.log('已启用 LLM-as-Judge 评估模式');
  }

  if (useReal) {
    return await runRealEvaluation(useAiJudge);
  } else {
    return await runAgentEvaluation();
  }
}

// 如果直接运行此文件
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

// 导出测试函数
export {
  mockExecuteQuery,
  realExecuteQuery,
  runAgentEvaluation,
  runRealEvaluation,
};
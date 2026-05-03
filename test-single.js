// 简单测试脚本，测试单个查询
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
    console.warn('无法加载 .env.local 文件:', error.message);
  }
}

// 加载环境变量
loadEnvFromFile();

// 测试单个查询
async function testSingleQuery() {
  try {
    // 动态导入agent.test.ts中的函数
    await import('./src/tests/agent.test.ts');

    console.log('测试模拟查询...');
    const query = '为仓库 facebook/react 生成周报';
    console.log(`查询: "${query}"`);

    const result = await realExecuteQuery(query);
    console.log('\n=== 结果 ===');
    console.log(result.substring(0, 500) + (result.length > 500 ? '...' : ''));
    console.log(`\n总长度: ${result.length}字符`);

    // 检查是否包含预期关键词
    const expectedKeywords = ['facebook/react', '周报', '提交', '工作', '总结'];
    const lowerResult = result.toLowerCase();
    const matched = expectedKeywords.filter(keyword =>
      lowerResult.includes(keyword.toLowerCase())
    );

    console.log('\n=== 关键词匹配 ===');
    console.log(`匹配的关键词: ${matched.join(', ') || '无'}`);
    console.log(`匹配率: ${(matched.length / expectedKeywords.length * 100).toFixed(1)}%`);

    // 检查基本结构
    const hasTitle = result.includes('# ');
    const hasOverview = result.includes('概览') || result.includes('总结');
    const isMarkdown = result.includes('##') || result.includes('**') || result.includes('- ');

    console.log('\n=== 结构检查 ===');
    console.log(`有标题: ${hasTitle ? '✅' : '❌'}`);
    console.log(`有概览/总结: ${hasOverview ? '✅' : '❌'}`);
    console.log(`Markdown格式: ${isMarkdown ? '✅' : '❌'}`);

  } catch (error) {
    console.error('测试失败:', error);
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
  }
}

// 运行测试
testSingleQuery();
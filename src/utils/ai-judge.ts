// LLM-as-Judge 评估器：让 AI 模型自行判断输出质量
import OpenAI from 'openai';

export interface JudgeCriteria {
  relevance: number;    // 内容相关性 0-10
  completeness: number; // 覆盖度 0-10
  accuracy: number;     // 准确性 0-10
  structure: number;    // 格式规范 0-10
}

export interface JudgeComment {
  relevance: string;
  completeness: string;
  accuracy: string;
  structure: string;
}

export interface JudgeResult {
  scores: JudgeCriteria;
  totalScore: number;     // 总分 (0-40)
  averageScore: number;   // 平均分 (0-10)
  comments: JudgeComment;
  passed: boolean;        // averageScore >= 7 算通过
  rawResponse?: string;
}

const JUDGE_SYSTEM_PROMPT = `你是一个专业的内容质量评估员。你需要根据给定的查询(query)和AI生成的输出(output)，从以下四个维度进行评分：

1. relevance (相关性 0-10)：输出内容是否与用户查询高度相关，是否准确回应了查询的核心需求
2. completeness (覆盖度 0-10)：输出是否全面覆盖了查询的各个方面，是否有遗漏重要信息
3. accuracy (准确性 0-10)：输出中的信息是否准确，是否有事实错误或误导性内容
4. structure (结构 0-10)：输出的格式是否规范，结构是否清晰，是否易于阅读

评分标准：
- 9-10：优秀，完全满足要求
- 7-8：良好，基本满足但有改进空间
- 5-6：一般，部分满足但有多处不足
- 3-4：较差，大部分不满足要求
- 1-2：很差，基本不相关或无法使用

你必须严格按照以下JSON格式返回结果，不要包含任何其他文字：
{
  "scores": {
    "relevance": <number>,
    "completeness": <number>,
    "accuracy": <number>,
    "structure": <number>
  },
  "comments": {
    "relevance": "<相关性评语>",
    "completeness": "<覆盖度评语>",
    "accuracy": "<准确性评语>",
    "structure": "<结构评语>"
  }
}

要求：
- 评分要严格、客观，不要虚高
- 评语要具体、有建设性，指出优缺点
- 使用中文输出评语`;

function getClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY或ANTHROPIC_API_KEY环境变量未设置');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
    timeout: 15000,
  });
}

function parseJudgeResponse(raw: string): JudgeResult | null {
  try {
    // 尝试从 response 中提取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*"scores"[\s\S]*"comments"[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;

    const parsed = JSON.parse(jsonStr);

    if (!parsed.scores || !parsed.comments) {
      return null;
    }

    const scores: JudgeCriteria = {
      relevance: clampScore(parsed.scores.relevance),
      completeness: clampScore(parsed.scores.completeness),
      accuracy: clampScore(parsed.scores.accuracy),
      structure: clampScore(parsed.scores.structure),
    };

    const totalScore = scores.relevance + scores.completeness + scores.accuracy + scores.structure;
    const averageScore = totalScore / 4;

    return {
      scores,
      totalScore,
      averageScore,
      comments: {
        relevance: parsed.comments.relevance || '',
        completeness: parsed.comments.completeness || '',
        accuracy: parsed.comments.accuracy || '',
        structure: parsed.comments.structure || '',
      },
      passed: averageScore >= 7,
      rawResponse: raw,
    };
  } catch {
    return null;
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

/**
 * 使用 LLM 评估输出质量
 * @param query 原始查询
 * @param output AI 生成的输出
 * @returns 评估结果
 */
export async function evaluateWithAI(query: string, output: string): Promise<JudgeResult> {
  const client = getClient();

  const userPrompt = `## 查询
${query}

## AI输出
${output}`;

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    if (!content) {
      return createFallbackResult('AI评估器返回空响应');
    }

    const result = parseJudgeResponse(content);
    if (!result) {
      return createFallbackResult('无法解析AI评估器的评分结果');
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return createFallbackResult(`AI评估器调用失败: ${errorMsg}`);
  }
}

function createFallbackResult(reason: string): JudgeResult {
  return {
    scores: { relevance: 0, completeness: 0, accuracy: 0, structure: 0 },
    totalScore: 0,
    averageScore: 0,
    passed: false,
    comments: {
      relevance: reason,
      completeness: reason,
      accuracy: reason,
      structure: reason,
    },
  };
}

/**
 * 快速评估（关键词检查 + LLM 辅助）
 * 保留关键词匹配作为快速辅助检查，LLM 评分作为主要标准
 */
export async function evaluateWithHybrid(
  query: string,
  output: string,
  expectedKeywords: string[]
): Promise<{
  keywordMatch: { matched: string[]; missing: string[]; percentage: number };
  judgeResult: JudgeResult;
  passed: boolean;
}> {
  // 关键词匹配
  const lowerOutput = output.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of expectedKeywords) {
    if (lowerOutput.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const percentage = expectedKeywords.length > 0 ? (matched.length / expectedKeywords.length) * 100 : 100;

  // LLM 评估
  const judgeResult = await evaluateWithAI(query, output);

  // 综合通过条件：AI评分通过(>=7) 或 关键词匹配率>=50%且有基本结构
  const hasBasicStructure = output.includes('#') && output.length > 100;
  const passed = judgeResult.passed || (percentage >= 50 && hasBasicStructure);

  return {
    keywordMatch: { matched, missing, percentage },
    judgeResult,
    passed,
  };
}

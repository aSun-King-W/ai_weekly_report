// POST /api/generate/report - 使用DeepSeek AI生成周报

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, GitHubCommit, ReportOptions } from '@/types';
import { getAIService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commits, options }: { commits: GitHubCommit[]; options: ReportOptions } = body;

    if (!commits || !Array.isArray(commits) || commits.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '提交记录不能为空',
      }, { status: 400 });
    }

    if (!options) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '报告选项不能为空',
      }, { status: 400 });
    }

    // 验证环境变量
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'DeepSeek API密钥未配置',
        message: '请检查ANTHROPIC_API_KEY环境变量是否包含有效的DeepSeek API密钥',
      }, { status: 500 });
    }

    // 获取AI服务实例
    const aiService = getAIService();

    // 使用AI生成报告
    const result = await aiService.generateReport(commits, options);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('生成报告失败:', error);

    // 根据错误类型返回不同的错误信息
    let errorMessage = '生成报告时发生错误';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API密钥无效')) {
        errorMessage = 'DeepSeek API密钥无效';
        statusCode = 401;
      } else if (error.message.includes('频率限制')) {
        errorMessage = 'API调用频率限制，请稍后重试';
        statusCode = 429;
      } else if (error.message.includes('服务暂时不可用') || error.message.includes('网络连接失败')) {
        errorMessage = 'AI服务暂时不可用，请稍后重试';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage,
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: statusCode });
  }
}
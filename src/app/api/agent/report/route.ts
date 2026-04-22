// POST /api/agent/report - Agent报告生成API端点

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ApiResponse, AgentContext } from '@/types';
import { authConfig } from '@/lib/auth';
import { getAgentService } from '@/lib/agent-service';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authConfig);

    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未登录，请先登录GitHub账号',
      }, { status: 401 });
    }

    // 获取GitHub访问令牌
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'GitHub访问令牌无效，请重新登录',
      }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { query, options, download }: { query: string; options?: any; download?: boolean } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '查询内容不能为空',
      }, { status: 400 });
    }

    // 构建Agent上下文
    const context: AgentContext = {
      accessToken,
      userId: session.user?.id,
      userLogin: session.user?.login,
    };

    // 获取Agent服务实例
    const agentService = getAgentService();

    // 处理查询
    const result = await agentService.processQuery(query, context);

    // 如果请求下载文件，返回Markdown文件
    if (download) {
      const filename = `weekly-report-${new Date().toISOString().split('T')[0]}.md`;

      return new NextResponse(result.content, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // 否则返回JSON响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Agent API处理失败:', error);

    // 根据错误类型返回不同的错误信息
    let errorMessage = '处理请求时发生错误';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        errorMessage = 'DeepSeek API密钥未配置';
        statusCode = 500;
      } else if (error.message.includes('API密钥无效')) {
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

// 可选：简化接口，直接生成周报
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authConfig);

    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '未登录，请先登录GitHub账号',
      }, { status: 401 });
    }

    // 获取GitHub访问令牌
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'GitHub访问令牌无效，请重新登录',
      }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const since = searchParams.get('since');
    const until = searchParams.get('until');
    const style = searchParams.get('style') as 'professional' | 'casual' | 'technical' || 'professional';
    const length = searchParams.get('length') as 'concise' | 'detailed' | 'comprehensive' || 'detailed';
    const includeMetrics = searchParams.get('includeMetrics') !== 'false';
    const download = searchParams.get('download') === 'true';

    if (!owner || !repo) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少必要的参数：owner 和 repo',
      }, { status: 400 });
    }

    // 构建Agent上下文
    const context: AgentContext = {
      accessToken,
      userId: session.user?.id,
      userLogin: session.user?.login,
    };

    // 获取Agent服务实例
    const agentService = getAgentService();

    // 使用简化接口生成周报
    const result = await agentService.generateWeeklyReport(
      owner,
      repo,
      context,
      {
        since: since || undefined,
        until: until || undefined,
        style,
        length,
        includeMetrics,
      }
    );

    // 如果请求下载文件，返回Markdown文件
    if (download) {
      const filename = `weekly-report-${owner}-${repo}-${new Date().toISOString().split('T')[0]}.md`;

      return new NextResponse(result.content, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // 否则返回JSON响应
    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Agent API处理失败:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: '处理请求时发生错误',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
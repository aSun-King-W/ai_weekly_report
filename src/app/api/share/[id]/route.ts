// GET /api/share/[id] - 获取分享的报告

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '报告ID不能为空',
      }, { status: 400 });
    }

    // 这里应该从数据库或缓存中获取分享的报告
    // 暂时返回模拟数据
    const mockSharedReport = {
      id: id,
      title: 'AI周报助手 - 本周工作报告',
      content: `# 分享的报告

这是通过AI周报助手生成的分享报告。

**报告ID**: ${id}
**生成时间**: 2026年4月13日
**分享状态**: 公开

## 报告内容

这是一个示例分享报告，实际应用中这里会显示完整的周报内容。

使用AI周报助手，您可以：
- 自动从GitHub获取commit记录
- 使用AI生成结构化的周报
- 一键分享给同事或团队
- 导出PDF或Markdown格式

## 如何使用

1. 访问 [AI周报助手](/) 官网
2. 使用GitHub账号登录
3. 选择仓库和时间范围
4. 生成并分享您的周报

---
*本报告由AI周报助手生成*`,
      createdAt: '2026-04-13T10:00:00Z',
      expiresAt: '2026-04-20T10:00:00Z',
      isPublic: true,
      viewCount: 42,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: mockSharedReport,
    });
  } catch (error) {
    console.error('获取分享报告失败:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取分享报告时发生错误',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// POST /api/share - 创建分享链接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, reportContent, isPublic = true, expiresIn = 7 } = body;

    if (!reportId || !reportContent) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '报告ID和内容不能为空',
      }, { status: 400 });
    }

    // 这里应该生成分享链接并保存到数据库
    // 暂时返回模拟数据
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    const shareData = {
      id: shareId,
      reportId,
      shareUrl: `${process.env.APP_URL || 'http://localhost:3000'}/report/share/${shareId}`,
      expiresAt: expiresAt.toISOString(),
      isPublic,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: shareData,
    });
  } catch (error) {
    console.error('创建分享链接失败:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: '创建分享链接时发生错误',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
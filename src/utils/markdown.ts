// Markdown导出工具函数

/**
 * Markdown导出元数据接口
 */
export interface MarkdownMetadata {
  commitCount?: number;
  repository?: string;
  timeRange?: string;
  style?: string;
  length?: string;
  generationTime?: number;
  date?: string;
}

/**
 * 下载Markdown格式的报告
 * @param report 报告内容（Markdown格式）
 * @param metadata 报告元数据
 * @param filename 可选的文件名，默认为 weekly-report-YYYY-MM-DD.md
 */
export function downloadMarkdownReport(
  report: string,
  metadata?: MarkdownMetadata,
  filename?: string
): void {
  if (!report) {
    console.error('无法导出空报告');
    return;
  }

  try {
    // 构建Markdown文件内容
    const markdownContent = buildMarkdownContent(report, metadata);

    // 生成文件名
    const defaultFilename = generateFilename(metadata);
    const finalFilename = filename || defaultFilename;

    // 创建Blob并下载
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理URL对象
    URL.revokeObjectURL(url);

    console.log('Markdown报告导出成功:', finalFilename);
  } catch (error) {
    console.error('导出Markdown报告失败:', error);
    throw new Error('导出Markdown报告失败，请重试');
  }
}

/**
 * 构建完整的Markdown内容
 */
function buildMarkdownContent(report: string, metadata?: MarkdownMetadata): string {
  const lines: string[] = [];

  // 标题
  lines.push('# AI周报');
  lines.push('');
  lines.push('> 由AI周报助手生成，基于GitHub提交记录');
  lines.push('');

  // 元数据部分
  if (metadata && Object.keys(metadata).length > 0) {
    lines.push('## 📊 报告信息');
    lines.push('');

    if (metadata.repository) {
      lines.push(`- **仓库**: ${metadata.repository}`);
    }

    if (metadata.timeRange) {
      lines.push(`- **时间范围**: ${metadata.timeRange}`);
    }

    if (metadata.commitCount !== undefined) {
      lines.push(`- **提交数量**: ${metadata.commitCount} 个`);
    }

    if (metadata.style) {
      lines.push(`- **报告风格**: ${metadata.style}`);
    }

    if (metadata.length) {
      lines.push(`- **报告长度**: ${metadata.length}`);
    }

    const date = metadata.date || new Date().toLocaleDateString('zh-CN');
    lines.push(`- **生成日期**: ${date}`);

    if (metadata.generationTime) {
      const seconds = Math.round(metadata.generationTime / 1000);
      lines.push(`- **生成耗时**: ${seconds} 秒`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // 报告内容
  lines.push(report);
  lines.push('');

  // 页脚
  lines.push('---');
  lines.push('');
  lines.push('*本报告由AI周报助手自动生成，基于GitHub提交记录分析。*');
  lines.push('*报告内容仅供参考，建议结合实际工作情况使用。*');

  return lines.join('\n');
}

/**
 * 生成默认文件名
 */
function generateFilename(metadata?: MarkdownMetadata): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  let repoName = 'report';
  if (metadata?.repository) {
    // 从仓库完整名称中提取仓库名
    const parts = metadata.repository.split('/');
    if (parts.length > 1) {
      repoName = parts[1];
    } else {
      repoName = parts[0];
    }

    // 清理仓库名中的特殊字符
    repoName = repoName.replace(/[^\w\u4e00-\u9fff-]/g, '-');
  }

  return `weekly-report-${repoName}-${dateStr}.md`;
}

/**
 * 预览Markdown报告（在新标签页中打开）
 * 注意：由于浏览器安全限制，直接打开Markdown文件可能无法正确渲染
 * 此函数创建一个包含Markdown内容的HTML页面进行预览
 */
export function previewMarkdownReport(report: string, metadata?: MarkdownMetadata): void {
  if (!report) {
    console.error('无法预览空报告');
    return;
  }

  try {
    const markdownContent = buildMarkdownContent(report, metadata);

    // 创建HTML预览页面
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI周报预览</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-dark.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            background-color: #fff;
        }
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
        }
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0366d6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        .print-button:hover {
            background: #0356c6;
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">打印报告</button>
    <div class="markdown-body">
        <div id="markdown-content"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/5.0.2/marked.min.js"></script>
    <script>
        const markdownContent = ${JSON.stringify(markdownContent)};
        document.getElementById('markdown-content').innerHTML = marked.parse(markdownContent);

        // 添加打印样式
        const style = document.createElement('style');
        style.textContent = \`
            @media print {
                .print-button { display: none; }
                .markdown-body { padding: 0; }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;

    // 在新窗口打开
    const previewWindow = window.open();
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    } else {
      throw new Error('无法打开预览窗口，请检查浏览器弹窗设置');
    }
  } catch (error) {
    console.error('预览Markdown报告失败:', error);
    throw new Error('预览Markdown报告失败，请重试');
  }
}
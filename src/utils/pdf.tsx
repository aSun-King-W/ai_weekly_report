import { ReportPDF } from '@/components/pdf/ReportPDF';
import { pdf } from '@react-pdf/renderer';

/**
 * 生成并下载PDF报告
 * @param report - 报告内容（Markdown格式）
 * @param metadata - 报告的元数据
 * @param filename - 下载的文件名，默认为 'weekly-report-{date}.pdf'
 */
export async function downloadReportPDF(
  report: string,
  metadata?: {
    commitCount?: number;
    generationTime?: number;
    style?: string;
    length?: string;
    repository?: string;
    timeRange?: string;
  },
  filename?: string
): Promise<void> {
  try {
    // 创建PDF文档
    const pdfDoc = <ReportPDF report={report} metadata={metadata} />;

    // 生成Blob
    const blob = await pdf(pdfDoc).toBlob();

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // 设置文件名
    if (!filename) {
      const date = new Date().toISOString().split('T')[0];
      filename = `weekly-report-${date}.pdf`;
    }
    link.download = filename;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('生成PDF失败:', error);
    throw new Error('生成PDF报告时发生错误');
  }
}

/**
 * 在浏览器新标签页中预览PDF
 * @param report - 报告内容
 * @param metadata - 报告的元数据
 */
export async function previewReportPDF(
  report: string,
  metadata?: {
    commitCount?: number;
    generationTime?: number;
    style?: string;
    length?: string;
    repository?: string;
    timeRange?: string;
  }
): Promise<void> {
  try {
    const pdfDoc = <ReportPDF report={report} metadata={metadata} />;
    const blob = await pdf(pdfDoc).toBlob();
    const url = URL.createObjectURL(blob);

    // 在新窗口打开
    window.open(url, '_blank');

    // 注意：URL在窗口关闭后清理？这里不立即清理，避免窗口无法加载
    // 可以设置定时清理，但风险较大，暂时不清理
  } catch (error) {
    console.error('预览PDF失败:', error);
    throw new Error('预览PDF报告时发生错误');
  }
}
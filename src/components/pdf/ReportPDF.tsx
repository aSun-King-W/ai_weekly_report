'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { cleanHyphenation } from '@/lib/utils';

// PDF文本片段样式类型
type FragmentStyle = {
  fontWeight?: number | string;
  fontStyle?: 'italic' | 'normal' | undefined;
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  paddingHorizontal?: number;
  paddingVertical?: number;
  borderRadius?: number;
};

// 注册中文字体
// 使用jsdelivr CDN上的Noto Sans Simplified Chinese字体
let fontFamilyName = 'Helvetica';

try {
  // 注册Noto Sans SC字体
  // 注意：中文字体通常没有真正的斜体变体，所以我们为normal和italic都注册相同的字体文件
  Font.register({
    family: 'NotoSansSC',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.0/files/noto-sans-sc-chinese-simplified-400-normal.woff2',
        fontWeight: 400,
        fontStyle: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.0/files/noto-sans-sc-chinese-simplified-400-normal.woff2',
        fontWeight: 400,
        fontStyle: 'italic',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.0/files/noto-sans-sc-chinese-simplified-700-normal.woff2',
        fontWeight: 700,
        fontStyle: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.0/files/noto-sans-sc-chinese-simplified-700-normal.woff2',
        fontWeight: 700,
        fontStyle: 'italic',
      },
    ],
  });

  fontFamilyName = 'NotoSansSC';
  console.log('字体注册成功: NotoSansSC');
} catch (error) {
  console.warn('字体注册失败，使用Helvetica:', error);
  // 如果在线字体加载失败，使用Helvetica
  // PDF阅读器可能会尝试用系统字体替换
}

// 设置默认字体
const DEFAULT_FONT = fontFamilyName;

// 定义样式
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: DEFAULT_FONT,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 35,
    borderBottomWidth: 3,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid',
    paddingBottom: 20,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 25,
    paddingTop: 20,
    marginHorizontal: -25,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#1e3a8a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    fontWeight: 500,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    width: '100%',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 15,
    paddingTop: 10,
    marginHorizontal: -15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderLeftStyle: 'solid',
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 1.7,
    marginBottom: 16,
    textAlign: 'left',
    width: '100%',
    wordWrap: 'break-word',
    hyphens: 'none',
    color: '#374151',
  },
  list: {
    marginLeft: 18,
    marginBottom: 16,
  },
  listItem: {
    fontSize: 13,
    lineHeight: 1.8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 16,
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 700,
    marginRight: 8,
  },
  listItemText: {
    flex: 1,
    wordWrap: 'break-word',
    color: '#374151',
  },
  codeBlock: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    fontFamily: 'Courier',
    fontSize: 11,
    width: '100%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    color: '#e5e7eb',
    lineHeight: 1.5,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderLeftStyle: 'solid',
    paddingLeft: 18,
    marginLeft: 8,
    marginBottom: 16,
    fontStyle: 'italic',
    fontWeight: 500,
    color: '#4b5563',
    width: '100%',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  hr: {
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    marginVertical: 32,
    width: '100%',
    borderStyle: 'dashed',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    fontFamily: DEFAULT_FONT,
  },
  metadata: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 8,
    width: '100%',
    fontFamily: DEFAULT_FONT,
    lineHeight: 1.5,
  },
});

// 解析Markdown为结构化的元素
const parseMarkdown = (markdown: string) => {
  // 预处理：清理连字符换行问题
  const preprocessedMarkdown = cleanHyphenation(markdown, { useNonBreakingHyphen: true });

  const lines = preprocessedMarkdown.split('\n');
  const elements: Array<{
    type: string;
    content: string;
    level?: number;
    items?: string[]; // 用于列表
    language?: string; // 用于代码块
    styles?: Array<{ text: string; bold?: boolean; italic?: boolean }>; // 内联样式片段
  }> = [];

  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLanguage = '';
  let inList = false;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ');
      if (paragraphText.trim()) {
        elements.push({ type: 'paragraph', content: paragraphText });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push({ type: 'list', content: '', items: [...listItems] });
      listItems = [];
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push({
        type: 'code',
        content: codeBlockContent.join('\n'),
        language: codeBlockLanguage
      });
      codeBlockContent = [];
      codeBlockLanguage = '';
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 检查代码块开始/结束
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        // 代码块开始
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeBlockLanguage = trimmed.substring(3).trim() || '';
      } else {
        // 代码块结束
        flushCodeBlock();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // 检查空行
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // 检查标题 (支持 H1 到 H6)
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      elements.push({ type: `h${level}`, content, level });
      continue;
    }

    // 检查列表项
    const listItemMatch = trimmed.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (listItemMatch) {
      flushParagraph();
      if (!inList) {
        inList = true;
      }
      listItems.push(listItemMatch[2]);
      continue;
    }

    // 检查引用
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      elements.push({ type: 'blockquote', content: trimmed.substring(2) });
      continue;
    }

    // 检查分隔线
    if (trimmed.match(/^[-*_]{3,}$/)) {
      flushParagraph();
      flushList();
      elements.push({ type: 'hr', content: '' });
      continue;
    }

    // 普通文本 - 添加到当前段落
    currentParagraph.push(trimmed);
  }

  // 处理剩余内容
  flushParagraph();
  flushList();
  flushCodeBlock();

  return elements;
};

// 解析内联Markdown格式为带样式的文本片段
const parseInlineMarkdown = (text: string): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> => {
  // 如果文本中没有Markdown格式，直接返回
  if (!text.includes('**') && !text.includes('*') && !text.includes('`') && !text.includes('__') && !text.includes('_')) {
    return [{ text }];
  }

  // 使用递归函数处理文本
  const parse = (str: string, depth = 0): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> => {
    if (depth > 10) return [{ text: str }]; // 防止无限递归

    const result: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> = [];
    const current = str;

    // 查找第一个Markdown标记
    const boldMatch = current.match(/(\*\*|__)(.+?)\1/);
    const italicMatch = current.match(/(\*|_)(.+?)\1/);
    const codeMatch = current.match(/`(.+?)`/);

    // 确定哪个标记最先出现
    let match: RegExpMatchArray | null = null;
    let type: 'bold' | 'italic' | 'code' | null = null;
    let startIndex = Infinity;

    if (boldMatch && boldMatch.index! < startIndex) {
      match = boldMatch;
      type = 'bold';
      startIndex = boldMatch.index!;
    }

    if (italicMatch && italicMatch.index! < startIndex) {
      match = italicMatch;
      type = 'italic';
      startIndex = italicMatch.index!;
    }

    if (codeMatch && codeMatch.index! < startIndex) {
      match = codeMatch;
      type = 'code';
      startIndex = codeMatch.index!;
    }

    if (!match) {
      // 没有更多标记，添加剩余文本
      if (current) {
        result.push({ text: current });
      }
      return result;
    }

    // 添加标记前的文本
    if (startIndex > 0) {
      result.push({ text: current.substring(0, startIndex) });
    }

    // 添加带样式的文本
    const content = type === 'bold' ? boldMatch![2] :
                   type === 'italic' ? italicMatch![2] :
                   codeMatch![1];

    if (type === 'bold') {
      result.push({ text: content, bold: true });
    } else if (type === 'italic') {
      result.push({ text: content, italic: true });
    } else if (type === 'code') {
      result.push({ text: content, code: true });
    }

    // 处理标记后的文本
    const endIndex = startIndex + match[0].length;
    if (endIndex < current.length) {
      const remaining = current.substring(endIndex);
      result.push(...parse(remaining, depth + 1));
    }

    return result;
  };

  return parse(text);
};

interface ReportPDFProps {
  report: string;
  metadata?: {
    commitCount?: number;
    generationTime?: number;
    style?: string;
    length?: string;
    date?: string;
    repository?: string;
    timeRange?: string;
  };
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ report, metadata = {} }) => {
  const sections = parseMarkdown(report);
  const currentDate = metadata.date || new Date().toLocaleDateString('zh-CN');
  const pageCount = Math.ceil(sections.length / 20); // 简单分页估算

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.title} wrap>AI周报</Text>
          <Text style={styles.subtitle} wrap>基于GitHub提交记录生成的周度工作报告</Text>

          {/* 元数据 */}
          {metadata.repository && (
            <Text style={styles.metadata} wrap>仓库: {metadata.repository}</Text>
          )}
          {metadata.timeRange && (
            <Text style={styles.metadata} wrap>时间范围: {metadata.timeRange}</Text>
          )}
          {metadata.commitCount !== undefined && (
            <Text style={styles.metadata} wrap>提交数量: {metadata.commitCount}</Text>
          )}
          {metadata.style && (
            <Text style={styles.metadata} wrap>报告风格: {metadata.style}</Text>
          )}
          {metadata.length && (
            <Text style={styles.metadata} wrap>报告长度: {metadata.length}</Text>
          )}
          <Text style={styles.metadata} wrap>生成时间: {currentDate}</Text>
        </View>

        {/* 内容 */}
        {sections.map((section, index) => {
          // 标题处理 (h1-h6)
          if (section.type.startsWith('h') && section.type.length === 2) {
            const level = parseInt(section.type.charAt(1));
            let fontSize = 18;
            if (level === 2) fontSize = 16;
            else if (level === 3) fontSize = 14;
            else if (level === 4) fontSize = 13;
            else if (level === 5) fontSize = 12;
            else if (level === 6) fontSize = 11;

            const fragments = parseInlineMarkdown(section.content);
            return (
              <View key={index} style={styles.section}>
                <Text style={[styles.sectionTitle, { fontSize }]} wrap>
                  {fragments.map((fragment, fragIndex) => {
                    const fragmentStyle: FragmentStyle = {};
                    // 设置字重：bold为700，否则为400
                    fragmentStyle.fontWeight = fragment.bold ? 700 : 400;
                    if (fragment.italic) fragmentStyle.fontStyle = 'italic';
                    if (fragment.code) {
                      fragmentStyle.fontFamily = 'Courier';
                      fragmentStyle.fontSize = fontSize - 2;
                      fragmentStyle.backgroundColor = '#1f2937';
                      fragmentStyle.paddingHorizontal = 6;
                      fragmentStyle.paddingVertical = 3;
                      fragmentStyle.borderRadius = 4;
                      fragmentStyle.color = '#e5e7eb';
                    }

                    return (
                      <Text key={fragIndex} style={fragmentStyle}>
                        {fragment.text}
                      </Text>
                    );
                  })}
                </Text>
              </View>
            );
          }

          // 列表处理
          if (section.type === 'list' && section.items) {
            return (
              <View key={index} style={styles.list}>
                {section.items.map((item, itemIndex) => {
                  const fragments = parseInlineMarkdown(item);
                  return (
                    <View key={itemIndex} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listItemText} wrap>
                        {fragments.map((fragment, fragIndex) => {
                          const fragmentStyle: FragmentStyle = {};
                          // 设置字重：bold为700，否则为400
                          fragmentStyle.fontWeight = fragment.bold ? 700 : 400;
                          if (fragment.italic) fragmentStyle.fontStyle = 'italic';
                          if (fragment.code) {
                            fragmentStyle.fontFamily = 'Courier';
                            fragmentStyle.fontSize = 10;
                            fragmentStyle.backgroundColor = '#1f2937';
                            fragmentStyle.paddingHorizontal = 5;
                            fragmentStyle.paddingVertical = 2;
                            fragmentStyle.borderRadius = 3;
                            fragmentStyle.color = '#e5e7eb';
                          }

                          return (
                            <Text key={fragIndex} style={fragmentStyle}>
                              {fragment.text}
                            </Text>
                          );
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          }

          // 代码块
          if (section.type === 'code') {
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.codeBlock} wrap>
                  {section.content}
                </Text>
              </View>
            );
          }

          // 引用
          if (section.type === 'blockquote') {
            return (
              <View key={index} style={styles.section}>
                <Text style={styles.blockquote} wrap>
                  {section.content}
                </Text>
              </View>
            );
          }

          // 分隔线
          if (section.type === 'hr') {
            return (
              <View key={index} style={styles.section}>
                <View style={styles.hr} />
              </View>
            );
          }

          // 默认段落 - 确保文本换行
          const fragments = parseInlineMarkdown(section.content);
          return (
            <View key={index} style={styles.section}>
              <Text style={styles.paragraph} wrap>
                {fragments.map((fragment, fragIndex) => {
                  const fragmentStyle: FragmentStyle = {};
                  // 设置字重：bold为700，否则为400
                  fragmentStyle.fontWeight = fragment.bold ? 700 : 400;
                  if (fragment.italic) fragmentStyle.fontStyle = 'italic';
                  if (fragment.code) {
                    fragmentStyle.fontFamily = 'Courier';
                    fragmentStyle.fontSize = 10;
                    fragmentStyle.backgroundColor = '#1f2937';
                    fragmentStyle.paddingHorizontal = 5;
                    fragmentStyle.paddingVertical = 2;
                    fragmentStyle.borderRadius = 3;
                    fragmentStyle.color = '#e5e7eb';
                  }

                  return (
                    <Text key={fragIndex} style={fragmentStyle}>
                      {fragment.text}
                    </Text>
                  );
                })}
              </Text>
            </View>
          );
        })}

        {/* 页脚 */}
        <Text style={styles.footer} fixed wrap>
          第 {1} 页，共 {pageCount} 页 • {metadata.repository ? metadata.repository + ' • ' : ''}由AI周报助手生成 • {currentDate}
        </Text>
      </Page>
    </Document>
  );
};
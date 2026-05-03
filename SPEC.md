# AI周报助手 - 项目规格说明书

## 项目概述
AI周报助手是一个连接GitHub的个人开发工具，自动获取本周commit记录，使用DeepSeek AI生成可读的周报页面，并支持一键分享给同事。

## 目标用户
- **主要用户**：个人开发者
- **使用场景**：每周工作回顾、进度跟踪、团队汇报
- **用户痛点**：手动整理周报耗时、难以全面回顾工作、分享不便

## 核心需求总结

### 功能需求
1. **GitHub集成**
   - GitHub OAuth认证
   - 获取用户仓库列表
   - 提取本周commit记录

2. **AI周报生成**
   - 使用DeepSeek API分析commit数据
   - 生成结构化周报（分类总结、成就、挑战等）
   - 支持多种报告风格和长度

3. **周报展示**
   - 美观的可读页面
   - Markdown格式渲染
   - 响应式设计支持

4. **分享功能**
   - 生成可分享URL链接
   - PDF导出功能
   - Markdown复制功能
   - 社交媒体分享

5. **时间管理**
   - 自动获取本周commit（周一至周日）
   - 支持自定义时间范围选择
   - 历史时间范围记忆

### 非功能需求
1. **性能**
   - 页面加载时间 < 3秒
   - API响应时间 < 2秒
   - 支持100+ commits处理

2. **安全性**
   - GitHub OAuth安全认证
   - API密钥保护
   - 用户数据隐私保护

3. **可用性**
   - 直观的用户界面
   - 清晰的错误提示
   - 移动端友好设计

4. **可靠性**
   - 外部API错误处理
   - 请求重试机制
   - 数据缓存策略

## 用户故事

### 主要用户流程
1. **认证流程**
   ```
   作为开发者
   我想要使用GitHub账号登录
   以便访问我的代码仓库
   ```

2. **周报生成流程**
   ```
   作为开发者
   我想要选择仓库并获取本周commit
   然后让AI生成结构化的周报
   以便快速回顾本周工作
   ```

3. **分享流程**
   ```
   作为开发者
   我想要将生成的周报一键分享给同事
   以便汇报工作进展
   ```

4. **自定义流程**
   ```
   作为开发者
   我想要自定义时间范围和报告风格
   以便生成符合特定需求的周报
   ```

### 具体用户场景
- **场景1：周五工作回顾**
  - 开发者周五下午登录系统
  - 选择主要工作仓库
  - 获取本周所有commit
  - 生成详细周报
  - 分享给团队领导

- **场景2：项目里程碑汇报**
  - 开发者选择特定时间范围（如项目阶段）
  - 生成特定风格的报告（如技术详细版）
  - 导出PDF存档
  - 分享给项目相关方

- **场景3：个人工作记录**
  - 开发者每周自动生成周报
  - 保存为Markdown文件
  - 建立个人工作档案

## 技术决策

### 技术栈选择
| 组件 | 技术选择 | 理由 |
|------|----------|------|
| 前端框架 | Next.js 16 (App Router) | 全栈能力、优秀性能、TypeScript原生支持 |
| 样式方案 | Tailwind CSS | 快速开发、响应式设计、维护简单 |
| 认证方案 | NextAuth.js | 标准OAuth集成、安全可靠 |
| AI服务 | DeepSeek API (OpenAI兼容格式) | 优秀的文本生成能力、API稳定性、成本效益 |
| 开发语言 | TypeScript | 类型安全、更好的开发体验 |
| 部署平台 | Vercel | Next.js优化、简单部署、全球CDN |
| PDF生成 | @react-pdf/renderer | React友好、客户端生成 |
| 图标库 | Lucide React | 轻量级、现代化 |

### 架构决策
1. **全前端架构**
   - 原因：用户要求"仅前端部署"
   - 方案：Next.js API路由 + 客户端渲染
   - 优势：简化部署、降低成本

2. **无数据库设计**
   - 原因：简化架构、个人使用场景
   - 方案：Session存储 + URL参数传递
   - 备用：后期可添加轻量级数据库

3. **缓存策略**
   - GitHub API响应缓存
   - AI API结果缓存（DeepSeek API）
   - 客户端状态缓存

4. **错误处理策略**
   - 优雅降级
   - 用户友好错误提示
   - 自动重试机制

## 功能规格详细说明

### 1. 认证模块
#### 功能描述
- GitHub OAuth 2.0认证
- 获取`read:user`、`user:email`、`repo`权限
- 会话管理和令牌刷新

#### 技术实现
- NextAuth.js标准配置
- JWT token存储GitHub access token
- 安全会话管理

### 2. GitHub数据获取模块
#### 功能描述
- 获取用户可访问仓库列表
- 按时间范围筛选commit
- 支持分页加载大量commit

#### 数据模型
```typescript
interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  repository: {
    name: string;
    owner: string;
  };
}
```

#### API设计
- `GET /api/github/repositories` - 获取用户仓库
- `GET /api/github/commits` - 获取指定仓库commit
  - 参数：owner, repo, since, until, page, per_page

### 3. AI周报生成模块
#### 功能描述
- 多种报告风格：专业、轻松、技术
- 多种报告长度：简洁、详细、完整
- 可选的统计指标

#### 提示词模板
```text
根据以下GitHub提交记录生成一份{length}的周报，使用{style}风格：

提交记录：
{commit_summaries}

要求：
1. 总结本周的主要工作内容
2. 按功能模块或项目分类
3. 突出重要进展和成就
4. 提及遇到的挑战和解决方案
5. 展望下周计划
{include_metrics ? "6. 包含统计数据（提交数量、代码行数变化等）" : ""}

请生成格式良好的Markdown周报：
```

#### API设计
- `POST /api/generate/report` - 生成周报
  - 请求体：{ commits: Commit[], options: ReportOptions }
  - 响应：{ report: string, metadata: object }

### 4. 用户界面模块
#### 页面结构
1. **首页** (`/`)
   - 产品介绍
   - 登录入口

2. **仪表板** (`/dashboard`)
   - 仓库选择器
   - 时间选择器
   - Commit列表
   - 报告生成器
   - 报告预览

3. **报告详情** (`/report/[id]`)
   - 完整报告展示
   - 分享操作
   - 导出选项

4. **分享页面** (`/report/share/[id]`)
   - 无需认证的报告查看
   - 只读模式
   - 基本的分享功能

#### 组件设计
- 响应式布局网格系统
- 暗色/亮色主题支持
- 加载状态和骨架屏
- 错误状态提示

### 5. 分享模块
#### 分享方式
1. **URL分享**
   - 生成唯一分享链接
   - 支持设置有效期
   - 数据加密传输

2. **PDF导出**
   - 客户端PDF生成
   - 自定义页眉页脚
   - 打印优化

3. **Markdown导出**
   - 一键复制Markdown
   - 格式保持完整

4. **社交媒体分享**
   - Twitter/X分享
   - LinkedIn分享
   - 企业微信/钉钉

#### 技术实现
- URL参数Base64编码
- @react-pdf/renderer生成PDF
- Clipboard API复制文本
- Web Share API社交媒体分享

### 6. 时间管理模块
#### 时间范围选项
1. **本周** (默认)
   - 周一00:00至周日23:59
   - 自动时区检测

2. **上周**
   - 前一周相同范围

3. **自定义范围**
   - 日期选择器
   - 快捷选项（最近7天、本月、本季度）

#### 实现细节
- 基于用户本地时区
- 日期格式国际化
- 时间范围验证

## 非功能需求详细说明

### 性能指标
1. **页面加载性能**
   - 首次内容绘制 (FCP) < 1.5s
   - 最大内容绘制 (LCP) < 2.5s
   - 累积布局偏移 (CLS) < 0.1

2. **API性能**
   - GitHub API响应缓存300秒
   - AI API结果缓存（DeepSeek API）3600秒
   - 客户端数据缓存localStorage

3. **资源优化**
   - 图片懒加载
   - 代码分割
   - 字体优化

### 安全要求
1. **认证安全**
   - HTTPS强制
   - CSRF保护
   - 会话超时（24小时）

2. **数据安全**
   - GitHub token不存储数据库
   - API密钥环境变量管理
   - 用户数据加密传输

3. **API安全**
   - 请求速率限制
   - 输入验证
   - 输出编码

### 可访问性
- WCAG 2.1 AA标准
- 键盘导航支持
- 屏幕阅读器兼容
- 颜色对比度达标

### 浏览器支持
- Chrome (最新2版本)
- Firefox (最新2版本)
- Safari (最新2版本)
- Edge (最新2版本)

## 项目里程碑

### 阶段1：MVP版本 (6周)
- 基础认证和GitHub集成
- AI周报生成核心功能
- 基本的分享功能
- 部署到生产环境

### 阶段2：功能完善 (4周)
- 时间选择功能
- PDF导出优化
- 用户体验改进
- 性能优化

### 阶段3：高级功能 (4周)
- 多仓库支持
- 团队协作功能
- 高级分析功能
- 第三方集成

## 成功指标

### 业务指标
- 周活跃用户 > 100
- 用户满意度 > 4.5/5
- 分享率 > 30%

### 技术指标
- 系统可用性 > 99.5%
- API成功率 > 99%
- 平均响应时间 < 1.5s

### 用户体验指标
- 任务完成率 > 90%
- 错误率 < 5%
- 用户留存率 > 40%

## 风险与缓解

### 技术风险
1. **GitHub API限制**
   - 风险：API速率限制影响功能
   - 缓解：OAuth token提升限制、缓存策略

2. **AI API成本**
   - 风险：API使用成本不可控
   - 缓解：使用限制、提示词优化、成本监控

3. **无数据库限制**
   - 风险：功能扩展受限
   - 缓解：设计可扩展架构、预留数据库接口

### 业务风险
1. **用户采纳**
   - 风险：用户不愿意使用新工具
   - 缓解：简洁易用的UI、明确的价值主张

2. **竞争风险**
   - 风险：类似工具竞争
   - 缓解：差异化功能、更好的用户体验

## 附录

### 环境变量配置
```env
# 必需变量
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=32-character-secret
GITHUB_CLIENT_ID=github-oauth-client-id
GITHUB_CLIENT_SECRET=github-oauth-client-secret
ANTHROPIC_API_KEY=sk-ant-api-key-here  # DeepSeek API密钥（保持变量名兼容）

# 可选变量
APP_URL=https://your-app.vercel.app
CACHE_TTL_GITHUB=300
CACHE_TTL_AI=3600  # AI API响应缓存时间（DeepSeek API）
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900
```

### 开发环境设置
1. 克隆仓库
2. 安装依赖：`npm install`
3. 复制环境变量：`cp .env.example .env.local`
4. 配置GitHub OAuth应用
5. 获取DeepSeek API密钥（配置到ANTHROPIC_API_KEY环境变量）
6. 运行开发服务器：`npm run dev`

### 部署流程
1. 推送代码到GitHub仓库
2. 在Vercel导入项目
3. 配置环境变量
4. 部署生产版本
5. 验证功能

---

**文档版本**: 1.2  
**创建日期**: 2026-04-13  
**最后更新**: 2026-05-03  
**状态**: 迭代优化中  
**审核人**: 需求方
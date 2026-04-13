# AI周报助手

基于Next.js 15开发的AI周报生成工具，连接GitHub自动获取commit记录，使用DeepSeek AI生成可读的周报页面，并支持一键分享。

## 功能特性

- 🔐 **GitHub OAuth认证** - 安全登录，获取仓库访问权限
- 📊 **智能周报生成** - 使用DeepSeek AI分析commit记录，基于实际项目内容生成结构化周报
- 🎨 **多种报告风格** - 专业、轻松、技术等多种风格可选
- 📅 **灵活时间范围** - 本周、上周、自定义时间范围
- 📤 **一键分享** - 生成可分享链接、PDF导出、Markdown复制
- 📱 **响应式设计** - 移动端友好的现代化界面
- 🎯 **TypeScript支持** - 完整的类型安全开发体验

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **样式方案**: Tailwind CSS
- **开发语言**: TypeScript
- **认证方案**: NextAuth.js (GitHub OAuth)
- **AI服务**: DeepSeek API (OpenAI兼容格式)
- **UI组件**: Lucide React图标
- **代码质量**: ESLint + TypeScript严格模式
- **部署平台**: Vercel (推荐)

## 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn 或 pnpm
- GitHub OAuth应用
- DeepSeek API密钥

### 安装步骤

1. 克隆仓库
   ```bash
   git clone <repository-url>
   cd weekly-report
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   ```bash
   cp .env.example .env.local
   ```
   编辑`.env.local`文件，填写您的GitHub OAuth和DeepSeek API配置。

4. 运行开发服务器
   ```bash
   npm run dev
   ```

5. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 环境变量配置

参考`.env.example`文件，需要配置以下变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXTAUTH_URL` | NextAuth.js回调URL | 是 |
| `NEXTAUTH_SECRET` | NextAuth.js加密密钥 | 是 |
| `GITHUB_CLIENT_ID` | GitHub OAuth客户端ID | 是 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth客户端密钥 | 是 |
| `ANTHROPIC_API_KEY` | DeepSeek API密钥（变量名保持兼容） | 是 |

**AI服务说明**：
- 本项目使用DeepSeek API（兼容OpenAI格式）进行周报生成
- 变量名保持为`ANTHROPIC_API_KEY`以向后兼容现有配置
- 确保您的DeepSeek API密钥具有足够的额度
- API基础URL：`https://api.deepseek.com`，模型：`deepseek-chat`

## 项目结构

```
src/
├── app/                    # Next.js App Router页面
│   ├── api/               # API路由
│   │   ├── auth/          # 认证相关API
│   │   ├── github/        # GitHub数据API
│   │   ├── generate/      # AI报告生成API
│   │   └── share/         # 分享功能API
│   ├── dashboard/         # 仪表板页面
│   ├── report/            # 报告详情页面
│   └── layout.tsx         # 根布局
├── components/            # React组件
│   ├── common/           # 通用组件
│   ├── layout/           # 布局组件
│   └── ui/               # UI组件
├── hooks/                # 自定义React Hooks
├── lib/                  # 工具库和常量
├── types/                # TypeScript类型定义
└── utils/                # 工具函数
```

## 开发脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行ESLint代码检查

## 部署

### Vercel部署（推荐）

1. 推送代码到GitHub仓库
2. 在[Vercel](https://vercel.com)导入项目
3. 配置环境变量
4. 点击部署

### 其他部署方式

参考Next.js官方部署文档：https://nextjs.org/docs/app/building-your-application/deploying

## 许可证

MIT

## 联系与支持

如有问题或建议，请提交GitHub Issue或联系项目维护者。

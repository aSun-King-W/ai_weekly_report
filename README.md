# AI周报助手

基于Next.js 16开发的AI周报生成工具，连接GitHub自动获取commit记录，使用DeepSeek AI生成可读的周报页面，并支持一键分享。内置Tool Use Agent支持自然语言查询和完整的工具调用链。

## 功能特性

- 🔐 **GitHub OAuth认证** - 安全登录，获取仓库访问权限
- 📊 **智能周报生成** - 使用DeepSeek AI分析commit记录，基于实际项目内容生成结构化周报
- 🤖 **Tool Use Agent** - 智能Agent支持自然语言查询，自动调用GitHub API和报告生成工具，实现完整的工具调用链
- 🎨 **多种报告风格** - 专业、轻松、技术等多种风格可选
- 📅 **灵活时间范围** - 本周、上周、自定义时间范围
- 📤 **一键分享** - 生成可分享链接、PDF导出、Markdown复制
- ⬇️ **文件下载** - 支持直接下载Markdown格式周报文件
- 📱 **响应式设计** - 移动端友好的现代化界面
- 🎯 **TypeScript支持** - 完整的类型安全开发体验
- ✅ **结构化评估** - 包含10个测试用例的自动化评估系统

## 功能详情

### 🔐 GitHub集成
- 安全的GitHub OAuth认证，仅需一次授权
- 自动获取您的所有GitHub仓库列表
- 按时间范围筛选提交记录（本周、上周、自定义日期）
- 支持多仓库同时分析

### 🤖 AI智能分析
- 使用DeepSeek AI分析提交记录内容
- 支持三种报告风格：**专业**、**轻松**、**技术**
- 支持三种详细程度：**简洁**、**详细**、**完整**
- 自动识别工作类型（功能开发、问题修复、重构等）
- 智能生成下周工作计划

### 🧠 Tool Use Agent
- **自然语言接口**：支持自然语言查询生成周报
- **智能工具调用**：自动调用GitHub API获取提交记录，调用报告生成工具
- **多步工作流**：支持复杂的多步查询和工具调用链
- **错误处理**：智能处理错误情况，提供有意义的反馈
- **评估系统**：包含10个测试用例的结构化评估，计算关键词匹配率

### 📄 报告输出
- **实时预览**：Markdown格式实时渲染
- **PDF导出**：生成专业格式的PDF文档
- **Markdown复制**：一键复制Markdown源码
- **文件下载**：支持直接下载Markdown格式周报文件
- **分享链接**：生成唯一URL分享给团队成员
- **响应式设计**：在手机、平板、电脑上完美显示

### ⚙️ 高级功能
- **缓存机制**：减少API调用，提升响应速度
- **错误处理**：优雅的降级方案，AI服务不可用时生成基础报告
- **国际化**：中文界面和报告生成
- **暗色模式**：支持系统主题切换

## 技术栈

- **前端框架**: Next.js 16.2.3 (App Router)
- **样式方案**: Tailwind CSS v4
- **开发语言**: TypeScript 5+
- **认证方案**: NextAuth.js v4 (GitHub OAuth)
- **AI服务**: DeepSeek API (OpenAI兼容格式) + OpenAI SDK
- **Agent架构**: Tool Use Agent，支持function calling
- **UI组件**: Lucide React图标
- **PDF生成**: @react-pdf/renderer
- **Markdown渲染**: react-markdown
- **代码质量**: ESLint 9 + TypeScript严格模式
- **部署平台**: Vercel (推荐)

## 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn 或 pnpm
- GitHub OAuth应用
- DeepSeek API密钥

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd weekly-report
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或使用yarn/pnpm
   yarn install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   编辑`.env.local`文件，填写您的配置：
   - `NEXTAUTH_SECRET`: 运行 `openssl rand -base64 32` 生成
   - `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`: 从GitHub OAuth应用获取
   - `ANTHROPIC_API_KEY`: 从DeepSeek平台获取

4. **运行开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. **打开浏览器访问** [http://localhost:3000](http://localhost:3000)

### 环境变量配置

复制`.env.example`为`.env.local`并填写实际值：

```bash
cp .env.example .env.local
```

**注意**：评估系统会自动从`.env.local`文件加载环境变量。确保在运行评估前正确配置此文件。

参考`.env.example`文件，需要配置以下变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXTAUTH_URL` | NextAuth.js回调URL，开发环境通常为`http://localhost:3000` | 是 |
| `NEXTAUTH_SECRET` | NextAuth.js加密密钥，可使用`openssl rand -base64 32`生成 | 是 |
| `GITHUB_CLIENT_ID` | GitHub OAuth客户端ID | 是 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth客户端密钥 | 是 |
| `ANTHROPIC_API_KEY` | DeepSeek API密钥 | 是 |
| `APP_URL` | 应用基础URL（可选） | 否 |
| `GITHUB_ACCESS_TOKEN` | GitHub个人访问令牌（用于Agent评估系统） | 否（仅评估需要） |

**AI服务说明**：
- 本项目使用**DeepSeek API**（兼容OpenAI格式）进行周报生成
- 变量名保持为`ANTHROPIC_API_KEY`以保持向后兼容性
- 获取DeepSeek API密钥：访问[DeepSeek平台](https://platform.deepseek.com/)注册并获取API密钥
- API基础URL：`https://api.deepseek.com`，模型：`deepseek-chat`
- 项目使用OpenAI SDK调用DeepSeek API，完全兼容OpenAI格式

**GitHub OAuth应用配置**：
1. 访问[GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的OAuth App
3. 设置回调URL为：`http://localhost:3000/api/auth/callback/github`
4. 获取Client ID和Client Secret

**GitHub个人访问令牌（用于评估系统）**：
- `GITHUB_ACCESS_TOKEN`：用于Agent评估系统的GitHub个人访问令牌
- 获取方式：访问[GitHub Personal Access Tokens](https://github.com/settings/tokens)创建新令牌
- 权限要求：`repo`权限（访问私有仓库）或`public_repo`权限（仅访问公共仓库）
- 注意：此令牌不同于OAuth凭证，用于直接调用GitHub API进行测试

## 项目结构

```
src/
├── app/                              # Next.js App Router页面
│   ├── api/                          # API路由
│   │   ├── agent/                    # Agent API
│   │   │   └── report/               # Agent报告生成API
│   │   ├── auth/[...nextauth]/      # NextAuth.js认证路由
│   │   ├── github/                   # GitHub数据API
│   │   │   ├── commits/             # 获取提交记录
│   │   │   ├── repositories/        # 获取仓库列表
│   │   │   └── user/                # 获取用户信息
│   │   ├── generate/report/         # AI报告生成API
│   │   └── share/[id]/              # 分享功能API
│   ├── auth/                         # 认证相关页面
│   │   ├── error/                    # 认证错误页面
│   │   ├── signin/                   # 登录页面
│   │   └── signout/                  # 登出页面
│   ├── dashboard/                    # 仪表板页面
│   ├── layout.tsx                    # 根布局
│   └── page.tsx                      # 首页
├── components/                       # React组件
│   ├── common/                       # 通用组件（如Button）
│   ├── layout/                       # 布局组件（如Header）
│   ├── pdf/                          # PDF生成组件
│   └── providers/                    # 上下文提供者
├── hooks/                            # 自定义React Hooks
│   ├── useGitHub.ts                  # GitHub数据获取Hook
│   └── useReport.ts                  # 报告生成Hook
├── lib/                              # 工具库和常量
│   ├── ai-service.ts                 # DeepSeek AI服务
│   ├── agent-service.ts              # Agent核心服务
│   ├── auth.ts                       # 认证工具函数
│   ├── constants.ts                  # 常量定义
│   ├── tools.ts                      # 工具定义和实现
│   └── utils.ts                      # 通用工具函数
├── tests/                            # 测试文件
│   └── agent.test.ts                 # Agent测试用例
├── types/                            # TypeScript类型定义
│   └── index.ts                      # 全局类型定义
└── utils/                            # 工具函数
    ├── api.ts                        # API调用封装
    ├── date.ts                       # 日期处理函数
    ├── evaluation.ts                 # Agent评估工具
    ├── markdown.ts                   # Markdown处理
    └── pdf.tsx                       # PDF生成工具
```

## 开发脚本

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 运行代码检查
npm run lint

# 运行Agent模拟评估
node src/tests/agent.test.ts

# 运行Agent真实评估（需要环境变量）
node src/tests/agent.test.ts --real

# 清理构建缓存
rm -rf .next
# Windows: rmdir /s /q .next
```

## Agent使用

### API端点

Agent提供了以下API端点：

#### 1. 自然语言查询接口
```
POST /api/agent/report
```
**请求体**：
```json
{
  "query": "为facebook/react仓库生成本周的技术风格周报"
}
```
**响应**：
```json
{
  "success": true,
  "data": {
    "content": "生成的周报内容...",
    "toolCalls": 2,
    "metadata": {
      "executionTime": 3456,
      "toolExecutionTimes": {
        "tool_execution": 1234
      }
    }
  }
}
```

#### 2. 简化参数接口
```
GET /api/agent/report?owner=facebook&repo=react&since=2024-01-01&until=2024-01-07&style=technical&length=detailed&includeMetrics=true
```

#### 3. 文件下载接口
支持直接下载Markdown格式周报文件：

**GET请求下载**：
```
GET /api/agent/report?owner=facebook&repo=react&download=true
```

**POST请求下载**：
```
POST /api/agent/report
```
请求体：
```json
{
  "query": "为facebook/react仓库生成本周的技术风格周报",
  "download": true
}
```

**响应**：
- 当`download=true`时，返回Markdown文件下载，文件名格式：`weekly-report-owner-repo-YYYY-MM-DD.md`
- 当`download=false`或未指定时，返回JSON响应包含周报内容

### 评估系统

项目包含一个完整的Agent评估系统，用于测试Tool Use Agent的功能：

#### 测试用例
评估系统包含10个测试用例，涵盖不同场景：
1. **简单请求** - 基本功能测试
2. **带日期范围** - 测试日期参数解析
3. **指定报告风格** - 测试风格参数
4. **简洁报告** - 测试长度选项
5. **包含统计指标** - 测试统计功能
6. **中文请求** - 测试自然语言理解
7. **混合参数** - 测试多参数解析
8. **复杂请求** - 测试多条件请求
9. **边缘情况-空仓库** - 测试空仓库处理
10. **错误情况** - 测试错误处理

**重要说明**：测试用例使用公共仓库（如`facebook/react`）进行**基准测试**，验证Agent的通用功能。实际使用时，请通过API端点测试您自己的仓库。

#### 运行评估
```bash
# 运行模拟评估（使用模拟数据）
node src/tests/agent.test.ts

# 运行真实评估（需要环境变量，调用真实API）
node src/tests/agent.test.ts --real
```

**注意**：项目使用ES模块，测试文件可以直接使用Node.js运行（需要Node.js 18+）。

#### 评估指标
- **关键词匹配率**：检查输出是否包含预期关键词
- **结构检查**：验证报告是否包含标题、概览、内容、总结等部分
- **通过条件**：匹配率≥50%，有基本结构，长度>100字符

#### 输出结果
评估完成后会生成 `agent-evaluation-report.md` 文件，包含：
- 总体统计（通过率、平均匹配率）
- 每个测试用例的详细结果
- 改进建议

**注意**：真实评估会调用DeepSeek API和GitHub API，可能产生API调用费用。

### 扩展Agent

要添加新工具：
1. 在 `src/lib/tools.ts` 中定义新工具函数
2. 在 `getToolsDefinition()` 中添加工具定义
3. 在 `executeToolCalls()` 中添加工具调用处理

## 部署

### Vercel部署（推荐）

1. 推送代码到GitHub、GitLab或Bitbucket仓库
2. 在[Vercel](https://vercel.com)导入项目
3. 配置环境变量（参考环境变量配置部分）
4. 点击部署，Vercel会自动检测Next.js项目

### Docker部署

项目包含简单的Docker配置示例：

```dockerfile
# 使用官方Node.js镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 传统服务器部署

```bash
# 1. 构建应用
npm run build

# 2. 安装PM2等进程管理工具
npm install -g pm2

# 3. 启动应用
pm2 start npm --name "weekly-report" -- start

# 4. 配置Nginx反向代理
# 编辑Nginx配置，将请求代理到localhost:3000
```

### 环境注意事项
- 生产环境务必设置正确的`NEXTAUTH_URL`
- 使用强密码生成`NEXTAUTH_SECRET`
- 配置合适的缓存策略
- 建议启用HTTPS

## 常见问题

### ❓ 如何获取DeepSeek API密钥？
1. 访问 [DeepSeek平台](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在API密钥页面创建新的密钥
4. 复制密钥到`ANTHROPIC_API_KEY`环境变量

### ❓ GitHub OAuth回调URL应该设置什么？
- 开发环境：`http://localhost:3000/api/auth/callback/github`
- 生产环境：`https://你的域名.com/api/auth/callback/github`

### ❓ 报告生成失败怎么办？
1. 检查DeepSeek API密钥是否正确
2. 确认API额度是否充足
3. 查看浏览器控制台或服务器日志
4. 应用会自动降级生成基础版报告

### ❓ 如何支持其他AI服务？
项目使用OpenAI兼容格式，理论上支持任何兼容OpenAI API的AI服务：
1. 修改`src/lib/ai-service.ts`中的`baseURL`
2. 更新对应的API密钥环境变量
3. 调整模型名称和参数

### ❓ 如何添加新的报告风格？
1. 编辑`src/lib/ai-service.ts`中的`buildSystemPrompt`方法
2. 在`styleDescriptions`对象中添加新风格描述
3. 更新前端选择器组件

### ❓ 项目支持私有仓库吗？
是的，GitHub OAuth会请求相应的仓库权限。确保OAuth应用有正确的权限范围。

### ❓ Agent评估系统如何使用？
1. 设置`GITHUB_ACCESS_TOKEN`环境变量（GitHub个人访问令牌）
2. 运行`node src/tests/agent.test.ts --real`进行真实评估
3. 查看生成的`agent-evaluation-report.md`文件
4. 评估系统包含10个测试用例，使用公共仓库`facebook/react`进行基准测试

### ❓ 为什么评估测试用例使用facebook/react而不是我的仓库？
评估系统是**基准测试**，用于验证Agent的通用功能。测试用例使用公共仓库确保可重复性。您的实际使用应通过API端点测试自己的仓库：`/api/agent/report?owner=您的用户名&repo=您的仓库名`

### ❓ Agent工具调用失败怎么办？
1. 检查`src/lib/tools.ts`中的工具定义和实现
2. 查看服务器日志中的工具调用错误信息
3. 确保GitHub API令牌有正确的权限
4. 验证DeepSeek API密钥有效且有足够额度

### ❓ 如何扩展Agent的功能？
1. 在`src/lib/tools.ts`中定义新工具函数
2. 在`getToolsDefinition()`中添加工具定义
3. 在`executeToolCalls()`中添加工具调用处理
4. 更新`src/lib/agent-service.ts`中的系统提示词

## 许可证

MIT

## 联系与支持

如有问题或建议，请提交GitHub Issue或联系项目维护者。

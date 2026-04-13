import { ArrowRight, CheckCircle, Code, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1">
      {/* 英雄区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Sparkles className="h-4 w-4" />
              AI驱动的智能周报工具
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              告别手动整理
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                AI自动生成周报
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
              连接您的GitHub账户，自动获取本周commit记录，使用DeepSeek AI生成专业周报，一键分享给团队同事。
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 h-12 px-6 text-lg"
              >
                立即开始
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:hover:bg-gray-800 h-12 px-6 text-lg"
              >
                查看演示
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              为什么选择AI周报助手？
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              专为开发者设计的智能周报解决方案，让工作汇报变得简单高效。
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                <Code className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                GitHub无缝集成
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                支持GitHub OAuth安全登录，自动同步您的仓库和commit记录，无需手动导出数据。
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">支持所有GitHub仓库</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">自动时间范围识别</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">commit分类整理</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900">
                <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                AI智能分析
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                基于DeepSeek AI的强大分析能力，自动生成结构化周报，支持多种风格和详细程度。
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">专业/轻松/技术多种风格</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">自动分类和总结</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">智能生成下周计划</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900">
                <Zap className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                一键分享与导出
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                生成可分享链接、导出PDF或Markdown格式，轻松与团队共享工作进展。
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">生成唯一分享链接</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">PDF/Markdown导出</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">社交媒体快速分享</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 使用流程 */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              只需3步，生成专业周报
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              简单直观的操作流程，几分钟内完成周报生成。
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-500 to-purple-500 md:block hidden"></div>

            <div className="space-y-12 md:space-y-0">
              {[
                {
                  step: "01",
                  title: "连接GitHub账户",
                  description: "使用GitHub OAuth安全登录，授权访问您的仓库数据。",
                  icon: <Code className="h-8 w-8" />,
                },
                {
                  step: "02",
                  title: "选择仓库和时间范围",
                  description: "选择要分析的GitHub仓库，设置本周、上周或自定义时间范围。",
                  icon: <Calendar className="h-8 w-8" />,
                },
                {
                  step: "03",
                  title: "生成并分享周报",
                  description: "AI自动分析commit记录生成周报，一键分享给同事或导出PDF。",
                  icon: <Share2 className="h-8 w-8" />,
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`relative flex flex-col items-center md:flex-row ${
                    index % 2 === 0 ? "md:text-right md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="md:w-1/2"></div>
                  <div className="absolute left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg md:relative md:left-0 md:translate-x-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 dark:bg-gray-800">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:mt-0 md:w-1/2">
                    <div className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      步骤 {item.step}
                    </div>
                    <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 px-8 py-16 text-center text-white">
            <h2 className="mb-6 text-3xl font-bold">
              立即开始提高工作效率
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
              每周节省数小时手动整理时间，让AI帮助您生成专业周报。
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-12 px-6 text-lg"
            >
              免费开始使用
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-6 text-sm text-blue-200">
              无需信用卡，永久免费基础版
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// 为使用流程部分添加缺失的图标组件
function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function Share2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

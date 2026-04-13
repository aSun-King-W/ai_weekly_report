import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI周报助手 - 智能GitHub周报生成工具",
  description: "连接GitHub自动获取commit记录，使用AI生成可读的周报页面，支持一键分享给同事。",
  keywords: ["GitHub", "周报", "AI", "开发工具", "进度跟踪", "团队协作"],
  authors: [{ name: "AI周报助手团队" }],
  openGraph: {
    type: "website",
    title: "AI周报助手",
    description: "智能GitHub周报生成工具",
    siteName: "AI周报助手",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© {new Date().getFullYear()} AI周报助手. 保留所有权利.</p>
              <p className="mt-2">
                本项目是开源项目，欢迎在GitHub上贡献代码。
              </p>
              <div className="mt-4 flex justify-center space-x-4">
                <a href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-300">
                  隐私政策
                </a>
                <a href="/terms" className="hover:text-gray-900 dark:hover:text-gray-300">
                  服务条款
                </a>
                <a href="/help" className="hover:text-gray-900 dark:hover:text-gray-300">
                  帮助中心
                </a>
                <a href="https://github.com" className="hover:text-gray-900 dark:hover:text-gray-300">
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}

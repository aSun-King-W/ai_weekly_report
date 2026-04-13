// 页面头部组件 - 客户端组件
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/common/Button';
import { Code, LogIn, LogOut, User } from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Code className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline">AI周报助手</span>
            <span className="inline sm:hidden">周报助手</span>
          </Link>
          <span className="hidden rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200 sm:inline">
            Beta
          </span>
        </div>

        {/* 导航链接 */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
            仪表板
          </Link>
          <Link href="/reports" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
            历史报告
          </Link>
          <Link href="/help" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
            帮助
          </Link>
        </nav>

        {/* 用户操作 */}
        <div className="flex items-center gap-3">
          {status === 'loading' ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
          ) : session?.user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || '用户'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                <div className="hidden flex-col sm:flex">
                  <span className="text-sm font-medium">{session.user.name || session.user.login || '用户'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{session.user.email || 'GitHub用户'}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hidden sm:flex"
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            >
              <LogIn className="mr-2 h-4 w-4" />
              使用GitHub登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
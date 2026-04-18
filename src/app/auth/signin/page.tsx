// 简单的登录页面，重定向到GitHub登录
'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // 直接重定向到GitHub登录
    signIn('github', { callbackUrl: '/dashboard' });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">正在重定向到GitHub登录...</h1>
        <p className="mt-2 text-gray-600">请稍候</p>
      </div>
    </div>
  );
}
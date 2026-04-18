// 登出页面
'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">正在退出登录...</h1>
        <p className="mt-2 text-gray-600">请稍候</p>
      </div>
    </div>
  );
}
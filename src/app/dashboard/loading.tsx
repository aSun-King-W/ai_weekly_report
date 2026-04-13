// 仪表板加载页面

import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          加载仪表板...
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          正在获取您的GitHub数据和设置
        </p>
      </div>
    </div>
  );
}
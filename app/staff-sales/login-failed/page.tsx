'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircleIcon, ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function LoginFailedPage() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push('/staff-sales/login');
  };

  const handleContactSupport = () => {
    // LINE 客服或其他聯絡方式
    window.open('https://line.me/ti/p/your-line-official-account', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* 錯誤圖示 */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <XCircleIcon className="h-8 w-8 text-red-600" />
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          登入失敗
        </h1>

        {/* 說明文字 */}
        <div className="text-gray-600 mb-8 space-y-3">
          <p>
            很抱歉，登入過程中發生錯誤。
          </p>
          <p className="text-sm">
            請確認您的帳號狀態或聯絡客服尋求協助。
          </p>
        </div>

        {/* 可能原因 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <QuestionMarkCircleIcon className="h-4 w-4 mr-1" />
            可能原因：
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 帳號尚未開通</li>
            <li>• 系統維護中</li>
            <li>• 網路連線問題</li>
            <li>• 權限不足</li>
          </ul>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-4">
          {/* 重新登入按鈕 */}
          <button
            onClick={handleBackToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>重新登入</span>
          </button>

          {/* 聯絡客服按鈕 */}
          <button
            onClick={handleContactSupport}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            聯絡客服
          </button>
        </div>

        {/* 說明文字 */}
        <div className="mt-8 text-xs text-gray-500 space-y-2">
          <p>
            如問題持續發生，請聯絡系統管理員
          </p>
          <p>
            或透過客服管道回報問題
          </p>
        </div>
      </div>
    </div>
  );
} 
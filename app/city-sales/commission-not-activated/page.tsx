'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon, ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function CommissionNotActivatedPage() {
  const router = useRouter();

  const handleApplyCommission = () => {
    // 導向到申請分潤計畫表單
    router.push('/city-sales/apply-commission');
  };

  const handleBackToLogin = () => {
    router.push('/city-sales/login');
  };

  const handleContactSupport = () => {
    // LINE 客服或其他聯絡方式
    window.open('https://line.me/ti/p/your-line-official-account', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* 警告圖示 */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
          <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          分潤計畫未開通
        </h1>

        {/* 說明文字 */}
        <div className="text-gray-600 mb-8 space-y-3">
          <p>
            您的帳號尚未開通分潤計畫，無法使用城市銷售系統。
          </p>
          <p className="text-sm">
            請聯絡管理員或申請開通分潤計畫後再進行登入。
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-4">
          {/* 申請分潤計畫按鈕 */}
          <button
            onClick={handleApplyCommission}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span>申請分潤計畫</span>
          </button>

          {/* 聯絡客服按鈕 */}
          <button
            onClick={handleContactSupport}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            聯絡客服
          </button>

          {/* 返回登入按鈕 */}
          <button
            onClick={handleBackToLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>返回登入</span>
          </button>
        </div>

        {/* 說明文字 */}
        <div className="mt-8 text-xs text-gray-500 space-y-2">
          <p>
            如有任何問題，請聯絡系統管理員
          </p>
          <p>
            或透過客服管道進行諮詢
          </p>
        </div>
      </div>
    </div>
  );
} 
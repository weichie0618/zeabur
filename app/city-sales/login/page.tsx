'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesperson } from '../context/SalespersonContext';

export default function LoginPage() {
  const [salespersonId, setSalespersonId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, isAuthenticated } = useSalesperson();
  const router = useRouter();

  // 如果已經登入，重定向到儀表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/city-sales/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salespersonId.trim()) {
      return;
    }

    setIsLoading(true);
    const success = await login(salespersonId.trim());
    
    if (success) {
      router.push('/city-sales/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-md w-full space-y-4 sm:space-y-8">
        {/* 標題區塊 */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg
              className="h-6 w-6 sm:h-8 sm:w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">業務平台</h2>
          <p className="mt-2 text-sm text-gray-600">請輸入您的業務員 ID 登入</p>
        </div>

        {/* 登入表單 */}
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="salespersonId" className="block text-sm font-medium text-gray-700 mb-2">
                  業務員 ID
                </label>
                <input
                  id="salespersonId"
                  name="salespersonId"
                  type="text"
                  required
                  value={salespersonId}
                  onChange={(e) => setSalespersonId(e.target.value)}
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="請輸入您的業務員 ID"
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  範例：000181、000190 等
                </p>
              </div>

              {/* 錯誤訊息 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* 登入按鈕 */}
              <button
                type="submit"
                disabled={isLoading || !salespersonId.trim()}
                className={`w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-colors ${
                  isLoading || !salespersonId.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    驗證中...
                  </div>
                ) : (
                  '登入'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* 說明區塊 */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">如何取得業務員 ID？</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• 業務員 ID 通常為 6 位數字，如：000181</li>
            <li>• 如不知道您的 ID，請聯絡系統管理員</li>
            <li>• 首次登入請確認您已被加入業務員系統</li>
          </ul>
        </div>

        {/* 支援資訊 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            如有問題請聯絡系統管理員
          </p>
        </div>
      </div>
    </div>
  );
} 
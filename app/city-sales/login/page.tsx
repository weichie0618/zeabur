'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesperson } from '../context/SalespersonContext';

// 聲明 LIFF 類型
declare global {
  interface Window {
    liff: any;
  }
}

export default function LoginPage() {
  const [salespersonId, setSalespersonId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiffInitializing, setIsLiffInitializing] = useState(true);
  const [isLiffEnvironment, setIsLiffEnvironment] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const { login, error, isAuthenticated } = useSalesperson();
  const router = useRouter();

  // 如果已經登入，重定向到儀表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/city-sales/dashboard');
    }
  }, [isAuthenticated, router]);

  // 初始化 LIFF
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // 檢查是否在 LIFF 環境中
        if (typeof window !== 'undefined' && window.liff) {
          console.log('LIFF 已可用，開始初始化');
          await window.liff.init({
            liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
          });
          
          console.log('LIFF 初始化成功');
          setIsLiffEnvironment(true);
          
          // 如果用戶已登入 LINE，自動取得資料
          if (window.liff.isLoggedIn()) {
            await handleLiffLogin();
          } else {
            // 如果未登入，要求用戶登入
            window.liff.login();
          }
        } else {
          console.log('非 LIFF 環境，載入 LIFF SDK');
          // 載入 LIFF SDK
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.onload = async () => {
            if (window.liff) {
              await window.liff.init({
                liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
              });
              
              console.log('LIFF 初始化成功');
              setIsLiffEnvironment(true);
              
              if (window.liff.isLoggedIn()) {
                await handleLiffLogin();
              } else {
                window.liff.login();
              }
            }
          };
          script.onerror = () => {
            console.error('LIFF SDK 載入失敗');
            setLiffError('LIFF SDK 載入失敗');
            setIsLiffEnvironment(false);
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('LIFF 初始化失敗:', error);
        setLiffError('LIFF 初始化失敗');
        setIsLiffEnvironment(false);
      } finally {
        setIsLiffInitializing(false);
      }
    };

    initializeLiff();
  }, []);

  // 處理 LIFF 登入
  const handleLiffLogin = async () => {
    try {
      setIsLoading(true);
      
      // 取得 LINE User ID
      const profile = await window.liff.getProfile();
      const lineUserId = profile.userId;
      
      console.log('取得 LINE User ID:', lineUserId);
      
      // 呼叫 API 取得 storeId
      const response = await fetch('https://line.cityburger.com.tw/gsa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: lineUserId
        })
      });

      if (!response.ok) {
        throw new Error('API 請求失敗');
      }

      const data = await response.json();
      console.log('API 回應:', data);

      if (data.isValid && data.storeId) {
        // 使用 storeId 作為 salespersonId 進行登入
        const loginSuccess = await login(data.storeId);
        
        if (loginSuccess) {
          router.push('/city-sales/dashboard');
        } else {
          setLiffError('登入失敗，請聯絡系統管理員');
        }
      } else {
        setLiffError('您的帳號尚未綁定業務員資料，請聯絡系統管理員');
      }
    } catch (error) {
      console.error('LIFF 登入失敗:', error);
      setLiffError('自動登入失敗，請嘗試手動登入');
      setIsLiffEnvironment(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
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

  // 顯示載入中畫面
  if (isLiffInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化 LINE 登入...</p>
        </div>
      </div>
    );
  }

  // 顯示 LIFF 載入中
  if (isLiffEnvironment && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在進行 LINE 登入驗證...</p>
        </div>
      </div>
    );
  }

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
          <p className="mt-2 text-sm text-gray-600">
            {isLiffEnvironment ? 'LINE 自動登入' : '請輸入您的業務員 ID 登入'}
          </p>
        </div>

        {/* LIFF 錯誤訊息 */}
        {liffError && (
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
              <span className="text-red-700 text-sm">{liffError}</span>
            </div>
          </div>
        )}

        {/* 手動登入表單 - 只在非 LIFF 環境或 LIFF 失敗時顯示 */}
        {(!isLiffEnvironment || liffError) && (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleManualSubmit}>
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
        )}

        {/* 說明區塊 */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            {isLiffEnvironment ? '使用 LINE 登入' : '如何取得業務員 ID？'}
          </h3>
          <ul className="text-xs text-blue-800 space-y-1">
            {isLiffEnvironment ? (
              <>
                <li>• 系統會自動透過 LINE 帳號取得您的業務員資料</li>
                <li>• 如果無法自動登入，請使用手動輸入方式</li>
                <li>• 如有問題請聯絡系統管理員</li>
              </>
            ) : (
              <>
                <li>• 業務員 ID 通常為 6 位數字，如：000181</li>
                <li>• 如不知道您的 ID，請聯絡系統管理員</li>
                <li>• 首次登入請確認您已被加入業務員系統</li>
              </>
            )}
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
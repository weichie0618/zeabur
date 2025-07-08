'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesperson } from '../context/SalespersonContext';

// 聲明 LIFF 類型
declare global {
  interface Window {
    liff: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useSalesperson();
  const [isDevMode, setIsDevMode] = React.useState(false);
  const [testStoreId, setTestStoreId] = React.useState('test-store-1');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/city-sales/dashboard');
    }
  }, [isAuthenticated, router]);

  // 開發模式測試登入
  const handleDevLogin = async () => {
    const loginSuccess = await login(testStoreId);
    if (loginSuccess) {
      router.push('/city-sales/dashboard');
    }
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.onload = async () => {
          if (window.liff) {
            try {
              await window.liff.init({
                liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
              });
              
              if (window.liff.isLoggedIn()) {
                const profile = await window.liff.getProfile();
                const lineUserId = profile.userId;
                
                const response = await fetch('https://line.cityburger.com.tw/gsa', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: lineUserId
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.isValid && data.storeId) {
                    const loginSuccess = await login(data.storeId);
                    if (loginSuccess) {
                      router.push('/city-sales/dashboard');
                    }
                  } else {
                    // 找不到對應的店家，導向申請頁面
                    router.push('/city-sales/commission-not-activated');
                  }
                } else {
                  // API 回應錯誤，導向申請頁面
                  router.push('/city-sales/commission-not-activated');
                }
              } else {
                window.liff.login();
              }
            } catch (liffError) {
              console.error('LIFF 登入錯誤:', liffError);
              // LIFF 錯誤時導向申請頁面
              router.push('/city-sales/commission-not-activated');
            }
          }
        };
        script.onerror = () => {
          console.error('無法載入 LIFF SDK');
          router.push('/city-sales/commission-not-activated');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('LIFF 初始化失敗:', error);
        router.push('/city-sales/commission-not-activated');
      }
    };

    initializeLiff();
  }, [router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在進行 LINE 登入...</p>
        
        {/* 開發模式測試按鈕 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-lg max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">開發模式測試</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={testStoreId}
                onChange={(e) => setTestStoreId(e.target.value)}
                placeholder="輸入測試店家 ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={handleDevLogin}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                測試登入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
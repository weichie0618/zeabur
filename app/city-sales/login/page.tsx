'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesperson } from '../context/SalespersonContext';

// 聲明 LIFF 類型
declare global {
  interface Window {
    liff: any;
  }
}

// 錯誤類型定義
enum ErrorType {
  LIFF_INIT_FAILED = 'LIFF_INIT_FAILED',
  LIFF_LOGIN_FAILED = 'LIFF_LOGIN_FAILED',
  AUTH_API_FAILED = 'AUTH_API_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND'
}

interface LoginError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

// 初始化狀態管理
interface InitState {
  liffReady: boolean;
  authChecked: boolean;
  error: LoginError | null;
  retryCount: number;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useSalesperson();

  // 優化狀態管理
  const [initState, setInitState] = useState<InitState>({
    liffReady: false,
    authChecked: false,
    error: null,
    retryCount: 0
  });
  
  // 開發模式狀態
  const [isDevMode] = useState(process.env.NODE_ENV === 'development');
  const [testStoreId, setTestStoreId] = useState('test-store-1');
  const [isLoading, setIsLoading] = useState(true);

  // 預加載資源
  const preloadResources = useCallback(() => {
    // 預加載未開通頁面
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/city-sales/commission-not-activated';
    document.head.appendChild(link);
    
    // 預加載儀表板頁面
    const dashboardLink = document.createElement('link');
    dashboardLink.rel = 'prefetch';
    dashboardLink.href = '/city-sales/dashboard';
    document.head.appendChild(dashboardLink);
  }, []);

  // 重試機制
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ) => {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i === maxRetries - 1) throw error;
        
        // 指數退避
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }, []);

  // 檢查本地認證狀態
  const checkLocalAuth = useCallback(async () => {
    try {
      const savedData = localStorage.getItem('salesperson');
      if (savedData) {
        const data = JSON.parse(savedData);
        // 可以在這裡添加過期時間檢查
        return data;
      }
      return null;
    } catch (error) {
      console.error('檢查本地認證失敗:', error);
      localStorage.removeItem('salesperson');
      return null;
    }
  }, []);

  // LIFF SDK 初始化
  const initializeLiff = useCallback(async () => {
    return new Promise((resolve, reject) => {
      // 檢查 LIFF SDK 是否已載入
      if (window.liff) {
        resolve(window.liff);
        return;
      }

        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      
        script.onload = async () => {
        try {
          if (window.liff) {
            await window.liff.init({
              liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
            });
            resolve(window.liff);
          } else {
            reject(new Error('LIFF SDK 載入失敗'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      script.onerror = () => {
        reject(new Error('無法載入 LIFF SDK'));
      };
      
      document.head.appendChild(script);
    });
  }, []);

  // LINE 登入處理
  const handleLineLogin = useCallback(async () => {
    try {
      if (!window.liff?.isLoggedIn()) {
        window.liff.login();
        return null;
      }

      const profile = await window.liff.getProfile();
      const lineUserId = profile.userId;
      
      // 添加重試機制
      const maxRetries = 3;
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超時
          
          const response = await fetch('https://line.cityburger.com.tw/gsa', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: lineUserId
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API 請求失敗: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.isValid && data.storeId) {
            return data.storeId;
          } else {
            throw {
              type: ErrorType.STORE_NOT_FOUND,
              message: '找不到對應的店家資料',
              retryable: false
            };
          }
        } catch (error: any) {
          lastError = error;
          console.error(`LINE 登入嘗試 ${attempt}/${maxRetries} 失敗:`, error);
          
          // 如果是超時錯誤且還有重試機會，等待後重試
          if (attempt < maxRetries && (error.name === 'TimeoutError' || error.message?.includes('timeout'))) {
            console.log(`網路超時，${2000 * attempt}ms 後重試...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          
          // 最後一次嘗試失敗或非超時錯誤
          break;
        }
      }
      
      // 所有重試都失敗了
      if (lastError.type) {
        throw lastError;
      }
      
      throw {
        type: ErrorType.AUTH_API_FAILED,
        message: lastError?.name === 'TimeoutError' 
          ? '網路連線超時，請檢查網路狀態後重試'
          : '店家驗證失敗',
        retryable: true
      };
    } catch (error: any) {
      if (error.type) {
        throw error;
      }
      throw {
        type: ErrorType.AUTH_API_FAILED,
        message: '店家驗證失敗',
        retryable: true
      };
    }
  }, []);

  // 平行初始化處理
  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 平行執行初始化任務
      const [liffResult, localAuthResult] = await Promise.allSettled([
        retryWithBackoff(() => initializeLiff()),
        checkLocalAuth()
      ]);

      // 處理本地認證結果
      if (localAuthResult.status === 'fulfilled' && localAuthResult.value) {
        // 有本地認證，嘗試直接登入
        const loginSuccess = await login(localAuthResult.value.id);
        if (loginSuccess) {
          router.push('/city-sales/dashboard');
          return;
        }
      }

      // 處理 LIFF 初始化結果
      if (liffResult.status === 'fulfilled') {
        setInitState(prev => ({ ...prev, liffReady: true }));
        
        // 執行 LINE 登入流程
        const storeId = await retryWithBackoff(() => handleLineLogin());
        
        if (storeId) {
          const loginSuccess = await login(storeId);
          if (loginSuccess) {
                  router.push('/city-sales/dashboard');
                }
              }
            } else {
        throw {
          type: ErrorType.LIFF_INIT_FAILED,
          message: 'LIFF 初始化失敗',
          retryable: true
        };
      }
    } catch (error: any) {
      console.error('初始化錯誤:', error);
      
      const loginError: LoginError = error?.type ? error : {
        type: ErrorType.NETWORK_ERROR,
        message: '網路連線錯誤',
        retryable: true
      };
      
      setInitState(prev => ({ 
        ...prev, 
        error: loginError,
        retryCount: prev.retryCount + 1
      }));
      
      // 自動重試或導向錯誤頁面
      if (loginError.retryable && initState.retryCount < 2) {
        setTimeout(() => initializeApp(), 2000);
      } else {
        router.push('/city-sales/commission-not-activated');
          }
    } finally {
      setIsLoading(false);
    }
  }, [login, router, retryWithBackoff, initializeLiff, checkLocalAuth, handleLineLogin, initState.retryCount]);

  // 開發模式測試登入
  const handleDevLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const loginSuccess = await login(testStoreId);
      if (loginSuccess) {
        router.push('/city-sales/dashboard');
      }
      } catch (error) {
      console.error('開發模式登入失敗:', error);
    } finally {
      setIsLoading(false);
    }
  }, [login, testStoreId, router]);

  // 手動重試
  const handleRetry = useCallback(() => {
    setInitState({
      liffReady: false,
      authChecked: false,
      error: null,
      retryCount: 0
    });
    initializeApp();
  }, [initializeApp]);

  // 初始化效果
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/city-sales/dashboard');
      return;
    }

    preloadResources();
    initializeApp();
  }, [isAuthenticated, router, preloadResources, initializeApp]);

  // 記憶化載入狀態
  const loadingContent = useMemo(() => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">
        {initState.liffReady ? 'LINE 登入中...' : '正在載入...'}
      </p>
      {initState.retryCount > 0 && (
        <p className="text-sm text-gray-500 mt-2">
          重試次數: {initState.retryCount}/3
        </p>
      )}
    </div>
  ), [initState.liffReady, initState.retryCount]);

  // 錯誤內容
  const errorContent = useMemo(() => {
    if (!initState.error) return null;
    
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-red-800 font-medium">{initState.error.message}</h3>
          {initState.error.retryable && (
            <button
              onClick={handleRetry}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              重新嘗試
            </button>
          )}
        </div>
      </div>
    );
  }, [initState.error, handleRetry]);

  // 開發模式內容
  const devContent = useMemo(() => {
    if (!isDevMode) return null;
    
    return (
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
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            {isLoading ? '測試中...' : '測試登入'}
          </button>
        </div>
      </div>
    );
  }, [isDevMode, testStoreId, handleDevLogin, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {loadingContent}
        {errorContent}
        {devContent}
      </div>
    </div>
  );
} 
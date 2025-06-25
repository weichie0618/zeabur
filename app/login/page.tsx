'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

// 搜尋參數處理元件
function SearchParamsHandler({ onParamsProcessed }: { 
  onParamsProcessed: (expired: boolean, redirectPath: string | null, reason: string | null) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      // 檢查是否有令牌過期參數
      const expired = searchParams.get('expired') === 'true';
      // 保存重定向路徑
      const redirect = searchParams.get('redirect');
      // 獲取錯誤原因
      const reason = searchParams.get('reason');
      
      // 調用回調函數傳遞參數
      onParamsProcessed(expired, redirect, reason);
      
      // 清除URL參數，避免瀏覽器重新整理時再次觸發
      if ((expired || redirect || reason) && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('expired');
        url.searchParams.delete('redirect');
        url.searchParams.delete('reason');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, onParamsProcessed]);
  
  return null; // 不渲染任何內容
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, clearAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [redirectPath, setRedirectPath] = useState(''); // 存儲重定向路徑
  const isDev = process.env.NODE_ENV === 'development';
  const [isExpired, setIsExpired] = useState(false);

  // 處理搜尋參數回調
  const handleParamsProcessed = useCallback((expired: boolean, redirect: string | null, reason: string | null) => {
    if (expired) {
      setIsExpired(true);
      setError('您的登入已過期，請重新登入');
      addDebugInfo('檢測到登入過期參數，顯示過期提示');
      // 清除舊的身份驗證狀態
      clearAuth();
    }
    
    if (reason) {
      switch(reason) {
        case 'expired':
          setError('您的登入已過期');
          clearAuth();
          setIsExpired(true);
          break;
        case 'invalid':
          setError('身份驗證無效');
          clearAuth();
          setIsExpired(true);
          break;
        case 'not-allowed':
          setError('您沒有足夠的權限訪問該頁面');
          break;
        case 'not-authenticated':
          setError('需要先登入才能訪問該頁面');
          break;
        case 'auth-error':
          setError('身份驗證發生錯誤');
          clearAuth();
          setIsExpired(true);
          break;
        default:
          setError('請先登入');
      }
      addDebugInfo(`檢測到錯誤原因: ${reason}`);
    }
    
    if (redirect) {
      setRedirectPath(redirect);
      addDebugInfo(`儲存重定向路徑: ${redirect}`);
    }
  }, [clearAuth]);

  // 已移除：頁面初次加載時的 token 檢查邏輯，因為它會干擾正常的登入跳轉流程

  // 監聽認證狀態變更，根據角色進行導航
  useEffect(() => {
    // 如果檢測到令牌過期，不要觸發導航邏輯
    if (isExpired) {
      addDebugInfo('令牌已過期，跳過導航邏輯');
      return;
    }
    
    // 僅在開發環境執行 cookie 檢查
    if (isDev) {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) acc[name] = value;
        return acc;
      }, {} as Record<string, string>);
      
      setDebugInfo(prev => `${prev ? prev + '\n\n' : ''}Cookie狀態檢查:\n`+
        `- accessToken: ${cookies.accessToken ? '存在' : '不存在'}\n`+
        `- localStorage token: ${localStorage.getItem('accessToken') ? '存在' : '不存在'}`
      );
      
      if (isAuthenticated && user) {
        addDebugInfo(`認證狀態變更: isAuthenticated=${isAuthenticated}, 用戶=${JSON.stringify(user)}`);
        addDebugInfo(`準備根據角色跳轉...`);
      }
    }
    
    // 處理用戶導航 - 只有在認證成功且不是登入嘗試失敗的情況，且不是令牌過期的情況
    if (isAuthenticated && user && !loginAttempted && !isExpired) {
      navigateBasedOnRole(user);
    }
  }, [isAuthenticated, user, router, isDev, loginAttempted, isExpired, clearAuth]);

  // 統一處理基於角色的導航邏輯
  const navigateBasedOnRole = useCallback((userData: any) => {
    try {
      if (!userData || !userData.role) {
        if (isDev) addDebugInfo('無效的用戶數據或角色');
        return;
      }
      
      // 如果有重定向路徑，優先使用該路徑
      if (redirectPath) {
        if (isDev) addDebugInfo(`使用保存的重定向路徑: ${redirectPath}`);
        router.push(redirectPath);
        return;
      }
      
      // 否則根據角色導航
      if (userData.role === 'admin') {
        if (isDev) addDebugInfo('執行跳轉到管理員頁面: /admin/bakery');
        router.push('/admin/bakery');
      } else if (userData.role === 'salesperson') {
        if (isDev) addDebugInfo('執行跳轉到業務頁面: /sales/dashboard');
        router.push('/sales/dashboard');
      } else {
        if (isDev) addDebugInfo(`未知角色: ${userData.role}，導向首頁`);
        router.push('/');
      }
    } catch (error) {
      if (isDev) {
        addDebugInfo(`導航錯誤: ${error}`);
        console.error('導航錯誤:', error);
      }
    }
  }, [router, isDev, redirectPath]);

  // 統一添加調試信息的函數
  const addDebugInfo = (info: string) => {
    if (isDev) {
      setDebugInfo(prev => prev ? `${prev}\n${info}` : info);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // 清除錯誤提示，提供更好的用戶體驗
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // 清除錯誤提示，提供更好的用戶體驗
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginAttempted(false); // 重置登入嘗試狀態
    addDebugInfo('正在處理登入請求...');

    // 表單驗證
    if (!email) {
      setError('請輸入電子郵件');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('請輸入密碼');
      setLoading(false);
      return;
    }

    try {
      // 使用上下文中的登入函數
      addDebugInfo(`發送登入請求: ${email}`);
      const result = await login(email, password);
      
      if (!result.success) {
        // 登入失敗處理
        setLoginAttempted(true); // 標記為登入嘗試失敗
        addDebugInfo(`登入失敗: ${result.message}`);
        setError(result.message || '登入失敗');
        
        // 設定焦點在密碼欄位，方便用戶重新輸入
        const passwordField = document.getElementById('password') as HTMLInputElement;
        if (passwordField) {
          passwordField.focus();
          passwordField.select();
        }
      } else {
        // 登入成功
        addDebugInfo('登入成功!');
        
        // 當在開發環境時，顯示令牌信息
        if (isDev) {
          const accessToken = localStorage.getItem('accessToken');
          if (accessToken) {
            addDebugInfo(`AccessToken: ${accessToken.substring(0, 15)}...`);
          }
          
          // 顯示用戶數據
          if (result.userData) {
            addDebugInfo(`用戶信息: ${JSON.stringify(result.userData)}`);
            addDebugInfo(`用戶角色: ${result.userData?.role}`);
          }
        }
        
        // 登入成功後，觸發導航 (因為 useEffect 監聽 isAuthenticated 和 user 變化)
        if (result.userData) {
          setLoginAttempted(false); // 重置登入嘗試狀態
          navigateBasedOnRole(result.userData);
        }
      }
    } catch (error: any) {
      console.error('登入錯誤:', error);
      addDebugInfo(`登入錯誤: ${error.message || JSON.stringify(error)}`);
      setError('登入時發生錯誤，請稍後再試');
      setLoginAttempted(true); // 標記為登入嘗試失敗
    } finally {
      setLoading(false);
    }
  };

  // 重設錯誤並允許重新嘗試
  const handleRetry = () => {
    setError('');
    setLoginAttempted(false);
    setPassword('');
    // 設定焦點在密碼欄位
    const passwordField = document.getElementById('password') as HTMLInputElement;
    if (passwordField) {
      passwordField.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* 使用 Suspense 包裹 SearchParamsHandler 組件 */}
      <Suspense fallback={null}>
        <SearchParamsHandler onParamsProcessed={handleParamsProcessed} />
      </Suspense>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">登入您的帳戶</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            請輸入您的帳號和密碼進行登入
          </p>
          {/* 如果有重定向路徑，顯示返回提示 */}
          {redirectPath && (
            <p className="mt-1 text-center text-xs text-amber-600">
              登入後將返回您先前的頁面
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">電子郵件</label>
              <input 
                id="email-address" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                value={email}
                onChange={handleEmailChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm" 
                placeholder="電子郵件地址" 
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">密碼</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                value={password}
                onChange={handlePasswordChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm" 
                placeholder="密碼" 
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              <p>{error}</p>
              {loginAttempted && (
                <button 
                  type="button"
                  onClick={handleRetry}
                  className="mt-1 text-amber-600 hover:text-amber-800 text-xs font-semibold"
                >
                  重新嘗試登入
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" 
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                記住我
              </label>
            </div>

            
          </div>

          <div>
            <button 
              type="submit" 
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              disabled={loading}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-amber-500 group-hover:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              {loading ? '登入中...' : '登入'}
            </button>
          </div>
        </form>

        {/* 除錯資訊區域 - 僅在開發環境顯示 */}
        {isDev && (
          <div className="mt-4 p-3 bg-gray-800 text-white rounded text-xs whitespace-pre-line overflow-auto max-h-48">
            <div className="flex justify-between mb-1">
              <h4 className="text-xs font-semibold text-gray-300">除錯資訊 (開發模式)</h4>
              <button 
                className="text-xs text-gray-400 hover:text-white" 
                onClick={() => setDebugInfo('')}
              >
                清除
              </button>
            </div>
            <p className="font-mono">{debugInfo || '尚無除錯資訊。請嘗試登入以查看流程。'}</p>
          </div>
        )}

        {/* 角色說明
        <div className="mt-8 space-y-4 text-sm text-gray-500">
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">帳號說明</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 text-xs font-bold">S</span>
                  </div>
                </div>
                <p className="ml-2">
                  <strong className="text-gray-700">業務人員帳號：</strong> sales@example.com / password
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">A</span>
                  </div>
                </div>
                <p className="ml-2">
                  <strong className="text-gray-700">管理員帳號：</strong> admin@example.com / password
                </p>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <p>* 如忘記密碼，請聯繫系統管理員重置</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
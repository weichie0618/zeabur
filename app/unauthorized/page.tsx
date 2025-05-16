'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

// 專門處理搜索參數的客戶端組件
function SearchParamsHandler({ setErrorReason }: { setErrorReason: (reason: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      const reason = searchParams.get('reason');
      if (reason) {
        switch(reason) {
          case 'expired':
            setErrorReason('您的登入已過期');
            break;
          case 'invalid':
            setErrorReason('身份驗證無效');
            break;
          case 'not-allowed':
            setErrorReason('您沒有足夠的權限訪問該頁面');
            break;
          case 'not-authenticated':
            setErrorReason('需要先登入才能訪問該頁面');
            break;
          case 'auth-error':
            setErrorReason('身份驗證發生錯誤');
            break;
          default:
            setErrorReason('權限不足');
        }
      }
    }
  }, [searchParams, setErrorReason]);
  
  return null; // 不渲染任何內容
}

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [errorReason, setErrorReason] = useState<string>('權限不足');
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGoBack = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // 根據用戶角色返回適當的頁面
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/bakery');
      } else if (user.role === 'salesperson') {
        router.push('/sales/dashboard');
      } else {
        router.push('/');
      }
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    try {
      await logout();
      // 登出後重定向到登入頁面
      router.push('/login');
    } catch (error) {
      console.error('登出錯誤:', error);
      setIsNavigating(false);
    }
  };

  // 刷新頁面，嘗試重新加載身份驗證狀態
  const handleRetry = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // 清除本地儲存的令牌
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 使用 window.location.reload() 而非路由器導航來強制重新載入頁面
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      {/* 使用 Suspense 包裹處理搜索參數的組件 */}
      <Suspense fallback={null}>
        <SearchParamsHandler setErrorReason={setErrorReason} />
      </Suspense>
      
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-20 w-20 text-red-500 mx-auto"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            存取被拒絕
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorReason}。請確保您具有適當的權限或嘗試重新登入。
          </p>
          
          {isLoading ? (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : null}
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoBack}
            disabled={isNavigating}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {isNavigating ? '導航中...' : '返回我的儀表板'}
          </button>
          
          <button
            onClick={handleRetry}
            disabled={isNavigating}
            className="w-full flex justify-center py-2 px-4 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {isNavigating ? '處理中...' : '重試身份驗證'}
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isNavigating}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {isNavigating ? '登出中...' : '登出'}
          </button>
        </div>
      </div>
    </div>
  );
} 
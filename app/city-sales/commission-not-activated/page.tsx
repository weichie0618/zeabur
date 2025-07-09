'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

// 錯誤類型定義
enum ErrorType {
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  AUTH_FAILED = 'AUTH_FAILED',
  LIFF_ERROR = 'LIFF_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN'
}

interface ErrorInfo {
  type: ErrorType;
  title: string;
  description: string;
  solutions: string[];
  canRetry: boolean;
  icon: 'warning' | 'error' | 'info';
  color: 'orange' | 'red' | 'blue';
}

// 錯誤類型配置
const ERROR_CONFIGS: Record<ErrorType, ErrorInfo> = {
  [ErrorType.STORE_NOT_FOUND]: {
    type: ErrorType.STORE_NOT_FOUND,
    title: '店家資料未找到',
    description: '系統中找不到與您的 LINE 帳號關聯的店家資料',
    solutions: [
      '確認您使用的是正確的 LINE 帳號',
      '聯絡管理員確認店家註冊狀態',
      '申請新的分潤計畫'
    ],
    canRetry: true,
    icon: 'warning',
    color: 'orange'
  },
  [ErrorType.AUTH_FAILED]: {
    type: ErrorType.AUTH_FAILED,
    title: '認證失敗',
    description: '無法驗證您的身份或權限',
    solutions: [
      '確認您的帳號狀態是否正常',
      '檢查分潤計畫是否已啟用',
      '聯絡客服尋求協助'
    ],
    canRetry: true,
    icon: 'error',
    color: 'red'
  },
  [ErrorType.LIFF_ERROR]: {
    type: ErrorType.LIFF_ERROR,
    title: 'LINE 登入問題',
    description: 'LINE 登入功能發生錯誤',
    solutions: [
      '檢查網路連線是否正常',
      '嘗試重新開啟 LINE 應用程式',
      '清除瀏覽器快取後重試'
    ],
    canRetry: true,
    icon: 'warning',
    color: 'orange'
  },
  [ErrorType.NETWORK_ERROR]: {
    type: ErrorType.NETWORK_ERROR,
    title: '網路連線問題',
    description: '無法連接到伺服器',
    solutions: [
      '檢查您的網路連線',
      '稍後再嘗試登入',
      '切換到其他網路環境'
    ],
    canRetry: true,
    icon: 'warning',
    color: 'orange'
  },
  [ErrorType.PERMISSION_DENIED]: {
    type: ErrorType.PERMISSION_DENIED,
    title: '權限不足',
    description: '您沒有存取此系統的權限',
    solutions: [
      '確認您的帳號角色權限',
      '聯絡管理員申請權限',
      '檢查分潤計畫狀態'
    ],
    canRetry: false,
    icon: 'error',
    color: 'red'
  },
  [ErrorType.UNKNOWN]: {
    type: ErrorType.UNKNOWN,
    title: '未知錯誤',
    description: '發生了預期外的錯誤',
    solutions: [
      '嘗試重新登入',
      '檢查系統狀態',
      '聯絡技術支援'
    ],
    canRetry: true,
    icon: 'error',
    color: 'red'
  }
};

// 主要內容組件（使用 useSearchParams）
function CommissionNotActivatedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 狀態管理
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>(ERROR_CONFIGS[ErrorType.STORE_NOT_FOUND]);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 從 URL 參數獲取錯誤類型
  useEffect(() => {
    const errorType = searchParams.get('error') as ErrorType;
    const retryCountParam = searchParams.get('retryCount');
    
    if (errorType && ERROR_CONFIGS[errorType]) {
      setErrorInfo(ERROR_CONFIGS[errorType]);
    }
    
    if (retryCountParam) {
      setRetryCount(parseInt(retryCountParam, 10) || 0);
    }
  }, [searchParams]);

  // 重試機制
  const handleRetry = useCallback(async () => {
    if (!errorInfo.canRetry || isRetrying) return;

    setIsRetrying(true);
    
    try {
      // 增加重試計數
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // 添加延遲以防止過於頻繁的重試
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 導回登入頁面進行重試
      router.push(`/city-sales/login?retry=${newRetryCount}`);
    } catch (error) {
      console.error('重試失敗:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [errorInfo.canRetry, isRetrying, retryCount, router]);

  // 申請分潤計畫
  const handleApplyCommission = useCallback(() => {
    router.push('/city-sales/apply-commission');
  }, [router]);

  // 圖示組件
  const IconComponent = useCallback(() => {
    const iconClass = `h-8 w-8 text-${errorInfo.color}-600`;
    
    switch (errorInfo.icon) {
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      case 'error':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return <ExclamationTriangleIcon className={iconClass} />;
    }
  }, [errorInfo]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${errorInfo.color}-50 to-${errorInfo.color === 'orange' ? 'red' : errorInfo.color}-100 flex items-center justify-center p-4`}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* 錯誤圖示 */}
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-${errorInfo.color}-100 mb-6`}>
          <IconComponent />
        </div>

        {/* 標題和描述 */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {errorInfo.description}
          </p>
          
          {/* 重試次數顯示 */}
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              重試次數: {retryCount} 次
            </p>
          )}
        </div>

        {/* 解決方案 */}
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">解決方案</span>
            <svg 
              className={`h-4 w-4 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <ul className="space-y-2">
                {errorInfo.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          {/* 重試按鈕 */}
          {errorInfo.canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`w-full bg-${errorInfo.color}-600 hover:bg-${errorInfo.color}-700 disabled:bg-${errorInfo.color}-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2`}
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>重試中...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>重新嘗試</span>
                </>
              )}
            </button>
          )}

          {/* 申請分潤計畫按鈕 */}
          <button
            onClick={handleApplyCommission}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-duration-200 flex items-center justify-center space-x-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            <span>申請分潤計畫</span>
          </button>
        </div>

        {/* 說明文字 */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
          <p>如有任何問題，請聯絡系統管理員</p>
          <p>或透過客服管道進行諮詢</p>
          
          {/* 系統狀態 */}
          <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-gray-200">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>系統運行正常</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 載入組件
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    </div>
  );
}

// 主要導出組件
export default function CommissionNotActivatedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CommissionNotActivatedContent />
    </Suspense>
  );
} 
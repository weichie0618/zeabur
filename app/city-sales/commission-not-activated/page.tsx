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
    title: '未開通分潤計畫',
    description: '請申請開通分潤計畫',
    solutions: [
      '請聯絡管理員確認狀態',
      '請申請分潤計畫'
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

  // 申請分潤計畫
  const handleApplyCommission = useCallback(() => {
    window.location.href = '/apply-commission';
  }, []);

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

        {/* 操作按鈕 */}
        <div className="space-y-3">
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
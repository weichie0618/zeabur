'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesperson } from '../context/SalespersonContext';
import { salespersonApi } from '../services/apiService';

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
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND'
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

// 登入流程狀態
enum LoginFlowState {
  INITIALIZING = 'INITIALIZING',
  GETTING_LINE_ID = 'GETTING_LINE_ID',
  CHECKING_EMPLOYEE = 'CHECKING_EMPLOYEE',
  ENTERING_EMPLOYEE_ID = 'ENTERING_EMPLOYEE_ID',
  CREATING_EMPLOYEE = 'CREATING_EMPLOYEE',
  LOGGING_IN = 'LOGGING_IN',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
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
  
  // 登入流程狀態
  const [loginFlowState, setLoginFlowState] = useState<LoginFlowState>(LoginFlowState.INITIALIZING);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 開發模式狀態
  const [isDevMode] = useState(process.env.NODE_ENV === 'development');
  const [testStoreId, setTestStoreId] = useState('test-store-1');
  const [isLoading, setIsLoading] = useState(true);

  // 預加載資源
  const preloadResources = useCallback(() => {
    // 預加載未開通頁面
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/staff-sales/login-failed';
    document.head.appendChild(link);
    
    // 預加載儀表板頁面
    const dashboardLink = document.createElement('link');
    dashboardLink.rel = 'prefetch';
    dashboardLink.href = '/staff-sales/dashboard';
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

  // 獲取 LINE 用戶 ID
  const getLineUserId = useCallback(async () => {
    try {
      if (!window.liff?.isLoggedIn()) {
        window.liff.login();
        return null;
      }

      const profile = await window.liff.getProfile();
      return profile.userId;
    } catch (error) {
      console.error('獲取 LINE 用戶 ID 失敗:', error);
      throw {
        type: ErrorType.LIFF_LOGIN_FAILED,
        message: '無法獲取 LINE 用戶資訊',
        retryable: true
      };
    }
  }, []);

  // 根據 LINE ID 查找員工
  const findEmployeeByLineId = useCallback(async (lineId: string) => {
    try {
      const response = await salespersonApi.findEmployeeByLineId(lineId);
      
      if (response.success && response.data) {
        return response.data.customer_id;
      } else {
        throw new Error(response.message || '查找員工失敗');
      }
    } catch (error) {
      console.error('查找員工失敗:', error);
      throw error;
    }
  }, []);

  // 創建員工記錄
  const createEmployeeRecord = useCallback(async (lineId: string, employeeId: string) => {
    try {
      const response = await salespersonApi.createEmployeeRecord(lineId, employeeId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || '創建員工記錄失敗');
      }
    } catch (error) {
      console.error('創建員工記錄失敗:', error);
      throw error;
    }
  }, []);

  // 處理員工編號提交
  const handleEmployeeIdSubmit = useCallback(async () => {
    if (!employeeId.trim() || !lineUserId) {
      return;
    }

    setIsSubmitting(true);
    setLoginFlowState(LoginFlowState.CREATING_EMPLOYEE);

    try {
      // 創建員工記錄
      await createEmployeeRecord(lineUserId, employeeId.trim());
      
      // 創建成功後，使用員工編號登入
      setLoginFlowState(LoginFlowState.LOGGING_IN);
      const loginSuccess = await login(employeeId.trim());
      
      if (loginSuccess) {
        setLoginFlowState(LoginFlowState.COMPLETED);
        router.push('/staff-sales/dashboard');
      } else {
        throw new Error('登入失敗');
      }
    } catch (error: any) {
      console.error('創建員工記錄或登入失敗:', error);
      setLoginFlowState(LoginFlowState.ERROR);
      setInitState(prev => ({ 
        ...prev, 
        error: {
          type: ErrorType.AUTH_API_FAILED,
          message: error.message || '創建員工記錄失敗',
          retryable: true
        }
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [employeeId, lineUserId, createEmployeeRecord, login, router]);

  // 主要登入流程
  const handleLoginFlow = useCallback(async () => {
    try {
      setLoginFlowState(LoginFlowState.GETTING_LINE_ID);
      
      // 1. 獲取 LINE 用戶 ID
      const userId = await getLineUserId();
      if (!userId) {
        // 用戶需要登入，等待 LIFF 重定向
        return;
      }
      
      setLineUserId(userId);
      setLoginFlowState(LoginFlowState.CHECKING_EMPLOYEE);
      
      // 2. 根據 LINE ID 查找員工
      const customerId = await findEmployeeByLineId(userId);
      
      if (customerId === 'none') {
        // 沒有找到員工記錄，顯示輸入框
        setLoginFlowState(LoginFlowState.ENTERING_EMPLOYEE_ID);
        return;
      }
      
      // 3. 找到員工記錄，直接登入
      setLoginFlowState(LoginFlowState.LOGGING_IN);
      const loginSuccess = await login(customerId);
      
      if (loginSuccess) {
        setLoginFlowState(LoginFlowState.COMPLETED);
        router.push('/staff-sales/dashboard');
      } else {
        throw new Error('登入失敗');
      }
      
    } catch (error: any) {
      console.error('登入流程失敗:', error);
      setLoginFlowState(LoginFlowState.ERROR);
      
      const loginError: LoginError = error?.type ? error : {
        type: ErrorType.AUTH_API_FAILED,
        message: error.message || '登入過程中發生錯誤',
        retryable: true
      };
      
      setInitState(prev => ({ 
        ...prev, 
        error: loginError,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [getLineUserId, findEmployeeByLineId, login, router]);

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
          router.push('/staff-sales/dashboard');
          return;
        }
      }

      // 處理 LIFF 初始化結果
      if (liffResult.status === 'fulfilled') {
        setInitState(prev => ({ ...prev, liffReady: true }));
        
        // 開始登入流程
        await handleLoginFlow();
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
        router.push('/staff-sales/login-failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [login, router, retryWithBackoff, initializeLiff, checkLocalAuth, handleLoginFlow, initState.retryCount]);

  // 開發模式測試登入
  const handleDevLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const loginSuccess = await login(testStoreId);
      if (loginSuccess) {
        router.push('/staff-sales/dashboard');
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
    setLoginFlowState(LoginFlowState.INITIALIZING);
    setLineUserId(null);
    setEmployeeId('');
    initializeApp();
  }, [initializeApp]);

  // 初始化效果
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/staff-sales/dashboard');
      return;
    }

    preloadResources();
    initializeApp();
  }, [isAuthenticated, router, preloadResources, initializeApp]);

  // 記憶化載入狀態
  const loadingContent = useMemo(() => {
    const getLoadingText = () => {
      switch (loginFlowState) {
        case LoginFlowState.INITIALIZING:
          return '正在初始化...';
        case LoginFlowState.GETTING_LINE_ID:
          return '正在獲取 LINE 用戶資訊...';
        case LoginFlowState.CHECKING_EMPLOYEE:
          return '正在驗證員工身份...';
        case LoginFlowState.CREATING_EMPLOYEE:
          return '正在創建員工記錄...';
        case LoginFlowState.LOGGING_IN:
          return '正在登入...';
        default:
          return '正在載入...';
      }
    };

    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{getLoadingText()}</p>
        {initState.retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            重試次數: {initState.retryCount}/3
          </p>
        )}
      </div>
    );
  }, [loginFlowState, initState.retryCount]);

  // 員工編號輸入框
  const employeeIdInput = useMemo(() => {
    if (loginFlowState !== LoginFlowState.ENTERING_EMPLOYEE_ID) return null;

    return (
      <div className="mt-6 p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">請輸入員工編號</h3>
        <p className="text-sm text-gray-600 mb-4">
          系統中未找到您的 LINE 帳號對應的員工記錄，請輸入您的員工編號進行綁定。
        </p>
        
        <div className="space-y-4">
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="請輸入員工編號"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          
          <button
            onClick={handleEmployeeIdSubmit}
            disabled={!employeeId.trim() || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? '處理中...' : '確認綁定'}
          </button>
        </div>
      </div>
    );
  }, [loginFlowState, employeeId, isSubmitting, handleEmployeeIdSubmit]);

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
        {employeeIdInput}
        {errorContent}
        {devContent}
      </div>
    </div>
  );
} 
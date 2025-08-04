'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { salespersonApi } from '../services/apiService';

// 聲明 LIFF 類型
declare global {
  interface Window {
    liff: any;
  }
}

// 定義分潤專案介面
interface CommissionPlan {
  id: number;
  name: string;
  description?: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate?: number;
  tiered_rules?: Array<{
    min_amount: number;
    max_amount: number | null;
    rate: number;
  }>;
  status: 'active' | 'inactive';
}

// 定義業務員資料介面
interface SalespersonData {
  id: string;
  name: string;
  email: string;
  companyName: string;
  commission_plan_id?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  commissionPlan?: CommissionPlan;
}

// 認證狀態類型
type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated' | 'error';

// 狀態介面
interface AuthState {
  salesperson: SalespersonData | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
  lastValidated: number | null;
  retryCount: number;
}

// Action 類型
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STATUS'; payload: AuthStatus }
  | { type: 'SET_SALESPERSON'; payload: SalespersonData | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' }
  | { type: 'SET_LAST_VALIDATED'; payload: number }
  | { type: 'RESET_AUTH' };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_SALESPERSON':
      return { 
        ...state, 
        salesperson: action.payload,
        status: action.payload ? 'authenticated' : 'unauthenticated',
        error: null,
        retryCount: 0
      };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload,
        status: 'error',
        loading: false
      };
    case 'INCREMENT_RETRY':
      return { ...state, retryCount: state.retryCount + 1 };
    case 'RESET_RETRY':
      return { ...state, retryCount: 0 };
    case 'SET_LAST_VALIDATED':
      return { ...state, lastValidated: action.payload };
    case 'RESET_AUTH':
      return {
        salesperson: null,
        status: 'idle',
        loading: false,
        error: null,
        lastValidated: null,
        retryCount: 0
      };
    default:
      return state;
  }
}

// 定義 Context 介面
interface SalespersonContextType {
  salesperson: SalespersonData | null;
  storeId: string | null;
  loading: boolean;
  error: string | null;
  status: AuthStatus;
  login: (salespersonId: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  // LIFF 相關功能
  isLiffReady: boolean;
  liffError: string | null;
  getLiffProfile: () => Promise<any | null>;
  isInLiffEnvironment: () => boolean;
}

// 常數
const CACHE_KEY = 'salesperson_auth';
const CACHE_DURATION = 30 * 60 * 1000; // 30分鐘
const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5分鐘檢查一次

// 創建 Context
const SalespersonContext = createContext<SalespersonContextType | undefined>(undefined);

// 業務員認證 Provider
export function SalespersonProvider({ children }: { children: ReactNode }) {
  const [authState, dispatch] = useReducer(authReducer, {
    salesperson: null,
    status: 'idle',
    loading: true,
    error: null,
    lastValidated: null,
    retryCount: 0
  });

  const [isLiffReady, setIsLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const router = useRouter();

  // 快取管理
  const getCachedAuth = useCallback(() => {
      try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('讀取認證快取失敗:', error);
    }
    return null;
  }, []);

  const setCachedAuth = useCallback((data: SalespersonData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      } catch (error) {
      console.error('儲存認證快取失敗:', error);
    }
  }, []);

  const clearCachedAuth = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('清除認證快取失敗:', error);
    }
  }, []);

  // 驗證認證有效性
  const validateAuth = useCallback(async (salespersonId: string): Promise<boolean> => {
    try {
      const response = await salespersonApi.getDashboard(salespersonId);
      return !!(response.success && response.data?.salesperson);
    } catch (error) {
      console.error('驗證認證失敗:', error);
      return false;
    }
  }, []);

  // 刷新認證狀態
  const refreshAuth = useCallback(async (): Promise<void> => {
    const currentSalespersonId = authState.salesperson?.id;
    if (!currentSalespersonId) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const isValid = await validateAuth(currentSalespersonId);
      
      if (isValid) {
        dispatch({ type: 'SET_LAST_VALIDATED', payload: Date.now() });
        dispatch({ type: 'RESET_RETRY' });
      } else {
        // 認證失效，清除狀態，但不強制重定向
        dispatch({ type: 'RESET_AUTH' });
        clearCachedAuth();
        console.log('認證已失效，請重新登入');
      }
    } catch (error) {
      console.error('刷新認證失敗:', error);
      dispatch({ type: 'SET_ERROR', payload: '認證驗證失敗' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [validateAuth, clearCachedAuth]);

  // 檢查認證狀態
  const checkAuthStatus = useCallback(async () => {
    // 如果在登入頁面，跳過認證檢查
    if (typeof window !== 'undefined' && window.location.pathname === '/city-sales/login') {
      dispatch({ type: 'SET_STATUS', payload: 'unauthenticated' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_STATUS', payload: 'checking' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // 首先檢查快取
      const cachedData = getCachedAuth();
      if (cachedData) {
        // 驗證快取的認證是否仍然有效
        const isValid = await validateAuth(cachedData.id);
        if (isValid) {
          dispatch({ type: 'SET_SALESPERSON', payload: cachedData });
          dispatch({ type: 'SET_LAST_VALIDATED', payload: Date.now() });
          return;
        } else {
          // 快取失效，清除
          clearCachedAuth();
        }
      }

      // 沒有有效的快取，設為未認證
      dispatch({ type: 'SET_STATUS', payload: 'unauthenticated' });
    } catch (error) {
      console.error('檢查認證狀態失敗:', error);
      dispatch({ type: 'SET_ERROR', payload: '檢查認證狀態失敗' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [getCachedAuth, validateAuth, clearCachedAuth]);

  // 登入函數
  const login = useCallback(async (salespersonId: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_STATUS', payload: 'checking' });

    try {
      // 添加重試機制
      const maxRetries = 3;
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // 調用後端 API 驗證業務員
          const response = await salespersonApi.getDashboard(salespersonId);

          if (response.success && response.data?.salesperson) {
            const salespersonData = response.data.salesperson;
            
            // 儲存認證資料
            dispatch({ type: 'SET_SALESPERSON', payload: salespersonData });
            dispatch({ type: 'SET_LAST_VALIDATED', payload: Date.now() });
            setCachedAuth(salespersonData);
            
            return true;
          } else {
            // API 回應但驗證失敗
            const errorMessage = response.error || '業務員認證失敗';
            console.error('登入驗證失敗:', errorMessage);
            
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            router.push('/staff-sales/login-failed');
            return false;
          }
        } catch (error: any) {
          lastError = error;
          console.error(`登入嘗試 ${attempt}/${maxRetries} 失敗:`, error);
          
          // 如果是超時錯誤且還有重試機會，等待後重試
          if (attempt < maxRetries && (error.code === 'ECONNABORTED' || error.message?.includes('timeout'))) {
            console.log(`網路超時，${2000 * attempt}ms 後重試...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
          
          // 最後一次嘗試失敗或非超時錯誤
          break;
        }
      }
      
      // 所有重試都失敗了
      const errorMessage = lastError?.code === 'ECONNABORTED' 
        ? '網路連線超時，請檢查網路狀態後重試'
        : lastError?.message || '登入過程中發生錯誤';
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'INCREMENT_RETRY' });
      
      // 統一導向登入失敗頁面
      router.push('/staff-sales/login-failed');
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setCachedAuth, router]);

  // 登出函數
  const logout = useCallback(() => {
    dispatch({ type: 'RESET_AUTH' });
    clearCachedAuth();
    router.push('/staff-sales/login');
  }, [clearCachedAuth, router]);

  // LIFF 相關功能
  const getLiffProfile = useCallback(async (): Promise<any | null> => {
    try {
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        return profile;
      }
      return null;
    } catch (error) {
      console.error('獲取 LIFF Profile 失敗:', error);
      setLiffError('無法獲取 LINE 用戶資訊');
      return null;
    }
  }, []);

  const isInLiffEnvironment = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window.liff);
  }, []);

  // 初始化效果
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 定期驗證認證
  useEffect(() => {
    if (authState.status !== 'authenticated' || !authState.salesperson) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const lastValidated = authState.lastValidated || 0;
      
      if (now - lastValidated > VALIDATION_INTERVAL) {
        refreshAuth();
      }
    }, VALIDATION_INTERVAL);

    return () => clearInterval(interval);
  }, [authState.status, authState.salesperson, authState.lastValidated, refreshAuth]);

  // 檢查 URL 參數中的 storeId（從 LIFF URL 傳遞）
  useEffect(() => {
    const checkUrlParams = () => {
      if (typeof window === 'undefined') return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const storeIdFromUrl = urlParams.get('storeId');
      const currentPath = window.location.pathname;
      
      // 只在登入頁面且有 storeId 參數時才嘗試自動登入
      if (storeIdFromUrl && 
          (currentPath === '/staff-sales/login' || currentPath === '/city-sales/login') && 
          authState.status === 'unauthenticated') {
        console.log('從 URL 參數取得 storeId:', storeIdFromUrl);
        login(storeIdFromUrl);
      }
    };

    // 只在非檢查狀態時執行
    if (authState.status !== 'checking') {
      checkUrlParams();
    }
  }, [authState.status, login]);

  // Context 值
  const contextValue: SalespersonContextType = {
    salesperson: authState.salesperson,
    storeId: authState.salesperson?.id || null,
    loading: authState.loading,
    error: authState.error,
    status: authState.status,
    login,
    logout,
    isAuthenticated: authState.status === 'authenticated',
    refreshAuth,
    // LIFF 相關
    isLiffReady,
    liffError,
    getLiffProfile,
    isInLiffEnvironment,
  };

  return (
    <SalespersonContext.Provider value={contextValue}>
      {children}
    </SalespersonContext.Provider>
  );
}

// 使用 Context 的 Hook
export function useSalesperson() {
  const context = useContext(SalespersonContext);
  if (context === undefined) {
    throw new Error('useSalesperson 必須在 SalespersonProvider 內部使用');
  }
  return context;
} 
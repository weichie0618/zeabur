'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

// 定義 Context 介面
interface SalespersonContextType {
  salesperson: SalespersonData | null;
  storeId: string | null;
  loading: boolean;
  error: string | null;
  login: (salespersonId: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  // LIFF 相關功能
  isLiffReady: boolean;
  liffError: string | null;
  getLiffProfile: () => Promise<any | null>;
  isInLiffEnvironment: () => boolean;
}

// 創建 Context
const SalespersonContext = createContext<SalespersonContextType | undefined>(undefined);

// 業務員認證 Provider
export function SalespersonProvider({ children }: { children: ReactNode }) {
  const [salesperson, setSalesperson] = useState<SalespersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const router = useRouter();

  // 檢查是否已登入
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const savedData = localStorage.getItem('salesperson');
        if (savedData) {
          const data = JSON.parse(savedData);
          // 驗證儲存的認證是否仍然有效
          const response = await salespersonApi.getDashboard(data.id);
          if (response.success && response.data) {
            setSalesperson(response.data.salesperson);
          } else {
            // 認證已失效，清除儲存的數據
            localStorage.removeItem('salesperson');
          }
        }
      } catch (error) {
        console.error('檢查認證狀態失敗:', error);
        localStorage.removeItem('salesperson');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 登入函數
  const login = async (salespersonId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 調用後端 API 驗證業務員
      const response = await salespersonApi.getDashboard(salespersonId);

      if (response.success && response.data) {
        const salespersonData = response.data.salesperson;
        
        // 儲存認證資料
        setSalesperson(salespersonData);
        localStorage.setItem('salesperson', JSON.stringify(salespersonData));
        return true;
      } else {
        // 驗證失敗，統一導向未開通分潤計畫頁面
        const errorMessage = response.error || '業務員認證失敗';
        console.error('登入失敗:', errorMessage);
        
        // 所有登入失敗都導向分潤計畫未開通頁面
        router.push('/city-sales/commission-not-activated');
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('登入失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '登入過程中發生錯誤';
      setError(errorMessage);
      
      // 統一導向分潤計畫未開通頁面
      router.push('/city-sales/commission-not-activated');
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函數
  const logout = () => {
    setSalesperson(null);
    localStorage.removeItem('salesperson');
    router.push('/city-sales/login');
  };

  // LIFF 相關功能
  const getLiffProfile = async (): Promise<any | null> => {
    try {
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        return profile;
      }
      return null;
    } catch (error) {
      console.error('獲取 LIFF Profile 失敗:', error);
      return null;
    }
  };

  const isInLiffEnvironment = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window.liff);
  };

  // 檢查 URL 參數中的 storeId（從 LIFF URL 傳遞）
  useEffect(() => {
    const checkUrlParams = () => {
      if (typeof window === 'undefined') return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const storeIdFromUrl = urlParams.get('storeId');
      
      // 如果 URL 中有 storeId 且用戶還未登入，嘗試自動登入
      if (storeIdFromUrl && !salesperson) {
        console.log('從 URL 參數取得 storeId:', storeIdFromUrl);
        login(storeIdFromUrl);
      }
    };

    checkUrlParams();
  }, [salesperson]);

  const contextValue: SalespersonContextType = {
    salesperson,
    storeId: salesperson?.id || null,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!salesperson,
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
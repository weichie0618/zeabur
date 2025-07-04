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

// 佣金計畫介面
export interface CommissionPlan {
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
  effective_date?: string;
  expiry_date?: string;
}

// 業務員資料介面
export interface SalespersonData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  location: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  commission_plan_id: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  created_at: string;
  updated_at: string;
  commissionPlan: CommissionPlan | null;
}

// Context 類型定義
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

// Provider 組件
export function SalespersonProvider({ children }: { children: ReactNode }) {
  const [salesperson, setSalesperson] = useState<SalespersonData | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);

  // 檢查認證狀態
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const savedStoreId = localStorage.getItem('storeId');
        if (savedStoreId) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salesperson/profile`, {
            headers: {
              'X-Salesperson-ID': savedStoreId
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setSalesperson(data.data);
              setStoreId(savedStoreId);
            } else {
              throw new Error('無效的業務員資料');
            }
          } else {
            throw new Error('驗證失敗');
          }
        }
      } catch (err) {
        console.error('認證檢查失敗:', err);
        setError(err instanceof Error ? err.message : '認證檢查失敗');
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 登入函數
  const login = async (salespersonId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salesperson/profile`, {
        headers: {
          'X-Salesperson-ID': salespersonId
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSalesperson(data.data);
          setStoreId(salespersonId);
          localStorage.setItem('storeId', salespersonId);
          return true;
        }
      }
      throw new Error('登入失敗');
    } catch (err) {
      console.error('登入失敗:', err);
      setError(err instanceof Error ? err.message : '登入失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函數
  const logout = () => {
    setSalesperson(null);
    setStoreId(null);
    localStorage.removeItem('storeId');
    if (window.liff?.isLoggedIn()) {
      window.liff.logout();
    }
  };

  // 獲取 LIFF Profile
  const getLiffProfile = async (): Promise<any | null> => {
    try {
      if (!window.liff?.isLoggedIn()) {
        return null;
      }
      return await window.liff.getProfile();
    } catch (error) {
      console.error('獲取 LIFF Profile 失敗:', error);
      return null;
    }
  };

  // 檢查是否在 LIFF 環境
  const isInLiffEnvironment = (): boolean => {
    return window.liff?.isInClient() || false;
  };

  // 檢查 URL 參數
  useEffect(() => {
    const checkUrlParams = () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      if (error) {
        setError(decodeURIComponent(error));
      }
    };

    checkUrlParams();
  }, []);

  // 初始化 LIFF
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        if (typeof window === 'undefined') return;

        if (!window.liff) {
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.onload = async () => {
            try {
              await window.liff.init({
                liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
              });
              setIsLiffReady(true);
            } catch (error) {
              console.error('LIFF 初始化失敗:', error);
              setLiffError('LIFF 初始化失敗');
            }
          };
          document.head.appendChild(script);
        } else {
          setIsLiffReady(true);
        }
      } catch (error) {
        console.error('LIFF 設置失敗:', error);
        setLiffError('LIFF 設置失敗');
      }
    };

    initializeLiff();
  }, []);

  const value = {
    salesperson,
    storeId,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!storeId,
    isLiffReady,
    liffError,
    getLiffProfile,
    isInLiffEnvironment
  };

  return (
    <SalespersonContext.Provider value={value}>
      {children}
    </SalespersonContext.Provider>
  );
}

// Hook
export function useSalesperson() {
  const context = useContext(SalespersonContext);
  if (context === undefined) {
    throw new Error('useSalesperson must be used within a SalespersonProvider');
  }
  return context;
} 
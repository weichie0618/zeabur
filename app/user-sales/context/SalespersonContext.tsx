'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { salespersonApi } from '../services/apiService';

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
  phone?: string;
  companyName: string;
  commission_plan_id?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  commissionPlan?: CommissionPlan;
}

// 定義登入表單資料介面
interface LoginCredentials {
  email: string;
  phone: string;
}

// 定義 Context 介面
interface SalespersonContextType {
  salesperson: SalespersonData | null;
  storeId: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

// 創建 Context
const SalespersonContext = createContext<SalespersonContextType | undefined>(undefined);

// 業務員認證 Provider
export function SalespersonProvider({ children }: { children: ReactNode }) {
  const [salesperson, setSalesperson] = useState<SalespersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // 登入函數 - 基於 email/phone
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { email, phone } = credentials;

      // 驗證必要欄位
      if (!email || !phone) {
        throw new Error('請填寫電子郵件和電話號碼');
      }

      // 調用後端 API 進行業務員認證
      const response = await salespersonApi.login(email, phone);

      if (response.success && response.data) {
        const salespersonData = response.data;
        
        // 儲存認證資料
        setSalesperson(salespersonData);
        localStorage.setItem('salesperson', JSON.stringify(salespersonData));
        return true;
      } else {
        const errorMessage = response.error || '登入認證失敗';
        console.error('登入失敗:', errorMessage);
        setError(errorMessage);
        
        // 認證失敗，導向錯誤頁面
        router.push('/user-sales/login-failed');
        return false;
      }
    } catch (error) {
      console.error('登入失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '登入過程中發生錯誤';
      setError(errorMessage);
      
      // 登入失敗，導向錯誤頁面
      router.push('/user-sales/login-failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函數
  const logout = () => {
    setSalesperson(null);
    localStorage.removeItem('salesperson');
    router.push('/user-sales/login');
  };

  const contextValue: SalespersonContextType = {
    salesperson,
    storeId: salesperson?.id || null,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!salesperson,
  };

  return (
    <SalespersonContext.Provider value={contextValue}>
      {children}
    </SalespersonContext.Provider>
  );
}

// Hook 使用 Context
export function useSalesperson() {
  const context = useContext(SalespersonContext);
  if (context === undefined) {
    throw new Error('useSalesperson 必須在 SalespersonProvider 內使用');
  }
  return context;
} 
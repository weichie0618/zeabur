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
        throw new Error(response.error || '業務員認證失敗');
      }
    } catch (error) {
      console.error('登入失敗:', error);
      setError(error instanceof Error ? error.message : '登入過程中發生錯誤');
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

// 使用 Context 的 Hook
export function useSalesperson() {
  const context = useContext(SalespersonContext);
  if (context === undefined) {
    throw new Error('useSalesperson 必須在 SalespersonProvider 內部使用');
  }
  return context;
} 
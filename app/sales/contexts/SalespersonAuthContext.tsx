'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiff } from '@/lib/LiffProvider';
import { salespersonApi, ApiError } from '../services/api';

interface SalespersonInfo {
  storeId: string;
  storeValue: string;
  userId: string;
}

interface SalespersonAuthContextType {
  // 認證狀態
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 業務員資訊
  salespersonInfo: SalespersonInfo | null;
  lineProfile: any;

  // LIFF 狀態
  isLiffReady: boolean;
  isInLineApp: boolean;

  // 方法
  authenticate: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const SalespersonAuthContext = createContext<SalespersonAuthContextType | undefined>(undefined);

export const useSalespersonAuth = () => {
  const context = useContext(SalespersonAuthContext);
  if (context === undefined) {
    throw new Error('useSalespersonAuth 必須在 SalespersonAuthProvider 內使用');
  }
  return context;
};

interface SalespersonAuthProviderProps {
  children: ReactNode;
}

export const SalespersonAuthProvider: React.FC<SalespersonAuthProviderProps> = ({ children }) => {
  const { liff, isLoggedIn, profile, isLoading: liffLoading } = useLiff();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salespersonInfo, setSalespersonInfo] = useState<SalespersonInfo | null>(null);

  // 檢查是否在 LINE 應用中
  const isInLineApp = liff?.isInClient() || false;
  const isLiffReady = !liffLoading && !!liff;

  // 初始化時檢查已儲存的認證
  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedInfo = salespersonApi.getStoredStoreId();
        if (storedInfo) {
          const stored = localStorage.getItem('salespersonInfo');
          if (stored) {
            const info = JSON.parse(stored);
            setSalespersonInfo(info);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('檢查儲存的認證失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!liffLoading) {
      checkStoredAuth();
    }
  }, [liffLoading]);

  // 自動認證 - 當 LIFF 準備好且用戶已登入時
  useEffect(() => {
    const autoAuthenticate = async () => {
      if (isLiffReady && isLoggedIn && profile && !isAuthenticated && !isLoading) {
        try {
          await authenticate();
        } catch (error) {
          console.error('自動認證失敗:', error);
        }
      }
    };

    autoAuthenticate();
  }, [isLiffReady, isLoggedIn, profile, isAuthenticated, isLoading]);

  const authenticate = async (): Promise<void> => {
    if (!isLiffReady) {
      throw new Error('LIFF 未準備好');
    }

    if (!isLoggedIn || !profile) {
      throw new Error('用戶未登入 LINE');
    }

    setIsLoading(true);
    setError(null);

    try {
      // 使用 LINE 用戶 ID 進行 GSA 驗證
      const storeId = await salespersonApi.authenticateWithGSA(profile.userId);
      
      // 設置業務員資訊
      const info: SalespersonInfo = {
        storeId,
        storeValue: JSON.parse(localStorage.getItem('salespersonInfo') || '{}').storeValue,
        userId: profile.userId
      };
      
      setSalespersonInfo(info);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('業務員認證失敗:', error);
      
      let errorMessage = '認證失敗';
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            errorMessage = '您不是有效的業務員用戶';
            break;
          case 403:
            errorMessage = '您沒有業務員權限';
            break;
          case 500:
            errorMessage = '伺服器錯誤，請稍後再試';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    salespersonApi.clearAuth();
    setSalespersonInfo(null);
    setIsAuthenticated(false);
    setError(null);
    
    // 如果在 LINE 應用中，可以選擇關閉 LIFF 窗口
    if (liff && liff.isInClient()) {
      try {
        liff.closeWindow();
      } catch (error) {
        console.error('關閉 LIFF 窗口失敗:', error);
      }
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: SalespersonAuthContextType = {
    isAuthenticated,
    isLoading: isLoading || liffLoading,
    error,
    salespersonInfo,
    lineProfile: profile,
    isLiffReady,
    isInLineApp,
    authenticate,
    logout,
    clearError
  };

  return (
    <SalespersonAuthContext.Provider value={contextValue}>
      {children}
    </SalespersonAuthContext.Provider>
  );
}; 
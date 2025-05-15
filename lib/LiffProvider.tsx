'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeLiff, getLiffUserProfile } from './liff';

// 客戶資料介面定義
interface CustomerData {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// LIFF Context 類型定義
interface LiffContextType {
  liff: any;
  profile: any;
  isLoggedIn: boolean;
  isInClient: boolean;
  isLoading: boolean;
  error: Error | null;
  customerData: CustomerData | null;
  updateCustomerData: (data: Partial<CustomerData>) => void;
}

// 創建 Context
const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  isLoggedIn: false,
  isInClient: false,
  isLoading: true,
  error: null,
  customerData: null,
  updateCustomerData: () => {}
});

// 提供一個hook來使用LIFF Context
export const useLiff = () => useContext(LiffContext);

interface LiffProviderProps {
  children: ReactNode;
  liffId?: string;
}

// LIFF Provider 組件
export function LiffProvider({ children, liffId }: LiffProviderProps) {
  const [liff, setLiff] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isInClient, setIsInClient] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  // 嘗試從 localStorage 中載入數據
  const tryLoadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('customerData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('LiffProvider: 從 localStorage 載入客戶資料', parsedData);
        setCustomerData(parsedData);
      }
    } catch (e) {
      console.error('LiffProvider: 解析 localStorage 客戶資料失敗', e);
    }
  };

  // 從 API 獲取客戶資料
  const fetchCustomerData = async (lineId: string) => {
    try {
      console.log('LiffProvider: 開始從 API 請求客戶資料', lineId);
      const response = await fetch('/api/customer/line/customer/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineId }),
      });

      if (!response.ok) {
        throw new Error('獲取客戶資料失敗');
      }

      const data = await response.json();
      console.log('LiffProvider: API 返回的客戶資料', data);
      
      if (data.data) {
        setCustomerData(data.data);
        
        // 將客戶資料儲存到 localStorage 以便後續使用
        localStorage.setItem('customerData', JSON.stringify(data.data));
        
        console.log('LiffProvider: 客戶資料獲取成功並已保存到 localStorage', data.data);
      } else {
        // 如果 API 沒有返回數據，嘗試從 localStorage 中獲取
        console.log('LiffProvider: API 沒有返回數據，嘗試從 localStorage 載入');
        tryLoadFromLocalStorage();
      }
    } catch (err) {
      console.error('LiffProvider: 獲取客戶資料失敗', err);
      // 嘗試從 localStorage 中獲取
      tryLoadFromLocalStorage();
    }
  };

  // 初始化時先嘗試從 localStorage 加載客戶數據
  useEffect(() => {
    tryLoadFromLocalStorage();
  }, []);

  useEffect(() => {
    // 初始化LIFF
    const initLiff = async () => {
      try {
        setIsLoading(true);
        const liffObject = await initializeLiff(liffId);
        setLiff(liffObject);
        
        // 設置登入狀態
        const loggedIn = liffObject.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        // 設置是否在LINE App內
        setIsInClient(liffObject.isInClient());
        
        // 如果已登入，獲取用戶資料
        if (loggedIn) {
          const userProfile = await getLiffUserProfile(liffObject);
          setProfile(userProfile);
          
          // 在獲取到用戶資料後，請求客戶資料
          if (userProfile && userProfile.userId) {
            fetchCustomerData(userProfile.userId);
          }
        } else {
          // 即使未登入也嘗試從 localStorage 加載客戶資料
          tryLoadFromLocalStorage();
        }
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize LIFF'));
        
        // 即使 LIFF 初始化失敗也嘗試從 localStorage 加載客戶資料
        tryLoadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
  }, [liffId]);

  // 提供一個方法來更新客戶資料
  const updateCustomerData = (data: Partial<CustomerData>) => {
    console.log('LiffProvider: 更新客戶資料', data);
    // 如果有現有資料，合併更新
    if (customerData) {
      const updatedData = { ...customerData, ...data };
      setCustomerData(updatedData);
      localStorage.setItem('customerData', JSON.stringify(updatedData));
      console.log('LiffProvider: 已合併更新客戶資料', updatedData);
    } else {
      // 如果沒有現有資料，直接設置
      setCustomerData(data as CustomerData);
      localStorage.setItem('customerData', JSON.stringify(data));
      console.log('LiffProvider: 已設置新的客戶資料', data);
    }
  };

  // Context 值
  const contextValue: LiffContextType = {
    liff,
    profile,
    isLoggedIn,
    isInClient,
    isLoading,
    error,
    customerData,
    updateCustomerData
  };

  return (
    <LiffContext.Provider value={contextValue}>
      {children}
    </LiffContext.Provider>
  );
} 
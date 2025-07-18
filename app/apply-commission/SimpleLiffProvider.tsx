'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeLiff, getLiffUserProfile } from '@/lib/liff';

// LIFF Context 類型定義（簡化版，不包含客戶資料功能）
interface SimpleLiffContextType {
  liff: any;
  profile: any;
  isLoggedIn: boolean;
  isInClient: boolean;
  isLoading: boolean;
  error: Error | null;
}

// 創建簡化版 Context
const SimpleLiffContext = createContext<SimpleLiffContextType>({
  liff: null,
  profile: null,
  isLoggedIn: false,
  isInClient: false,
  isLoading: true,
  error: null
});

// 提供一個hook來使用簡化版LIFF Context
export const useLiff = () => useContext(SimpleLiffContext);

interface SimpleLiffProviderProps {
  children: ReactNode;
  liffId: string;
}

// 簡化版 LIFF Provider 組件（不包含客戶資料 API 調用）
export function SimpleLiffProvider({ children, liffId }: SimpleLiffProviderProps) {
  const [liff, setLiff] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isInClient, setIsInClient] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        setIsLoading(true);
        
        // 初始化 LIFF
        let liffObject;
        if ((window as any).liffObject) {
          console.log('使用預加載的 LIFF 對象');
          liffObject = (window as any).liffObject;
        } else {
          console.log('沒有找到預加載的 LIFF 對象，正在初始化');
          liffObject = await initializeLiff(liffId);
        }
        
        setLiff(liffObject);
        
        // 設置登入狀態
        const loggedIn = liffObject.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        // 設置是否在LINE App內
        setIsInClient(liffObject.isInClient());
        
        // 如果已登入，獲取用戶資料（但不調用客戶資料 API）
        if (loggedIn) {
          const userProfile = await getLiffUserProfile(liffObject);
          setProfile(userProfile);
          
          console.log('獲取LINE用戶資料:', {
            displayName: userProfile?.displayName,
            userId: userProfile?.userId
          });
        }
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize LIFF'));
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
  }, [liffId]);

  // Context 值
  const contextValue: SimpleLiffContextType = {
    liff,
    profile,
    isLoggedIn,
    isInClient,
    isLoading,
    error
  };

  return (
    <SimpleLiffContext.Provider value={contextValue}>
      {children}
    </SimpleLiffContext.Provider>
  );
} 
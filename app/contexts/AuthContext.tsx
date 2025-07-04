'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../services/api';

// 設置環境變數
const isDev = process.env.NODE_ENV === 'development';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string; userData?: User}>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // 添加請求狀態控制，防止重複請求
  const isCheckingAuth = useRef(false);
  const hasInitiallyChecked = useRef(false);

  // 檢查用戶是否已經登入
  useEffect(() => {
    const checkAuth = async () => {
      // 防止重複檢查
      if (isCheckingAuth.current || hasInitiallyChecked.current) {
        if (isDev) console.log('AuthContext: 跳過重複認證檢查');
        return;
      }

      isCheckingAuth.current = true;
      setIsLoading(true);
      
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          if (isDev) console.log('AuthContext: 沒有accessToken，設置為未登入狀態');
          setUser(null);
          setIsLoading(false);
          hasInitiallyChecked.current = true;
          return;
        }

        if (isDev) console.log('AuthContext: 驗證token有效性');
        // 驗證token有效性
        const response = await apiService.getCurrentUser();
        if (response.data.success) {
          if (isDev) console.log('AuthContext: token有效，設置用戶數據');
          setUser(response.data.data);
        } else {
          if (isDev) console.log('AuthContext: token無效，清除認證信息');
          setUser(null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // 清除cookie
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
      } catch (error) {
        if (isDev) console.error('AuthContext: 身份驗證檢查錯誤:', error);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // 清除cookie
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      } finally {
        setIsLoading(false);
        isCheckingAuth.current = false;
        hasInitiallyChecked.current = true;
      }
    };

    checkAuth();
  }, []); // 移除所有依賴項，只在組件掛載時執行一次

  // 刷新用戶信息
  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      if (isDev) console.error('刷新用戶信息錯誤:', error);
    }
  };

  // 登入函數
  const login = async (email: string, password: string) => {
    try {
      console.log('開始登入');
      const response = await apiService.login(email, password);
      
      // 注意: 由於改用fetch，response結構已經改變，不再需要 .data 層級
      if (response.success && response.data) {
        // 存儲token到localStorage
        const { accessToken, refreshToken } = response.data.tokens || response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // 同時也設置到cookie，讓中間件可以讀取
        try {
          // 使用更新的方式設置cookie
          const now = new Date();
          const accessExpiry = new Date(now.getTime() + 86400 * 1000); // 24小時
          const refreshExpiry = new Date(now.getTime() + 7 * 86400 * 1000); // 7天
          
          // 使用正確的方式設置cookie
          document.cookie = `accessToken=${accessToken}; path=/; expires=${accessExpiry.toUTCString()}`;
          document.cookie = `refreshToken=${refreshToken}; path=/; expires=${refreshExpiry.toUTCString()}`;
          
          if (isDev) console.log('已設置新的格式到Cookie');
          
          // 驗證cookie是否正確設置 - 僅開發環境
          if (isDev) {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
              const [name, value] = cookie.trim().split('=');
              if (name && value) acc[name] = value;
              return acc;
            }, {} as Record<string, string>);
            
            console.log(
              'Cookie狀態:\n' +
              `- accessToken: ${cookies.accessToken ? '存在 (' + cookies.accessToken.substring(0, 10) + '...)' : '不存在!'}\n` +
              `- refreshToken: ${cookies.refreshToken ? '存在 (' + cookies.refreshToken.substring(0, 10) + '...)' : '不存在!'}`
            );
            
            // 如果本地storage中沒有token但cookie中有，則重新檢查一次
            if (!cookies.accessToken || !cookies.refreshToken) {
              console.log('重新檢查一次');
              document.cookie = `accessToken=${accessToken}`;
              document.cookie = `refreshToken=${refreshToken}`;
              
              // 重新檢查一次
              const recheckedCookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) acc[name] = value;
                return acc;
              }, {} as Record<string, string>);
              
              console.log(
                '重新檢查一次Cookie狀態:\n' +
                `- accessToken: ${recheckedCookies.accessToken ? '存在' : '不存在!'}\n` +
                `- refreshToken: ${recheckedCookies.refreshToken ? '存在' : '不存在!'}`
              );
            }
          }
        } catch (cookieError) {
          if (isDev) console.error('設置Cookie失敗:', cookieError);
        }
        
        // 設置用戶信息並重置認證檢查狀態
        setUser(response.data.user);
        hasInitiallyChecked.current = true; // 重置狀態
        
        return { 
          success: true, 
          userData: response.data.user  // 返回用戶數據
        };
      } else {
        return { 
          success: false, 
          message: response.message || '登入失敗' 
        };
      }
    } catch (error: any) {
      if (isDev) console.error('登入錯誤:', error);
      return { 
        success: false, 
        message: error.message || '登入時發生錯誤' 
      };
    }
  };

  // 登出函數
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      if (isDev) console.error('登出錯誤:', error);
    } finally {
      // 清除本地存儲數據
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // 清除cookie中的令牌 - 使用正確的方式設置過期時間
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // 重新檢查一次cookies是否已經過期 - 僅開發環境
      if (isDev) {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) acc[name] = value;
          return acc;
        }, {} as Record<string, string>);
        
        console.log(
          '登出後Cookie狀態:\n' +
          `- accessToken: ${cookies.accessToken ? '依然存在!' : '已清除'}\n` +
          `- refreshToken: ${cookies.refreshToken ? '依然存在!' : '已清除'}`
        );
        
        console.log('已清除所有本地授權信息');
      }
      
      setUser(null);
      // 重置認證檢查狀態
      hasInitiallyChecked.current = false;
      isCheckingAuth.current = false;
      
      // 保存當前頁面路徑，登入後可以返回
      const currentPath = window.location.pathname;
      // 只有在admin頁面登出時才保存重定向路徑
      if (currentPath.startsWith('/admin')) {
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        router.push('/login');
      }
    }
  };

  // 清除身份驗證狀態函數
  const clearAuth = () => {
    // 清除本地存儲數據
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 清除cookie中的令牌
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // 清除用戶狀態
    setUser(null);
    
    // 重置認證檢查狀態
    hasInitiallyChecked.current = false;
    isCheckingAuth.current = false;
    
    if (isDev) {
      console.log('已清除所有身份驗證狀態 (clearAuth)');
    }
  };

  // 提供給上下文的值
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    clearAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定義hook以便在組件中使用
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必須在AuthProvider內使用');
  }
  return context;
} 
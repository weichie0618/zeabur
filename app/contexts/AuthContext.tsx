'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 檢查用戶是否已經登入
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const response = await apiService.getCurrentUser();
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          // 如果API返回失敗，清除用戶狀態
          setUser(null);
          // 清除本地存儲的token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (error) {
        if (isDev) console.error('身份驗證檢查錯誤:', error);
        setUser(null);
        // 清除本地存儲的token
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      const response = await apiService.login(email, password);
      
      if (response.data.success && response.data.data) {
        // 存儲token到localStorage
        const { accessToken, refreshToken } = response.data.data;
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
        
        // 設置用戶信息
        setUser(response.data.data.user);
        
        return { 
          success: true, 
          userData: response.data.data.user  // 返回用戶數據
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || '登入失敗' 
        };
      }
    } catch (error: any) {
      if (isDev) console.error('登入錯誤:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '登入時發生錯誤' 
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
      router.push('/login');
    }
  };

  // 提供給上下文的值
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser
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
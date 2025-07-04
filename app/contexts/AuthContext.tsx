'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../services/api';
import authDebugger from '../utils/authDebugger';

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
        authDebugger.log('auth_check', '跳過重複認證檢查', 'AuthContext');
        return;
      }

      authDebugger.log('auth_check', '開始初始認證檢查', 'AuthContext');
      isCheckingAuth.current = true;
      setIsLoading(true);
      
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          authDebugger.log('auth_check', '沒有accessToken，設置為未登入狀態', 'AuthContext');
          setUser(null);
          setIsLoading(false);
          hasInitiallyChecked.current = true;
          return;
        }

        authDebugger.log('api_request', '驗證token有效性 -> /api/auth/me', 'AuthContext');
        // 驗證token有效性
        const response = await apiService.getCurrentUser();
        if (response.data.success) {
          authDebugger.log('auth_check', 'token有效，設置用戶數據', 'AuthContext');
          setUser(response.data.data);
        } else {
          authDebugger.log('auth_check', 'token無效，清除認證信息', 'AuthContext');
          setUser(null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // 清除cookie
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
      } catch (error) {
        authDebugger.log('auth_check', `身份驗證檢查錯誤: ${error}`, 'AuthContext');
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
        authDebugger.log('auth_check', '初始認證檢查完成', 'AuthContext');
      }
    };

    checkAuth();
  }, []); // 移除所有依賴項，只在組件掛載時執行一次

  // 刷新用戶信息
  const refreshUser = async () => {
    try {
      authDebugger.log('api_request', '刷新用戶信息 -> /api/auth/me', 'AuthContext.refreshUser');
      const response = await apiService.getCurrentUser();
      if (response.data.success) {
        setUser(response.data.data);
        authDebugger.log('auth_check', '用戶信息刷新成功', 'AuthContext.refreshUser');
      }
    } catch (error) {
      authDebugger.log('auth_check', `刷新用戶信息錯誤: ${error}`, 'AuthContext.refreshUser');
      if (isDev) console.error('刷新用戶信息錯誤:', error);
    }
  };

  // 登入函數
  const login = async (email: string, password: string) => {
    try {
      authDebugger.log('login', `開始登入: ${email}`, 'AuthContext');
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
          
          authDebugger.log('login', '已設置token到Cookie和localStorage', 'AuthContext');
          
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
          authDebugger.log('login', `設置Cookie失敗: ${cookieError}`, 'AuthContext');
        }
        
        // 設置用戶信息並重置認證檢查狀態
        setUser(response.data.user);
        hasInitiallyChecked.current = true; // 重置狀態
        authDebugger.log('login', '登入成功，用戶狀態已設置', 'AuthContext');
        
        return { 
          success: true, 
          userData: response.data.user  // 返回用戶數據
        };
      } else {
        authDebugger.log('login', `登入失敗: ${response.message}`, 'AuthContext');
        return { 
          success: false, 
          message: response.message || '登入失敗' 
        };
      }
    } catch (error: any) {
      authDebugger.log('login', `登入錯誤: ${error.message}`, 'AuthContext');
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
      authDebugger.log('logout', '開始登出流程', 'AuthContext');
      await apiService.logout();
    } catch (error) {
      authDebugger.log('logout', `登出錯誤: ${error}`, 'AuthContext');
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
      authDebugger.log('logout', '登出完成，已清除所有認證狀態', 'AuthContext');
      
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
    
    authDebugger.log('auth_check', '已清除所有身份驗證狀態 (clearAuth)', 'AuthContext');
    
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
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
  const authCheckPromise = useRef<Promise<void> | null>(null);

  // 檢查用戶是否已經登入
  useEffect(() => {
    const checkAuth = async () => {
      // 防止重複檢查
      if (isCheckingAuth.current || hasInitiallyChecked.current) {
        authDebugger.log('auth_check', '跳過重複認證檢查', 'AuthContext');
        return;
      }

      // 如果已經有正在進行的檢查，等待它完成
      if (authCheckPromise.current) {
        authDebugger.log('auth_check', '等待現有的認證檢查完成', 'AuthContext');
        return authCheckPromise.current;
      }

      authDebugger.log('auth_check', '開始初始認證檢查', 'AuthContext');
      isCheckingAuth.current = true;
      setIsLoading(true);
      
      // 創建檢查 Promise
      authCheckPromise.current = (async () => {
        try {
          // 🔑 安全改進：直接檢查 /api/auth/me，Cookie 會自動包含
          authDebugger.log('api_request', '驗證Cookie有效性 -> /api/auth/me', 'AuthContext');
          
          const response = await apiService.getCurrentUser();
          if (response.data.success) {
            authDebugger.log('auth_check', 'Cookie有效，設置用戶數據', 'AuthContext');
            setUser(response.data.data);
          } else {
            authDebugger.log('auth_check', 'Cookie無效，設置為未登入狀態', 'AuthContext');
            setUser(null);
          }
        } catch (error) {
          authDebugger.log('auth_check', `身份驗證檢查錯誤: ${error}`, 'AuthContext');
          if (isDev) console.error('AuthContext: 身份驗證檢查錯誤:', error);
          setUser(null);
        } finally {
          setIsLoading(false);
          isCheckingAuth.current = false;
          hasInitiallyChecked.current = true;
          authCheckPromise.current = null;
          authDebugger.log('auth_check', '初始認證檢查完成', 'AuthContext');
        }
      })();

      return authCheckPromise.current;
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
      
      if (response.success && response.data) {
        // 🔑 安全改進：不再存儲 tokens 到 localStorage
        // HttpOnly Cookie 由後端自動設置，前端無需處理
        authDebugger.log('login', '後端已設置 HttpOnly Cookie，前端無需處理 tokens', 'AuthContext');
        
        // 設置用戶信息並重置認證檢查狀態
        setUser(response.data.user);
        hasInitiallyChecked.current = true; // 重置狀態
        authDebugger.log('login', '登入成功，用戶狀態已設置', 'AuthContext');
        
        // 添加小延遲確保 Cookie 設置完成
        await new Promise(resolve => setTimeout(resolve, 100));
        
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
      // 🔑 安全改進：不再清除 localStorage（因為沒有存儲 tokens）
      // HttpOnly Cookie 由後端清除
      authDebugger.log('logout', '後端會清除 HttpOnly Cookie', 'AuthContext');
      
      setUser(null);
      // 重置認證檢查狀態
      hasInitiallyChecked.current = false;
      isCheckingAuth.current = false;
      authDebugger.log('logout', '登出完成，已清除認證狀態', 'AuthContext');
      
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
    // 🔑 安全改進：不再清除 localStorage（因為沒有存儲 tokens）
    // HttpOnly Cookie 由後端或瀏覽器管理
    
    // 清除用戶狀態
    setUser(null);
    
    // 重置認證檢查狀態
    hasInitiallyChecked.current = false;
    isCheckingAuth.current = false;
    
    authDebugger.log('auth_check', '已清除身份驗證狀態 (clearAuth)', 'AuthContext');
    
    if (isDev) {
      console.log('已清除身份驗證狀態 (clearAuth)');
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
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'salesperson';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 檢查當前路徑是否為管理後台
    const isAdminPath = pathname.startsWith('/admin');
    
    // 如果不是管理後台路徑，直接返回，不做權限檢查
    if (!isAdminPath) {
      return;
    }

    // 如果用戶數據已加載完成但未認證，則重定向到登入頁面
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // 如果需要特定角色且用戶角色不符
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // 管理員可以訪問所有頁面
      if (user?.role === 'admin') {
        return;
      }
      
      // 業務人員嘗試訪問管理員頁面，重定向到業務儀表板
      if (user?.role === 'salesperson' && requiredRole === 'admin') {
        router.push('/sales/dashboard');
        return;
      }
      
      // 其他未授權的情況，直接重定向到登入頁面
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, requiredRole, user, router, pathname]);

  // 在客戶端渲染之前，返回一個通用的載入狀態
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // 檢查是否為管理後台路徑
  const isAdminPath = pathname.startsWith('/admin');

  // 如果不是管理後台路徑，直接渲染內容
  if (!isAdminPath) {
    return <>{children}</>;
  }

  // 如果正在載入，顯示載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // 如果未登入，返回空內容（useEffect將處理重定向）
  if (!isAuthenticated) {
    return null;
  }

  // 如果有特定角色要求但用戶角色不匹配
  if (requiredRole && user?.role !== requiredRole) {
    // 特例：管理員可以訪問所有頁面
    if (user?.role === 'admin') {
      return <>{children}</>;
    }
    return null; // useEffect將處理重定向
  }

  // 通過所有檢查，渲染子內容
  return <>{children}</>;
} 
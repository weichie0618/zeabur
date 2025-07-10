'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSalesperson, SalespersonProvider } from './context/SalespersonContext';

// 聲明 LIFF 類型
declare global {
  interface Window {
    liff: any;
  }
}

// 錯誤邊界組件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Layout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">頁面載入錯誤</h1>
            <p className="text-gray-600 mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              重新載入頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 自定義側邊欄連結元件
interface SidebarLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, active, children, onClick }) => {
  return (
    <Link 
      href={href} 
      className={`block px-4 py-3 my-1 mx-2 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

// LIFF 初始化 Hook
function useLiffInit() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);

  const initializeLiff = useCallback(async () => {
    try {
      // 檢查是否在瀏覽器環境
      if (typeof window === 'undefined') return;

      // 檢查是否已經載入 LIFF SDK
      if (window.liff) {
        console.log('LIFF SDK 已載入，開始初始化');
        
        if (!window.liff.isInClient() && window.liff.isLoggedIn && window.liff.isLoggedIn()) {
          console.log('LIFF 已經初始化並登入');
          setIsLiffReady(true);
          return;
        }
        
        await window.liff.init({
          liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
        });
        setIsLiffReady(true);
        console.log('LIFF 初始化完成');
        return;
      }

      // 載入 LIFF SDK
      console.log('載入 LIFF SDK');
      const existingScript = document.querySelector('script[src*="liff"]');
      if (existingScript) {
        console.log('LIFF SDK 腳本已存在，等待載入');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      
      script.onload = async () => {
        try {
          if (window.liff) {
            await window.liff.init({
              liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
            });
            setIsLiffReady(true);
            console.log('LIFF 初始化完成');
          }
        } catch (error) {
          console.error('LIFF 初始化失敗:', error);
          setLiffError('LIFF 初始化失敗');
        }
      };
      
      script.onerror = () => {
        console.error('LIFF SDK 載入失敗');
        setLiffError('LIFF SDK 載入失敗');
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('LIFF 設置失敗:', error);
      setLiffError('LIFF 設置失敗');
    }
  }, []);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return { isLiffReady, liffError };
}

// 內部佈局組件，使用 Context
function CitySalesLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { salesperson, storeId, logout, isAuthenticated, loading } = useSalesperson();
  const { isLiffReady, liffError } = useLiffInit();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // 處理登出
  const handleLogout = useCallback(() => {
    logout();
    closeSidebar();
  }, [logout, closeSidebar]);

  // 檢查受保護的路由
  useEffect(() => {
    const protectedRoutes = ['/city-sales/dashboard', '/city-sales/orders', '/city-sales/commissions', '/city-sales/profile', '/city-sales/qrcode'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute && !loading && !isAuthenticated) {
      console.log('未認證用戶訪問受保護路由，重定向到登入頁');
      router.replace('/city-sales/login');
    }
  }, [pathname, isAuthenticated, loading, router]);

  // 如果正在載入，顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* 側邊欄 */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:static md:block shadow-xl`}>
          <div className="p-4 border-b border-gray-700/50">
            <Link href="/city-sales/dashboard" className="text-xl font-bold flex items-center hover:opacity-90 transition-opacity" onClick={closeSidebar}>
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 w-8 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              晴朗家推廣平台
            </Link>
            {storeId && (
              <p className="text-sm text-gray-400 mt-2 bg-gray-800/50 px-2 py-1 rounded-md">代號：{storeId}</p>
            )}
          </div>
          
          <nav className="mt-6">
            <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">主要功能</div>
            
            <SidebarLink href="/city-sales/dashboard" active={pathname === '/city-sales/dashboard'} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                業績儀表板
              </span>
            </SidebarLink>
            
            <SidebarLink href="/city-sales/orders" active={pathname.startsWith('/city-sales/orders')} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                訂單管理
              </span>
            </SidebarLink>
            
            <SidebarLink href="/city-sales/commissions" active={pathname.startsWith('/city-sales/commissions')} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                分潤記錄
              </span>
            </SidebarLink>
            
            <SidebarLink href="/city-sales/qrcode" active={pathname === '/city-sales/qrcode'} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 16a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM16 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zM11 5h2M9 7h1m4 0h1m-6 2h1m4 0h1m-6 2h1m4 0h1m-6 2h1m4 0h1m-6 2h1m6-4h2" />
                </svg>
                推廣專屬QR Code
              </span>
            </SidebarLink>
            
            <div className="px-4 py-2 mt-6 text-xs text-gray-400 uppercase tracking-wider">設定</div>
            
            <SidebarLink href="/city-sales/profile" active={pathname === '/city-sales/profile'} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                個人資料
              </span>
            </SidebarLink>

            {/* 登出按鈕 */}
            <div className="mt-8 px-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-300 rounded-lg transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                登出
              </button>
            </div>
          </nav>
        </aside>
        
        {/* 主要內容區 */}
        <main className="flex-1 overflow-auto">
          {/* 頂部導航欄 */}
          <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/60">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center">
                {/* 側邊欄切換按鈕 - 僅在行動裝置顯示 */}
                <button 
                  onClick={toggleSidebar} 
                  className="md:hidden mr-3 p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-800">晴朗家推廣平台</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 使用者資訊 */}
                <div className="hidden sm:flex items-center text-gray-600">
                  <span className="text-sm">{salesperson?.name || '業務員'}</span>
                </div>
                
                {/* 行動版登出按鈕 */}
                <button
                  onClick={handleLogout}
                  className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                  title="登出"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>
          
          {/* 內容區域 */}
          <div className="p-4 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
        
        {/* 背景遮罩 - 當側邊欄開啟時顯示 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden" 
            onClick={closeSidebar}
          ></div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// 主要佈局組件，提供 Context
export default function CitySalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalespersonProvider>
      <CitySalesLayoutInner>
        {children}
      </CitySalesLayoutInner>
    </SalespersonProvider>
  );
} 
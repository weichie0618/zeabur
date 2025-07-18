'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSalesperson, SalespersonProvider } from './context/SalespersonContext';

// 自定義側邊欄連結元件
interface SidebarLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = React.memo(({ href, active, children, onClick }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // 添加觸摸反饋，改善響應性
    const target = e.currentTarget as HTMLAnchorElement;
    target.style.transform = 'scale(0.98)';
    
    setIsNavigating(true);
    onClick();
    
    // 添加小延遲讓用戶感知到點擊
    setTimeout(() => {
      target.style.transform = '';
      router.push(href);
      setIsNavigating(false);
    }, 150);
  }, [onClick, router, href]);

  return (
    <Link 
      href={href} 
      className={`block px-4 py-3 my-1 mx-2 rounded-lg transition-all duration-150 ease-out transform-gpu will-change-transform relative ${
        active 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
      } ${isNavigating ? 'opacity-75' : ''}`}
      onClick={handleClick}
      style={{ 
        // 確保硬體加速
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {children}
      {isNavigating && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        </div>
      )}
    </Link>
  );
});

SidebarLink.displayName = 'SidebarLink';

// 內部佈局組件，使用 Context
function CitySalesLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const pathname = usePathname();
  const { salesperson, storeId, status, loading } = useSalesperson();

  // 監聽路由變化以顯示載入狀態
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  // 優化切換函數，使用 useCallback 避免重複渲染
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // 使用 useMemo 優化路由保護邏輯
  const isProtectedRoute = useMemo(() => {
    return pathname !== '/city-sales/login' && 
           pathname !== '/city-sales/commission-not-activated';
  }, [pathname]);

  // 背景遮罩點擊處理器
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSidebar();
    }
  }, [closeSidebar]);

  // 防止滾動穿透
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // 如果是受保護的路由且用戶未認證，顯示載入或重定向
  if (isProtectedRoute) {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">檢查登入狀態...</p>
          </div>
        </div>
      );
    }
    
    if (status === 'unauthenticated' || status === 'error') {
      // 使用 window.location 進行重定向，避免 React 渲染問題
      if (typeof window !== 'undefined') {
        window.location.href = '/city-sales/login';
      }
      return null;
    }
  }

  // 使用 useMemo 優化側邊欄樣式計算
  const sidebarClassName = useMemo(() => {
    return `fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white transform transition-transform duration-200 ease-out will-change-transform sidebar-transition ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0 md:static md:block shadow-xl`;
  }, [sidebarOpen]);

  // 使用 useMemo 優化導航項目
  const navigationItems = useMemo(() => [
    {
      href: "/city-sales/dashboard",
      active: pathname === '/city-sales/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: "業績儀表板"
    },
    {
      href: "/city-sales/orders",
      active: pathname.startsWith('/city-sales/orders'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      label: "訂單管理"
    },
    {
      href: "/city-sales/commissions",
      active: pathname.startsWith('/city-sales/commissions'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "分潤記錄"
    },
    {
      href: "/city-sales/qrcode",
      active: pathname === '/city-sales/qrcode',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 16a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM16 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zM11 5h2M9 7h1m4 0h1m-6 2h1m4 0h1m-6 2h1m4 0h1m-6 2h1m4 0h1m-6 2h1m6-4h2" />
        </svg>
      ),
      label: "推廣專屬QR Code"
    }
  ], [pathname]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* 頁面轉換載入指示器 */}
      {isPageTransitioning && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-200 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}

      {/* 側邊欄 */}
      <aside 
        className={sidebarClassName}
        style={{ 
          // 確保硬體加速
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        <div className="p-4 border-b border-gray-700/50">
          <Link 
            href="/city-sales/dashboard" 
            className="text-xl font-bold flex items-center hover:opacity-90 transition-opacity duration-150" 
            onClick={closeSidebar}
          >
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
        
        <nav className="mt-6 overflow-y-auto">
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">主要功能</div>
          
          {navigationItems.map((item) => (
            <SidebarLink 
              key={item.href}
              href={item.href} 
              active={item.active} 
              onClick={closeSidebar}
            >
              <span className="flex items-center">
                {item.icon}
                {item.label}
              </span>
            </SidebarLink>
          ))}
          
          <div className="px-4 py-2 mt-6 text-xs text-gray-400 uppercase tracking-wider">設定</div>
          
          <SidebarLink href="/city-sales/profile" active={pathname === '/city-sales/profile'} onClick={closeSidebar}>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              個人資料
            </span>
          </SidebarLink>
        </nav>
      </aside>
      
      {/* 主要內容區 */}
      <main className="flex-1 overflow-auto">
        {/* 頂部導航欄 */}
        <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/60 sticky top-0 z-30">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              {/* 側邊欄切換按鈕 - 僅在行動裝置顯示 */}
              <button 
                onClick={toggleSidebar} 
                className="md:hidden mr-3 p-2 rounded-md text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 touch-manipulation select-none"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none'
                }}
                aria-label="開啟側邊選單"
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
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-200 ease-out"
          onClick={handleBackdropClick}
          style={{ 
            // 確保硬體加速
            backfaceVisibility: 'hidden',
            WebkitTapHighlightColor: 'transparent'
          }}
        />
      )}
    </div>
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
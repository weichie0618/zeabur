'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';

// 自定義側邊欄連結元件，點擊後自動收起側邊欄
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
      className={`block px-4 py-2 my-1 mx-2 rounded-md ${active ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <ProtectedRoute requiredRole="salesperson">
      <div className="flex h-screen bg-gray-100">
        {/* 側邊欄 - 行動裝置時隱藏 */}
        <aside className={`fixed inset-y-0 left-0 z-10 w-64 bg-gray-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:static md:block`}>
          <div className="p-4 sm:p-6">
            <Link href="/sales/dashboard" className="text-lg sm:text-xl font-bold flex items-center" onClick={closeSidebar}>
              <span className="bg-amber-500 h-7 w-7 sm:h-8 sm:w-8 rounded-md flex items-center justify-center text-white mr-2 sm:mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
              業務管理
            </Link>
          </div>
          
          <nav className="mt-4 sm:mt-6">
            <div className="px-4 py-2 text-xs text-gray-400 uppercase">主要功能</div>
            <SidebarLink href="/sales/dashboard" active={pathname === '/sales/dashboard'} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                儀表板
              </span>
            </SidebarLink>
            
            <SidebarLink href="/sales/orders" active={pathname.startsWith('/sales/orders')} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                訂單管理
              </span>
            </SidebarLink>
            
            <SidebarLink href="/sales/customers" active={pathname.startsWith('/sales/customers')} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                客戶管理
              </span>
            </SidebarLink>
            
            <div className="px-4 py-2 mt-4 sm:mt-6 text-xs text-gray-400 uppercase">報表</div>
            
            <SidebarLink href="/sales/reports/sales" active={pathname === '/sales/reports/sales'} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                銷售報表
              </span>
            </SidebarLink>
            
            <SidebarLink href="/sales/reports/performance" active={pathname === '/sales/reports/performance'} onClick={closeSidebar}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                業績分析
              </span>
            </SidebarLink>
          </nav>
        </aside>
        
        {/* 主要內容區 */}
        <main className="flex-1 overflow-auto">
          {/* 頂部導航欄 */}
          <header className="bg-white shadow-sm">
            <div className="flex justify-between items-center px-4 sm:px-6 py-3">
              <div className="flex items-center">
                {/* 側邊欄切換按鈕 - 僅在行動裝置顯示 */}
                <button 
                  onClick={toggleSidebar} 
                  className="md:hidden mr-2 p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800">業務管理系統</h1>
              </div>
              
              <div className="flex items-center">
                {/* 使用者資訊與登出按鈕 */}
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2 sm:mr-4 hidden sm:inline">{user?.name || '業務人員'}</span>
                  <button 
                    onClick={() => logout()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm"
                  >
                    登出
                  </button>
                </div>
              </div>
            </div>
          </header>
          
          {/* 內容區域 */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* 背景遮罩 - 當側邊欄開啟時顯示 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-0 md:hidden" 
          onClick={closeSidebar}
        ></div>
      )}
    </ProtectedRoute>
  );
} 
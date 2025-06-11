'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // 導航項目的活躍狀態樣式
  const getNavItemClass = (path: string) => {
    const isActive = pathname === path;
    return `block px-4 py-2 my-1 mx-2 rounded-md ${
      isActive 
        ? 'bg-gray-900 text-white' 
        : 'text-gray-300 hover:bg-gray-700'
    }`;
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-100">
        {/* 側邊欄 */}
        <aside className="w-64 bg-gray-800 text-white">
          <div className="p-6">
            <Link href="/admin/bakery" className="text-xl font-bold flex items-center">
              <span className="bg-amber-500 h-8 w-8 rounded-md flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
              烘焙坊管理
            </Link>
          </div>
          
          <nav className="mt-6">
            <div className="px-4 py-2 text-xs text-gray-400 uppercase">主要功能</div>
            <Link href="/admin/bakery" className={getNavItemClass('/admin/bakery')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                儀表板
              </span>
            </Link>
            
            <Link href="/admin/bakery/orders" className={getNavItemClass('/admin/bakery/orders')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                訂單管理
              </span>
            </Link>
            
            <Link href="/admin/bakery/products" className={getNavItemClass('/admin/bakery/products')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                產品管理
              </span>
            </Link>
            
            <Link href="/admin/bakery/categories" className={getNavItemClass('/admin/bakery/categories')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
                </svg>
                分類管理
              </span>
            </Link>
            
            <Link href="/admin/bakery/customers" className={getNavItemClass('/admin/bakery/customers')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                客戶管理
              </span>
            </Link>
            
            <Link href="/admin/bakery/owners" className={getNavItemClass('/admin/bakery/owners')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                業主管理
              </span>
            </Link>
            
            <div className="px-4 py-2 mt-6 text-xs text-gray-400 uppercase">報表</div>
            
            <Link href="/admin/bakery/export" className={getNavItemClass('/admin/bakery/export')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                訂單匯出
              </span>
            </Link>
            
            <Link href="/admin/bakery/performance" className={getNavItemClass('/admin/bakery/performance')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                業績報表
              </span>
            </Link>
            
            {/* <Link href="/admin/bakery/settings" className={getNavItemClass('/admin/bakery/settings')}>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                系統設定
              </span>
            </Link> */}
          </nav>
        </aside>
        
        {/* 主要內容區 */}
        <main className="flex-1 overflow-auto">
          {/* 頂部導航欄 */}
          <header className="bg-white shadow-sm">
            <div className="flex justify-between items-center px-6 py-3">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-800 ml-4">烘焙坊管理系統</h1>
              </div>
              
              <div className="flex items-center">
                {/* 使用者資訊與登出按鈕 */}
                <div className="flex items-center">
                  <span className="text-gray-700 mr-4">{user?.name || '管理員'}</span>
                  <button 
                    onClick={() => logout()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm"
                  >
                    登出
                  </button>
                </div>
              </div>
            </div>
          </header>
          
          {/* 內容區域 */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 
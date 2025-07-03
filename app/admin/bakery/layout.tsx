'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { virtualCardApi } from './points/api';
import { fetchPendingOrdersCount } from './orders/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  // 待處理購買記錄數量
  const [pendingPurchasesCount, setPendingPurchasesCount] = useState<number>(0);
  
  // 待處理訂單數量
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  
  // 互斥手風琴控制 - 同時只能展開一個分組
  const getInitialExpandedGroup = () => {
    if (pathname === '/admin/bakery' || 
        pathname.startsWith('/admin/bakery/orders') ||
        pathname.startsWith('/admin/bakery/products') ||
        pathname.startsWith('/admin/bakery/categories') ||
        pathname.startsWith('/admin/bakery/customers') ||
        pathname.startsWith('/admin/bakery/owners')) {
      return 'main';
    }
    if (pathname.startsWith('/admin/bakery/points')) {
      return 'points';
    }
    if (pathname.startsWith('/admin/bakery/sales') ||
        pathname.startsWith('/admin/bakery/commissions') ||
        pathname.startsWith('/admin/bakery/commission-plans')) {
      return 'sales';
    }
    if (pathname.startsWith('/admin/bakery/coupons')) {
      return 'other';
    }
    if (pathname.startsWith('/admin/bakery/export') ||
        pathname.startsWith('/admin/bakery/performance')) {
      return 'report';
    }
    return 'main'; // 預設展開主要功能
  };

  const [expandedGroup, setExpandedGroup] = useState<string | null>(getInitialExpandedGroup());

  // 載入待處理購買記錄數量
  const loadPendingPurchasesCount = async () => {
    try {
      const response = await virtualCardApi.getPurchases({ 
        page: 1, 
        limit: 1000,
        paymentStatus: 'pending' 
      });
      
      if (response.success) {
        setPendingPurchasesCount(response.data?.length || 0);
      }
    } catch (error) {
      console.error('載入待處理購買記錄失敗:', error);
      // 靜默失敗，不影響主要功能
    }
  };

  // 載入待處理訂單數量
  const loadPendingOrdersCount = async () => {
    if (!user) return;
    
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    
    try {
      const count = await fetchPendingOrdersCount(accessToken);
      setPendingOrdersCount(count);
    } catch (error) {
      console.error('載入待處理訂單失敗:', error);
      // 靜默失敗，不影響主要功能
    }
  };

  // 定期更新待處理記錄數量
  useEffect(() => {
    if (user) {
      loadPendingPurchasesCount();
      loadPendingOrdersCount();
      
      // 每30秒更新一次
      const purchasesInterval = setInterval(loadPendingPurchasesCount, 30000);
      const ordersInterval = setInterval(loadPendingOrdersCount, 30000);
      
      // 監聽來自購買記錄頁面的更新事件
      const handlePurchaseUpdate = () => {
        loadPendingPurchasesCount();
      };
      
      // 監聽來自訂單頁面的更新事件
      const handleOrderUpdate = () => {
        loadPendingOrdersCount();
      };
      
      window.addEventListener('purchaseStatusUpdated', handlePurchaseUpdate);
      window.addEventListener('orderStatusUpdated', handleOrderUpdate);
      
      return () => {
        clearInterval(purchasesInterval);
        clearInterval(ordersInterval);
        window.removeEventListener('purchaseStatusUpdated', handlePurchaseUpdate);
        window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
      };
    }
  }, [user]);

  // 切換分組展開狀態
  const toggleGroup = (groupName: string) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  // 導航項目的活躍狀態樣式
  const getNavItemClass = (path: string) => {
    const isActive = pathname === path;
    return `block px-3 py-2 my-1 mx-2 rounded-md text-sm transition-colors ${
      isActive 
        ? 'bg-gray-900 text-white' 
        : 'text-gray-300 hover:bg-gray-700'
    }`;
  };

  // 子選單項目樣式
  const getSubNavItemClass = (path: string) => {
    const isActive = pathname === path;
    return `block px-6 py-2 my-1 mx-2 rounded-md text-sm transition-colors ${
      isActive 
        ? 'bg-amber-500 text-white font-medium' 
        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
    }`;
  };

  // 分組標題樣式
  const getGroupHeaderClass = (isExpanded: boolean) => {
    return `px-4 py-3 text-sm text-gray-300 uppercase font-bold flex items-center justify-between cursor-pointer hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-md mx-2 my-1 ${
      isExpanded ? 'text-white bg-gray-700' : ''
    }`;
  };

  // 摺疊圖示
  const CollapseIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg
      className={`h-4 w-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  // 數字徽章組件
  const NumberBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px] shadow-sm">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // 分組圖示組件
  const GroupIcon = ({ children }: { children: React.ReactNode }) => (
    <span className="mr-2 text-amber-400">
      {children}
    </span>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-100">
        {/* 側邊欄 */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          {/* 標題區域 */}
          <div className="p-4 border-b border-gray-700">
            <Link href="/admin/bakery" className="text-lg font-bold flex items-center hover:text-gray-300 transition-colors">
              <span className="bg-amber-500 h-7 w-7 rounded-md flex items-center justify-center text-white mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
              烘焙坊管理
            </Link>
          </div>
          
          {/* 可滾動的導航區域 */}
          <nav className="flex-1 overflow-y-auto py-2">
            {/* 主要功能 - 手風琴 */}
            <div>
              <div 
                className={getGroupHeaderClass(expandedGroup === 'main')}
                onClick={() => toggleGroup('main')}
              >
                <span className="flex items-center">
                  <GroupIcon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
                    </svg>
                  </GroupIcon>
                  <span className="flex items-center gap-2">
                    <span>主要功能</span>
                    {pendingOrdersCount > 0 && <span className="text-red-500">🔴</span>}
                  </span>
                </span>
                <CollapseIcon isExpanded={expandedGroup === 'main'} />
              </div>
              
              {expandedGroup === 'main' && (
                <div className="transition-all duration-300 ease-in-out pb-2">
                  <Link href="/admin/bakery" className={getNavItemClass('/admin/bakery')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      儀表板
                    </span>
                  </Link>
                  
                  <Link href="/admin/bakery/orders" className={getNavItemClass('/admin/bakery/orders')}>
                    <span className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        訂單管理
                      </span>
                      <NumberBadge count={pendingOrdersCount} />
                    </span>
                  </Link>
                  
                  <Link href="/admin/bakery/products" className={getNavItemClass('/admin/bakery/products')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      產品管理
                    </span>
                  </Link>
                  
                  <Link href="/admin/bakery/categories" className={getNavItemClass('/admin/bakery/categories')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
                      </svg>
                      分類管理
                    </span>
                  </Link>
                  
                  <Link href="/admin/bakery/customers" className={getNavItemClass('/admin/bakery/customers')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      客戶管理
                    </span>
                  </Link>
                  
                  <Link href="/admin/bakery/owners" className={getNavItemClass('/admin/bakery/owners')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      業主管理
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* 點數系統 - 手風琴 */}
            <div className="mt-4">
              <div 
                className={getGroupHeaderClass(expandedGroup === 'points')}
                onClick={() => toggleGroup('points')}
              >
                <span className="flex items-center">
                  <GroupIcon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </GroupIcon>
                  <span className="flex items-center gap-2">
                    <span>點數系統</span>
                    {pendingPurchasesCount > 0 && <span className="text-red-500">🔴</span>}
                  </span>
                </span>
                <CollapseIcon isExpanded={expandedGroup === 'points'} />
              </div>
              
              {expandedGroup === 'points' && (
                <div className="transition-all duration-300 ease-in-out pb-2">
                  <Link href="/admin/bakery/points" className={getNavItemClass('/admin/bakery/points')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      點數概覽
                    </span>
                  </Link>
                  
                  {/* 點數子選單 */}
                  <div className="ml-4 mt-2 pb-1 border-l-2 border-gray-600">
                    <Link href="/admin/bakery/points/users" className={getSubNavItemClass('/admin/bakery/points/users')}>
                      用戶點數
                    </Link>
                    <Link href="/admin/bakery/points/transactions" className={getSubNavItemClass('/admin/bakery/points/transactions')}>
                      交易記錄
                    </Link>
                    <Link href="/admin/bakery/points/virtual-cards" className={getSubNavItemClass('/admin/bakery/points/virtual-cards')}>
                      虛擬點數卡
                    </Link>
                    <Link href="/admin/bakery/points/virtual-cards/purchases" className={getSubNavItemClass('/admin/bakery/points/virtual-cards/purchases')}>
                      <span className="flex items-center justify-between w-full">
                        <span>購買記錄</span>
                        <NumberBadge count={pendingPurchasesCount} />
                      </span>
                    </Link>
                    <Link href="/admin/bakery/points/settings" className={getSubNavItemClass('/admin/bakery/points/settings')}>
                      系統設定
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 業務管理 - 手風琴 */}
            <div className="mt-4">
              <div 
                className={getGroupHeaderClass(expandedGroup === 'sales')}
                onClick={() => toggleGroup('sales')}
              >
                <span className="flex items-center">
                  <GroupIcon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                  </GroupIcon>
                  業務管理
                </span>
                <CollapseIcon isExpanded={expandedGroup === 'sales'} />
              </div>
              
              {expandedGroup === 'sales' && (
                <div className="transition-all duration-300 ease-in-out pb-2">
                  <Link href="/admin/bakery/commissions/sales" className={getNavItemClass('/admin/bakery/commissions/sales')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      </svg>
                      業務員管理
                    </span>
                  </Link>
                  
                  {/* 業務管理子選單 */}
                  <div className="ml-4 mt-2 pb-1 border-l-2 border-gray-600">
                    <Link href="/admin/bakery/commissions/plans" className={getSubNavItemClass('/admin/bakery/commissions/plans')}>
                      佣金專案管理
                    </Link>
                    <Link href="/admin/bakery/commissions/assignments" className={getSubNavItemClass('/admin/bakery/commissions/assignments')}>
                      業務分配管理
                    </Link>
                    <Link href="/admin/bakery/commissions/stats" className={getSubNavItemClass('/admin/bakery/commissions/stats')}>
                      佣金統計
                    </Link>
                    <Link href="/admin/bakery/commissions/history" className={getSubNavItemClass('/admin/bakery/commissions/history')}>
                      佣金紀錄
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 其他功能 - 手風琴 */}
            <div className="mt-4">
              <div 
                className={getGroupHeaderClass(expandedGroup === 'other')}
                onClick={() => toggleGroup('other')}
              >
                <span className="flex items-center">
                  <GroupIcon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </GroupIcon>
                  其他功能
                </span>
                <CollapseIcon isExpanded={expandedGroup === 'other'} />
              </div>
              
              {expandedGroup === 'other' && (
                <div className="transition-all duration-300 ease-in-out pb-2">
                  <Link href="/admin/bakery/coupons" className={getNavItemClass('/admin/bakery/coupons')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      優惠碼
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* 報表功能 - 手風琴 */}
            <div className="mt-4">
              <div 
                className={getGroupHeaderClass(expandedGroup === 'report')}
                onClick={() => toggleGroup('report')}
              >
                <span className="flex items-center">
                  <GroupIcon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </GroupIcon>
                  報表
                </span>
                <CollapseIcon isExpanded={expandedGroup === 'report'} />
              </div>
              
              {expandedGroup === 'report' && (
                <div className="transition-all duration-300 ease-in-out pb-2">
                  <Link href="/admin/bakery/export" className={getNavItemClass('/admin/bakery/export')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      訂單匯出
                    </span>
                  </Link>
                  
                  <Link href="/admin/bakery/performance" className={getNavItemClass('/admin/bakery/performance')}>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      業績報表
                    </span>
                  </Link>
                </div>
              )}
            </div>
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
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
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
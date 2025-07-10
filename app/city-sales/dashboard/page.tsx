'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSalesperson } from '../context/SalespersonContext';
import { salespersonApi, formatCurrency, formatCommissionAmount } from '../services/apiService';

interface DashboardStats {
  total_orders: number;
  total_sales_amount: number;
  subtotal_sum: number;
  paid_sales_amount: number;
  pending_sales_amount: number;
  status_breakdown: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  date?: string;
  month?: string;
}

interface CommissionPlan {
  id: number;
  name: string;
  description?: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate?: number;
  tiered_rules?: Array<{
    min_amount: number;
    max_amount: number | null;
    rate: number;
  }>;
  status: 'active' | 'inactive';
  effective_date?: string;
  expiry_date?: string;
}

interface DashboardData {
  salesperson: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    commission_plan_id?: number;
    contract_start_date?: string;
    contract_end_date?: string;
    commissionPlan?: CommissionPlan;
  };
  today: DashboardStats;
  monthly: DashboardStats;
  commission: {
    calculated: number;
    paid: number;
    total: number;
  };
}

// 錯誤邊界狀態
interface ErrorState {
  hasError: boolean;
  error: string | null;
  retryCount: number;
}

// 載入狀態
interface LoadingState {
  initial: boolean;
  refreshing: boolean;
  error: boolean;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    initial: true,
    refreshing: false,
    error: false
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    retryCount: 0
  });
  const { storeId } = useSalesperson();

  // 快取管理
  const cacheKey = useMemo(() => `dashboard_${storeId}`, [storeId]);
  const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘

  // 從快取獲取數據
  const getCachedData = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('讀取快取失敗:', error);
    }
    return null;
  }, [cacheKey, CACHE_DURATION]);

  // 快取數據
  const setCachedData = useCallback((data: DashboardData) => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('儲存快取失敗:', error);
    }
  }, [cacheKey]);

  // 重試機制
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    maxRetries: number = 3
  ) => {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i === maxRetries - 1) throw error;
        
        // 指數退避
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }, []);

  // 獲取儀表板數據
  const fetchDashboardData = useCallback(async (forceRefresh: boolean = false) => {
    if (!storeId) return;

    // 嘗試使用快取數據
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        setDashboardData(cachedData);
        setLoadingState({ initial: false, refreshing: false, error: false });
        return;
      }
    }

    setLoadingState(prev => ({ 
      ...prev, 
      initial: !dashboardData, 
      refreshing: !!dashboardData 
    }));
    setErrorState(prev => ({ ...prev, hasError: false, error: null }));

    try {
      const response = await retryWithBackoff(async () => {
        return await salespersonApi.getDashboard(storeId);
      });

      if (response.success && response.data && 
          'today' in response.data && 
          'monthly' in response.data && 
          'commission' in response.data) {
        
        const data = response.data as DashboardData;
        setDashboardData(data);
        setCachedData(data);
        setLoadingState({ initial: false, refreshing: false, error: false });
        setErrorState({ hasError: false, error: null, retryCount: 0 });
      } else {
        throw new Error(response.error || '獲取儀表板數據失敗');
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      const errorMessage = err?.message || '獲取儀表板數據時發生錯誤';
      
      setErrorState(prev => ({
        hasError: true,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));
      setLoadingState({ initial: false, refreshing: false, error: true });
    }
  }, [storeId, retryWithBackoff, getCachedData, setCachedData, dashboardData]);

  // 手動重試
  const handleRetry = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // 自動重新整理
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // 初始載入
  useEffect(() => {
    if (storeId) {
      fetchDashboardData();
    }
  }, [storeId, fetchDashboardData]);

  // 自動重新整理（每5分鐘）
  useEffect(() => {
    if (!storeId || !dashboardData) return;

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [storeId, dashboardData, fetchDashboardData]);

  // 載入組件
  const renderLoadingComponent = () => {
    if (loadingState.initial) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入儀表板數據...</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // 錯誤組件
  const renderErrorComponent = () => {
    if (errorState.hasError && !dashboardData) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">載入失敗</h3>
          <p className="text-red-600 mb-4">{errorState.error}</p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              重新載入 {errorState.retryCount > 0 && `(${errorState.retryCount})`}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  // 刷新指示器
  const renderRefreshIndicator = () => {
    if (loadingState.refreshing) {
      return (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">更新中...</span>
        </div>
      );
    }
    return null;
  };

  // 如果是初始載入或有錯誤且沒有數據，顯示相應組件
  const loadingComponent = renderLoadingComponent();
  if (loadingComponent) return loadingComponent;
  
  const errorComponent = renderErrorComponent();
  if (errorComponent) return errorComponent;
  
  if (!dashboardData) return null;

  // 計算數據
  const totalUnfinished = dashboardData.monthly.status_breakdown.pending +
    dashboardData.monthly.status_breakdown.processing +
    dashboardData.monthly.status_breakdown.shipped +
    dashboardData.monthly.status_breakdown.cancelled;

  const completedOrders = dashboardData.monthly.status_breakdown.delivered;

  const currentDate = new Date().toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <>
      {renderRefreshIndicator()}
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        {/* 頂部工具列 */}
        <div className="flex justify-between items-center">
          <div></div>
          <button
            onClick={handleRefresh}
            disabled={loadingState.refreshing}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loadingState.refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>刷新</span>
          </button>
        </div>

      {/* 歡迎區塊 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <h1 className="text-lg sm:text-2xl font-bold mb-2">歡迎回來，{dashboardData?.salesperson?.companyName}！</h1>
        
        <p className="text-blue-100 text-xs sm:text-sm mt-1">
            今天是 {currentDate}
        </p>
      </div>

        {/* 錯誤提示（有數據時的軟錯誤） */}
        {errorState.hasError && dashboardData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800 text-sm">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>更新數據時發生錯誤，顯示的可能不是最新資料</span>
              <button
                onClick={handleRetry}
                className="ml-2 underline hover:no-underline"
              >
                重試
              </button>
            </div>
          </div>
        )}

      {/* 本月業績 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          本月業績 ({dashboardData.monthly.month})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-blue-600 mb-1">訂單總數</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-700">
              {dashboardData.monthly.total_orders} 筆
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-purple-600 mb-1">商品銷售額</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-700">
              {formatCurrency(dashboardData.monthly.subtotal_sum)}
            </p>
            <p className="text-xs text-purple-600 mt-1">分潤計算基準</p>
          </div>
        </div>

        {/* 訂單狀態分布 */}
        <div className="mt-4 sm:mt-6">
          <h3 className="text-sm sm:text-md font-medium text-gray-900 mb-2 sm:mb-3">訂單狀態分布</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <p className="text-xs sm:text-sm text-yellow-600 mb-1">未完成訂單</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-700">
                  {totalUnfinished}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <p className="text-xs sm:text-sm text-green-600 mb-1">已完成訂單</p>
              <p className="text-lg sm:text-2xl font-bold text-green-700">
                  {completedOrders}
              </p>
              </div>
            </div>
          </div>
        </div>

      {/*分潤資訊 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">分潤資訊</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-yellow-600 mb-1">待結算分潤</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-700">
              {formatCommissionAmount(dashboardData.commission.calculated)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-green-600 mb-1">已結算分潤</p>
            <p className="text-lg sm:text-2xl font-bold text-green-700">
              {formatCommissionAmount(dashboardData.commission.paid)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-blue-600 mb-1">分潤總額</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-700">
              {formatCommissionAmount(dashboardData.commission.total)}
            </p>
          </div>
        </div>
      </div>

      {/* 快速功能 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">快速功能</h2>
        
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Link 
            href="/city-sales/orders" 
            className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900">訂單管理</div>
          </Link>
          
          <Link 
            href="/city-sales/commissions" 
            className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900">分潤記錄</div>
          </Link>
          
          <Link 
            href="/city-sales/profile" 
            className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900">個人資料</div>
          </Link>

          <Link 
            href="/city-sales/qrcode" 
            className="bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-amber-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900">QR Code</div>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
} 
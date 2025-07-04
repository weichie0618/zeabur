'use client';

import React, { useState, useEffect } from 'react';
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

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { storeId } = useSalesperson();

  useEffect(() => {
    if (storeId) {
      fetchDashboardData();
    }
  }, [storeId]);

  const fetchDashboardData = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await salespersonApi.getDashboard(storeId);
      if (response.success && response.data && 
          'today' in response.data && 
          'monthly' in response.data && 
          'commission' in response.data) {
        setDashboardData(response.data as DashboardData);
      } else {
        setError(response.error || '獲取儀表板數據失敗');
      }
    } catch (err) {
      setError('獲取儀表板數據時發生錯誤');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* 歡迎區塊 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl p-4 sm:p-6 text-white shadow-lg">
        <h1 className="text-lg sm:text-2xl font-bold mb-2">歡迎回來，{dashboardData?.salesperson?.companyName }！</h1>
        
        <p className="text-blue-100 text-xs sm:text-sm mt-1">
          今天是 {new Date().toLocaleDateString('zh-TW', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

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
                {dashboardData.monthly.status_breakdown.pending +
                 dashboardData.monthly.status_breakdown.processing +
                 dashboardData.monthly.status_breakdown.shipped +
                 dashboardData.monthly.status_breakdown.cancelled}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 text-center shadow-sm">
              <p className="text-xs sm:text-sm text-green-600 mb-1">已完成訂單</p>
              <p className="text-lg sm:text-2xl font-bold text-green-700">
                {dashboardData.monthly.status_breakdown.delivered}
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
        
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
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
        </div>
      </div>
    </div>
  );
} 
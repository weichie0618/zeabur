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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* 歡迎區塊 */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl shadow-2xl shadow-blue-500/20 p-6 sm:p-8 text-white">
          {/* 裝飾性背景圖案 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  歡迎回來，{dashboardData?.salesperson?.companyName}！
                </h1>
                <p className="text-blue-100 text-sm sm:text-base opacity-90">
                  今天是 {new Date().toLocaleDateString('zh-TW', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 本月業績 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/20 p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-4"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              本月業績 ({dashboardData.monthly.month})
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-100 text-sm font-medium">訂單總數</p>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {dashboardData.monthly.total_orders} 筆
                </p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-purple-100 text-sm font-medium">商品銷售額</p>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {formatCurrency(dashboardData.monthly.subtotal_sum)}
                </p>
                <p className="text-purple-100 text-sm mt-1 opacity-90">分潤計算基準</p>
              </div>
            </div>
          </div>

          {/* 訂單狀態分布 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">訂單狀態分布</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl p-4 text-center shadow-sm">
                <p className="text-sm text-yellow-700 mb-2 font-medium">未完成訂單</p>
                <p className="text-3xl font-bold text-yellow-800">
                  {dashboardData.monthly.status_breakdown.pending +
                   dashboardData.monthly.status_breakdown.processing +
                   dashboardData.monthly.status_breakdown.shipped +
                   dashboardData.monthly.status_breakdown.cancelled}
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4 text-center shadow-sm">
                <p className="text-sm text-green-700 mb-2 font-medium">已完成訂單</p>
                <p className="text-3xl font-bold text-green-800">
                  {dashboardData.monthly.status_breakdown.delivered}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 分潤資訊 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/20 p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-4"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">分潤資訊</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-yellow-100 text-sm font-medium">待結算分潤</p>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                                 <p className="text-2xl sm:text-3xl font-bold text-white">
                   {formatCommissionAmount(dashboardData.commission.calculated)}
                 </p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-green-100 text-sm font-medium">已結算分潤</p>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                                 <p className="text-2xl sm:text-3xl font-bold text-white">
                   {formatCommissionAmount(dashboardData.commission.paid)}
                 </p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-100 text-sm font-medium">分潤總額</p>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                                 <p className="text-2xl sm:text-3xl font-bold text-white">
                   {formatCommissionAmount(dashboardData.commission.total)}
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速功能 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/20 p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-4"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">快速功能</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link 
              href="/city-sales/orders" 
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl p-4 text-center transition-all duration-300 shadow-sm hover:shadow-md border border-blue-200/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900">訂單管理</div>
              </div>
            </Link>
            
            <Link 
              href="/city-sales/commissions" 
              className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl p-4 text-center transition-all duration-300 shadow-sm hover:shadow-md border border-green-200/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900">分潤記錄</div>
              </div>
            </Link>
            
            <Link 
              href="/city-sales/profile" 
              className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl p-4 text-center transition-all duration-300 shadow-sm hover:shadow-md border border-purple-200/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900">個人資料</div>
              </div>
            </Link>
            
            <Link 
              href="/city-sales/qrcode" 
              className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-xl p-4 text-center transition-all duration-300 shadow-sm hover:shadow-md border border-indigo-200/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11a9 9 0 11-18 0 9 9 0 0118 0zm-9 8a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-gray-900">QR Code</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
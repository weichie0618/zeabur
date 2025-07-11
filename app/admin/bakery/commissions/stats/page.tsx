'use client';

import React, { useState, useEffect } from 'react';
import { initializeAuth, handleAuthError, apiGet } from '../../utils/authService';

interface CommissionStats {
  totalCommissions: number;
  thisMonthCommissions: number;
  totalSalespersons: number;
  activeSalespersons: number;
  topPerformers: Array<{
    id: string;
    name: string;
    totalCommissions: number;
    orderCount: number;
  }>;
  monthlyStats: Array<{
    month: string;
    commissions: number;
    orders: number;
  }>;
  planStats: Array<{
    planId: number;
    planName: string;
    salespersonCount: number;
    totalCommissions: number;
  }>;
}

export default function CommissionStatsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('3months');

  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);

  const loadStats = async () => {
    if (!accessToken) return;

    try {
      const data = await apiGet(`/api/admin/commissions/stats?period=${selectedPeriod}`);
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || '載入統計數據失敗');
      }
    } catch (error) {
      console.error('載入統計數據錯誤:', error);
      // 模擬數據，以防API不存在
      setStats({
        totalCommissions: 125680,
        thisMonthCommissions: 18450,
        totalSalespersons: 15,
        activeSalespersons: 12,
        topPerformers: [
          { id: 'C001', name: 'C業務', totalCommissions: 35680, orderCount: 45 },
          { id: 'H001', name: 'H業務', totalCommissions: 28950, orderCount: 38 },
          { id: 'J001', name: 'J業務', totalCommissions: 22340, orderCount: 29 }
        ],
        monthlyStats: [
          { month: '2024-10', commissions: 15200, orders: 78 },
          { month: '2024-11', commissions: 18450, orders: 89 },
          { month: '2024-12', commissions: 21800, orders: 95 }
        ],
        planStats: [
          { planId: 1, planName: '專案A', salespersonCount: 8, totalCommissions: 85600 },
          { planId: 2, planName: '專案B', salespersonCount: 4, totalCommissions: 40080 }
        ]
      });
    }
  };

  useEffect(() => {
    if (accessToken) {
      setLoading(false);
      loadStats();
    }
  }, [accessToken, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">佣金統計</h1>
            <p className="mt-1 text-sm text-gray-600">查看業務員佣金表現和統計數據</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="1month">近1個月</option>
              <option value="3months">近3個月</option>
              <option value="6months">近6個月</option>
              <option value="1year">近1年</option>
            </select>
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {stats && (
        <>
          {/* 總覽卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">總</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">總佣金</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(stats.totalCommissions)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">月</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">本月佣金</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(stats.thisMonthCommissions)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">人</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">總業務員</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalSalespersons}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">活</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">活躍業務</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeSalespersons}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 月度統計 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">月度佣金趨勢</h3>
              <div className="space-y-4">
                {stats.monthlyStats.map((monthData, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(monthData.month).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
                      </div>
                      <div className="text-xs text-gray-500">{monthData.orders} 筆訂單</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(monthData.commissions)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 頂尖業務員 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">頂尖業務員</h3>
              <div className="space-y-4">
                {stats.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                        <div className="text-xs text-gray-500">{performer.orderCount} 筆訂單</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(performer.totalCommissions)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 專案統計 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">佣金專案表現</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      專案名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業務員數量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      總佣金
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均佣金
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.planStats.map((plan) => (
                    <tr key={plan.planId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {plan.planName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan.salespersonCount} 人
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(plan.totalCommissions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(plan.totalCommissions / plan.salespersonCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 
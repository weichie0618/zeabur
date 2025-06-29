'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSalespersonAuth } from '../contexts/SalespersonAuthContext';
import { salespersonApi, SalespersonDashboard, SalespersonOrder } from '../services/api';

// 統計卡片組件
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, isLoading }) => (
  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
    {isLoading ? (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    ) : (
      <>
        <p className="text-xs sm:text-sm text-gray-500">{title}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{value}</p>
        <div className="flex items-center mt-1 sm:mt-2">
          <span className={`text-xs sm:text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
          <span className="text-gray-500 text-xs sm:text-sm ml-1">較上期</span>
        </div>
      </>
    )}
  </div>
);

// 訂單狀態中文對應
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待處理',
    'processing': '處理中',
    'shipped': '已出貨',
    'delivered': '已送達',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

// 支付狀態中文對應
const getPaymentStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待付款',
    'paid': '已付款',
    'failed': '付款失敗',
    'refunded': '已退款'
  };
  return statusMap[status] || status;
};

// 格式化金額顯示
const formatCurrency = (amount: number): string => {
  return `NT$ ${amount.toLocaleString()}`;
};

// 格式化日期顯示
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function SalesDashboard() {
  const { salespersonInfo } = useSalespersonAuth();
  const [dashboardData, setDashboardData] = useState<SalespersonDashboard | null>(null);
  const [recentOrders, setRecentOrders] = useState<SalespersonOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入儀表板數據
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 並行載入儀表板數據和最近訂單
        const [dashboard, ordersResponse] = await Promise.all([
          salespersonApi.getDashboard(),
          salespersonApi.getOrders({ limit: 5 }) // 只取最近5筆
        ]);

        setDashboardData(dashboard);
        setRecentOrders(ordersResponse.orders);

      } catch (error) {
        console.error('載入儀表板數據失敗:', error);
        setError('載入數據失敗，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // 計算統計數據
  const stats = dashboardData ? [
    { 
      title: '今日銷售額', 
      value: formatCurrency(dashboardData.today.total_amount), 
      change: '+8.5%', 
      changeType: 'positive' as const 
    },
    { 
      title: '本月訂單數', 
      value: dashboardData.monthly.total_orders.toString(), 
      change: '+4.2%', 
      changeType: 'positive' as const 
    },
    { 
      title: '本月銷售額', 
      value: formatCurrency(dashboardData.monthly.total_amount), 
      change: '+12.3%', 
      changeType: 'positive' as const 
    },
    { 
      title: '預計佣金', 
      value: formatCurrency(dashboardData.commission.calculated), 
      change: '+15.0%', 
      changeType: 'positive' as const 
    },
  ] : [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">業務儀表板</h1>
        <div className="w-full sm:w-auto flex space-x-3">
          <select className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>今日</option>
            <option>本週</option>
            <option>本月</option>
            <option>本年</option>
          </select>
        </div>
      </div>

      {/* 歡迎訊息 */}
      <div className="bg-amber-50 rounded-lg p-4 sm:p-6 border border-amber-200">
        <h2 className="text-base sm:text-lg font-medium text-amber-800">
          歡迎回來，{salespersonInfo?.storeValue || '業務夥伴'}！
        </h2>
        <p className="mt-1 text-sm text-amber-700">
          {dashboardData ? (
            <>
              今天您有 <span className="font-semibold">{dashboardData.today.total_orders}</span> 筆訂單，
              總金額 <span className="font-semibold">{formatCurrency(dashboardData.today.total_amount)}</span>。
            </>
          ) : (
            '正在載入您的業績數據...'
          )}
        </p>
      </div>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {isLoading ? (
          // 載入中的骨架屏
          Array.from({ length: 4 }).map((_, index) => (
            <StatCard
              key={index}
              title=""
              value=""
              change=""
              changeType="positive"
              isLoading={true}
            />
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
            />
          ))
        )}
      </div>

      {/* 最近訂單 - 桌面版 */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">最近訂單</h2>
          <Link href="/sales/orders" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            查看全部
          </Link>
        </div>
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單編號
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客戶
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/sales/orders/${order.id}`}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/sales/orders/${order.id}`} className="text-amber-600 hover:text-amber-900">
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            暫無最近訂單
          </div>
        )}
      </div>

      {/* 最近訂單 - 行動版 */}
      <div className="sm:hidden space-y-3">
        <div className="flex justify-between items-center px-1 py-2">
          <h2 className="text-base font-medium">最近訂單</h2>
          <Link href="/sales/orders" className="text-amber-600 hover:text-amber-700 text-xs font-medium">
            查看全部
          </Link>
        </div>
        
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))
        ) : recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <Link href={`/sales/orders/${order.id}`} className="text-amber-600 font-medium text-sm">
                  {order.order_number}
                </Link>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">客戶:</span>
                  <span className="text-gray-900">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">日期:</span>
                  <span className="text-gray-900">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">金額:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-100">
                <Link href={`/sales/orders/${order.id}`} className="text-amber-600 text-xs font-medium">
                  查看詳情
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            暫無最近訂單
          </div>
        )}
      </div>

      {/* 佣金概覽 */}
      {dashboardData && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">佣金概覽</h2>
            <Link href="/sales/commissions" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              查看詳情
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(dashboardData.commission.calculated)}
              </div>
              <div className="text-sm text-gray-500">已計算佣金</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboardData.commission.paid)}
              </div>
              <div className="text-sm text-gray-500">已支付佣金</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(dashboardData.commission.total)}
              </div>
              <div className="text-sm text-gray-500">總佣金</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
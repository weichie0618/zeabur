'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSalespersonAuth } from '../contexts/SalespersonAuthContext';
import { salespersonApi, SalespersonOrder } from '../services/api';

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

// 出貨狀態中文對應
const getShippingStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待出貨',
    'shipped': '已出貨',
    'delivered': '已送達',
    'returned': '已退回'
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

export default function OrdersPage() {
  const { salespersonInfo } = useSalespersonAuth();
  const [orders, setOrders] = useState<SalespersonOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // 篩選狀態
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  // 載入訂單數據
  const loadOrders = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: 20
      };

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await salespersonApi.getOrders(params);
      setOrders(response.orders);
      setCurrentPage(page);
      setTotalPages(response.pagination.totalPages);
      setTotalOrders(response.pagination.total);

    } catch (error) {
      console.error('載入訂單失敗:', error);
      setError('載入訂單失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 處理篩選
  const handleFilter = () => {
    setCurrentPage(1);
    loadOrders(1);
  };

  // 重置篩選
  const handleResetFilter = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    loadOrders(1);
  };

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
            onClick={() => loadOrders()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            {salespersonInfo?.storeValue} • 總計 {totalOrders} 筆訂單
          </p>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">篩選條件</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              訂單狀態
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">全部狀態</option>
              <option value="pending">待處理</option>
              <option value="processing">處理中</option>
              <option value="shipped">已出貨</option>
              <option value="delivered">已送達</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始日期
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              結束日期
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 transition-colors"
            >
              篩選
            </button>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 訂單統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: '全部訂單', value: totalOrders, color: 'bg-gray-100 text-gray-800' },
          { label: '待處理', value: orders.filter(o => o.status === 'pending').length, color: 'bg-yellow-100 text-yellow-800' },
          { label: '處理中', value: orders.filter(o => o.status === 'processing').length, color: 'bg-blue-100 text-blue-800' },
          { label: '已出貨', value: orders.filter(o => o.status === 'shipped').length, color: 'bg-purple-100 text-purple-800' },
          { label: '已送達', value: orders.filter(o => o.status === 'delivered').length, color: 'bg-green-100 text-green-800' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4">
            <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stat.color}`}>
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 訂單表格 - 桌面版 */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">訂單列表</h2>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
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
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單編號
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客戶資訊
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    付款狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出貨狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/sales/orders/${order.id}`}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-gray-500 text-xs">{order.customer_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{formatCurrency(order.total_amount)}</div>
                      {order.subtotal !== order.total_amount && (
                        <div className="text-xs text-gray-500">小計: {formatCurrency(order.subtotal)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                        order.payment_status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getPaymentStatusText(order.payment_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.shipping_status === 'returned' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getShippingStatusText(order.shipping_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
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
            暫無訂單記錄
          </div>
        )}
      </div>

      {/* 訂單卡片 - 手機版 */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-3">
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
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <Link href={`/sales/orders/${order.id}`} className="text-amber-600 font-medium text-sm">
                  {order.order_number}
                </Link>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">客戶:</span>
                  <span className="text-gray-900">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">電話:</span>
                  <span className="text-gray-900">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">金額:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">付款:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                    order.payment_status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getPaymentStatusText(order.payment_status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">出貨:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.shipping_status === 'returned' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getShippingStatusText(order.shipping_status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">日期:</span>
                  <span className="text-gray-900">{formatDate(order.created_at)}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link href={`/sales/orders/${order.id}`} className="text-amber-600 text-sm font-medium">
                  查看詳情
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            暫無訂單記錄
          </div>
        )}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => loadOrders(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => loadOrders(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => loadOrders(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
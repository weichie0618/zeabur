'use client';

import React, { useState, useEffect } from 'react';
import { useSalesperson } from '../context/SalespersonContext';
import { 
  salespersonApi, 
  Order, 
  OrdersResponse, 
  formatCurrency, 
  formatDateTime,
  orderStatusMap,
  paymentStatusMap 
} from '../services/apiService';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // 篩選狀態
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    period: '', // 新增期間篩選
  });

  const { storeId } = useSalesperson();

  // 計算期間日期的函數
  const calculatePeriodDates = (period: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    const day = today.getDay();

    let startDate = '';
    let endDate = '';

    switch (period) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(date - day + (day === 0 ? -6 : 1)); // 週一開始
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        startDate = startOfWeek.toISOString().split('T')[0];
        endDate = endOfWeek.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(year, month, 1).toISOString().split('T')[0];
        endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        endDate = new Date(year, month, 0).toISOString().split('T')[0];
        break;
      case 'custom':
        // 保持現有的日期設定
        return { startDate: filters.startDate, endDate: filters.endDate };
      default:
        return { startDate: '', endDate: '' };
    }

    return { startDate, endDate };
  };

  useEffect(() => {
    if (storeId) {
      fetchOrders();
    }
  }, [storeId, pagination.page, filters]);

  const fetchOrders = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      // 根據期間計算日期
      let actualStartDate = filters.startDate;
      let actualEndDate = filters.endDate;

      if (filters.period && filters.period !== 'custom') {
        const periodDates = calculatePeriodDates(filters.period);
        actualStartDate = periodDates.startDate;
        actualEndDate = periodDates.endDate;
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(actualStartDate && { startDate: actualStartDate }),
        ...(actualEndDate && { endDate: actualEndDate }),
      };

      const response = await salespersonApi.getOrders(storeId, params);
      
      if (response.success && response.data) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || '獲取訂單數據失敗');
      }
    } catch (err) {
      setError('獲取訂單時發生錯誤');
      console.error('Orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'period') {
      if (value !== 'custom') {
        // 如果選擇的不是自訂期間，清空日期欄位
        setFilters(prev => ({ 
          ...prev, 
          [key]: value,
          startDate: '',
          endDate: ''
        }));
      } else {
        setFilters(prev => ({ ...prev, [key]: value }));
      }
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一頁
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">訂單管理</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center justify-center border border-gray-300 text-sm sm:text-base"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            篩選條件
          </button>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新整理
          </button>
        </div>
      </div>

      {/* 篩選器 */}
      <div className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 ${isFilterExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">篩選條件</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                訂單狀態
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                期間
              </label>
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="">全部期間</option>
                <option value="today">本日</option>
                <option value="thisWeek">本周</option>
                <option value="thisMonth">本月</option>
                <option value="lastMonth">上個月</option>
                <option value="custom">自訂期間</option>
              </select>
            </div>

            {filters.period === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    結束日期
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* 訂單列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            訂單列表 ({pagination.total} 筆)
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <svg className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-gray-500 text-sm sm:text-base">目前沒有訂單資料</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                          {order.order_number}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeColor(order.payment_status)}`}>
                            {paymentStatusMap[order.payment_status] || order.payment_status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {orderStatusMap[order.status] || order.status}
                          </span>
                          
                        </div>
                      </div>
                      {/* 訂單資訊 */}
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">客戶：</span>{order.customer_name ? order.customer_name.charAt(0) + '*'.repeat(Math.max(order.customer_name.length - 1, 1)) : '***'}</p>
                        <p><span className="font-medium">電話：</span>{order.customer_phone ? order.customer_phone.slice(0, 4) + '*'.repeat(Math.max(order.customer_phone.length - 4, 4)) : '****'}</p>
                        <p><span className="font-medium">Email：</span>{order.customer_email ? order.customer_email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '***@***.com'}</p>
                        <p><span className="font-medium">訂單時間：</span>{formatDateTime(order.created_at)}</p>
                      </div>
                    </div>

                    <div className="text-right ml-3">
                      <div className="text-lg sm:text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(order.subtotal)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        小計：{formatCurrency(order.subtotal)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        項目：{order.orderItems?.length || 0} 項
                      </div>
                    </div>
                  </div>

                  {/* 訂單項目 */}
                  {order.orderItems && order.orderItems.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          const element = document.getElementById(`order-items-${order.id}`);
                          if (element) {
                            element.classList.toggle('hidden');
                          }
                        }}
                        className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-gray-900 mb-2 hover:text-blue-600"
                      >
                        <span>訂單項目：{order.orderItems.length} 項</span>
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div id={`order-items-${order.id}`} className="space-y-2 hidden">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-600">
                              {item.product_name} × {item.quantity}
                              {item.order_item_notes && (
                                <span className="text-gray-400 ml-2">({item.order_item_notes})</span>
                              )}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分頁 */}
        {pagination.totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                顯示 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} 筆，
                共 {pagination.total} 筆
              </div>
              
              <div className="flex justify-center sm:justify-end">
                <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 whitespace-nowrap"
                  >
                    上一頁
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === pagination.totalPages || 
                      Math.abs(page - pagination.page) <= 1
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-lg ${
                            page === pagination.page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 whitespace-nowrap"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
} 
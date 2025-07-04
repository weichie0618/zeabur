'use client';

import React, { useState, useEffect } from 'react';
import { useSalesperson } from '../context/SalespersonContext';
import { 
  salespersonApi, 
  Commission, 
  formatCurrency, 
  formatDateTime,
  commissionStatusMap 
} from '../services/apiService';

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // 篩選狀態
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    period: '',
    orderNumber: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
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
        return { startDate: filters.startDate, endDate: filters.endDate };
      default:
        return { startDate: '', endDate: '' };
    }

    return { startDate, endDate };
  };

  useEffect(() => {
    if (storeId) {
      fetchCommissions();
    }
  }, [storeId, pagination.page, filters]);

  const fetchCommissions = async () => {
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
        ...(filters.orderNumber && { orderNumber: filters.orderNumber }),
        ...(filters.minAmount && { minAmount: Number(filters.minAmount) }),
        ...(filters.maxAmount && { maxAmount: Number(filters.maxAmount) }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const response = await salespersonApi.getCommissions(storeId, params);
      
      if (response.success && response.data) {
        setCommissions(response.data.commissions);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || '獲取佣金數據失敗');
      }
    } catch (err) {
      setError('獲取佣金記錄時發生錯誤');
      console.error('Commissions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'period') {
      if (value !== 'custom') {
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
      case 'calculated':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && commissions.length === 0) {
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">佣金記錄</h1>
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
            onClick={fetchCommissions}
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
      <div className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 ${isFilterExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">篩選條件</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                佣金狀態
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">全部狀態</option>
                <option value="calculated">待結算</option>
                <option value="paid">已結算</option>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                訂單編號
              </label>
              <input
                type="text"
                value={filters.orderNumber}
                onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
                placeholder="輸入訂單編號"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                佣金金額範圍
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="最小金額"
                  className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="最大金額"
                  className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序方式
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-2/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="created_at">建立時間</option>
                  <option value="amount">佣金金額</option>
                  <option value="status">狀態</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-1/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="DESC">降序</option>
                  <option value="ASC">升序</option>
                </select>
              </div>
            </div>
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
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* 佣金列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            佣金列表 ({pagination.total} 筆)
          </h2>
        </div>

        {commissions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <svg className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-sm sm:text-base">目前沒有佣金記錄</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {commissions.map((commission) => (
              <div key={commission.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                          訂單 #{commission.order_number}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(commission.status)}`}>
                            {commissionStatusMap[commission.status] || commission.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* 佣金資訊 */}
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">建立時間：</span>{formatDateTime(commission.created_at)}</p>
                        <p><span className="font-medium">佣金比例：</span>{commission.rate}%</p>
                        {commission.notes && <p><span className="font-medium">備註：</span>{commission.notes}</p>}
                      </div>
                    </div>

                    <div className="text-right ml-3">
                      <div className="text-lg sm:text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(commission.amount)}
                      </div>
                      {commission.order && (
                        <div className="text-xs sm:text-sm text-gray-600">
                          訂單金額：{formatCurrency(commission.order.subtotal)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 訂單狀態 */}
                  {commission.order && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-600">
                          訂單狀態：{commission.order.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          付款狀態：{commission.order.payment_status}
                        </span>
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
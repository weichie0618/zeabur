'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSalespersonAuth } from '../contexts/SalespersonAuthContext';
import { salespersonApi, CommissionRecord, CommissionRule } from '../services/api';

// 佣金狀態中文對應
const getCommissionStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'calculated': '已計算',
    'paid': '已支付',
    'cancelled': '已取消'
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

// 格式化百分比
const formatPercentage = (rate: number): string => {
  return `${rate}%`;
};

export default function CommissionsPage() {
  const { salespersonInfo } = useSalespersonAuth();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // 載入佣金數據
  const loadCommissions = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: 20
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }

      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }

      const response = await salespersonApi.getCommissions(params);
      setCommissions(response.commissions);
      setCurrentPage(page);
      setTotalPages(response.pagination.totalPages);

    } catch (error) {
      console.error('載入佣金記錄失敗:', error);
      setError('載入佣金記錄失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 載入佣金規則
  const loadCommissionRules = async () => {
    try {
      const response = await salespersonApi.getCommissionRules();
      setCommissionRules(response.rules);
    } catch (error) {
      console.error('載入佣金規則失敗:', error);
    }
  };

  useEffect(() => {
    loadCommissions();
    loadCommissionRules();
  }, []);

  // 處理篩選
  const handleFilter = () => {
    setCurrentPage(1);
    loadCommissions(1);
  };

  // 重置篩選
  const handleResetFilter = () => {
    setStatusFilter('');
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
    loadCommissions(1);
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
            onClick={() => loadCommissions()}
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
        <h1 className="text-2xl font-bold text-gray-900">佣金記錄</h1>
        <div className="text-sm text-gray-600">
          {salespersonInfo?.storeValue}
        </div>
      </div>

      {/* 佣金規則概覽 */}
      {commissionRules.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">適用的佣金規則</h2>
          <div className="space-y-4">
            {commissionRules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{rule.name}</h3>
                  <span className="text-sm text-gray-500">
                    {rule.rule_type === 'fixed' ? '固定比例' : '階梯式'}
                  </span>
                </div>
                
                {rule.description && (
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                )}

                {rule.rule_type === 'fixed' && rule.fixed_rate && (
                  <div className="bg-amber-50 p-3 rounded">
                    <div className="text-sm font-medium text-amber-800">
                      固定佣金比例: {formatPercentage(rule.fixed_rate)}
                    </div>
                  </div>
                )}

                {rule.rule_type === 'tiered' && rule.tiered_rules && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm font-medium text-blue-800 mb-2">階梯式佣金:</div>
                    <div className="space-y-1">
                      {rule.tiered_rules.map((tier, index) => (
                        <div key={index} className="text-xs text-blue-700">
                          {formatCurrency(tier.min_amount)} - {tier.max_amount ? formatCurrency(tier.max_amount) : '無上限'}: {formatPercentage(tier.rate)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                  <span>生效日期: {rule.effective_date}</span>
                  {rule.expiry_date && (
                    <span>失效日期: {rule.expiry_date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 篩選器 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">篩選條件</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              狀態
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">全部狀態</option>
              <option value="calculated">已計算</option>
              <option value="paid">已支付</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始日期
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              結束日期
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
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

      {/* 佣金記錄表格 - 桌面版 */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">佣金記錄</h2>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
        ) : commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單編號
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    佣金金額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    佣金比例
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備註
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/sales/orders/${commission.order_id}`}>
                        {commission.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(commission.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(commission.rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                        commission.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getCommissionStatusText(commission.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(commission.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {commission.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            暫無佣金記錄
          </div>
        )}
      </div>

      {/* 佣金記錄列表 - 行動版 */}
      <div className="sm:hidden space-y-3">
        <h2 className="text-lg font-medium text-gray-900 px-1">佣金記錄</h2>
        
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
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
        ) : commissions.length > 0 ? (
          commissions.map((commission) => (
            <div key={commission.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <Link href={`/sales/orders/${commission.order_id}`} className="text-amber-600 font-medium text-sm">
                  {commission.order_number}
                </Link>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                  commission.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getCommissionStatusText(commission.status)}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">佣金金額:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(commission.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">佣金比例:</span>
                  <span className="text-gray-900">{formatPercentage(commission.rate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">日期:</span>
                  <span className="text-gray-900">{formatDate(commission.created_at)}</span>
                </div>
                {commission.notes && (
                  <div className="mt-2">
                    <span className="text-gray-500">備註:</span>
                    <p className="text-gray-900 text-xs mt-1">{commission.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            暫無佣金記錄
          </div>
        )}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => loadCommissions(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => loadCommissions(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => loadCommissions(currentPage + 1)}
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
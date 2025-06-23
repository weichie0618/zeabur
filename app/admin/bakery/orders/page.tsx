'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExportOrdersModal from './export/ExportOrdersModal';
import { fetchOrdersForExport } from './export/exportService';

// 引入類型
import { Order, OrdersResponse, EditOrderForm } from './types';

// 引入API服務
import { fetchOrders, fetchCustomers, cancelOrder, updateOrderStatus } from './api';

// 引入常量
import { statusMap, reverseStatusMap } from './constants';

// 引入狀態處理
import { getStatusDisplay, getStatusClass, canCancelOrder } from './status';

// 引入工具函數
import { 
  initializeAuth, 
  handleAuthError, 
  handleRelogin, 
  setupAuthWarningAutoHide,
  formatCurrency,
  formatDate,
  getAuthHeaders
} from './utils';

// 引入共用組件
import AuthWarning from './components/AuthWarning';
import OrderFilters from './components/OrderFilters';
import Pagination from './components/Pagination';
import StatusUpdateModal from './components/StatusUpdateModal';

// 引入共用 Hook
import { useOrderStatusUpdate } from './hooks/useOrderStatusUpdate';

export default function OrdersManagement() {
  // 狀態
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [companyNameFilter, setCompanyNameFilter] = useState<string>('');
  const [customers, setCustomers] = useState<Array<{id: string, companyName: string}>>([]);
  const [limit] = useState<number>(10);
  const [accessToken, setAccessToken] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 添加自定義日期範圍狀態
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);
  
  // 狀態更新相關變數
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  
  // 使用共用的狀態更新 Hook
  const { updateStatus, loading: statusUpdateLoading } = useOrderStatusUpdate({
    accessToken,
    onSuccess: (message) => {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
      setShowStatusUpdate(false);
      handleFetchOrders(currentPage); // 重新獲取訂單列表
    },
    onError: (error) => {
      setError(error);
    }
  });

  const router = useRouter();
  
  // 監聽日期篩選變更，控制自定義日期範圍的顯示
  useEffect(() => {
    setShowCustomDateRange(dateFilter === 'custom');
    
    // 如果不是自定義日期範圍，重置日期
    if (dateFilter !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else {
      // 設置默認自定義日期範圍（如果為空）
      if (!startDate) {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      }
    }
  }, [dateFilter]);

  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 初始化獲取認證令牌
  useEffect(() => {
    console.log('開始初始化認證流程');
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);

  // 第一次載入時獲取訂單數據和客戶列表
  useEffect(() => {
    // 確保已獲取到token後再發起請求
    if (accessToken) {
      console.log('accessToken 已設置，準備獲取訂單');
      handleFetchOrders();
      // 獲取客戶列表以供篩選
      handleFetchCustomers();
    } else {
      console.warn('useEffect: 暫時缺少accessToken，等待獲取中...');
    }
  }, [accessToken]);

  // 獲取客戶列表
  const handleFetchCustomers = async () => {
    try {
      const customersData = await fetchCustomers(accessToken);
      setCustomers(customersData);
      console.log(`已載入 ${customersData.length} 個客戶公司`);
    } catch (err) {
      console.error('獲取客戶列表錯誤:', err);
      // 不顯示錯誤，因為這不是核心功能
    }
  };

  // 處理搜尋
  const handleFilter = () => {
    if (!accessToken) {
      console.error('執行搜尋時缺少認證令牌');
      setError('認證失敗，請重新登入系統');
      return;
    }
    handleFetchOrders(1);
  };

  // 獲取訂單列表
  const handleFetchOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null); // 清除之前的錯誤
      
      // 構建過濾條件
      const filters = {
        searchQuery,
        statusFilter,
        dateFilter,
        companyNameFilter,
        startDate,
        endDate
      };
      
      const response = await fetchOrders(accessToken, page, limit, filters);
      
      setOrders(response.orders);
      setTotalOrders(response.total || 0);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.page || 1);
      
      setLoading(false);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(err.message || '獲取訂單時出錯，請重試或聯繫技術支持');
        setLoading(false);
      }
      console.error('獲取訂單錯誤:', err);
    }
  };

  // 處理分頁
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    handleFetchOrders(page);
  };

  // 處理取消訂單
  const handleCancelOrder = async (orderId: string) => {
    if (!accessToken) {
      setError('認證失敗，請重新登入系統');
      return;
    }

    try {
      setLoading(true);
      
      await cancelOrder(accessToken, orderId);
      
      // 顯示成功訊息
      setSuccess('訂單已成功取消');
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      // 重新獲取最新訂單資料
      handleFetchOrders(currentPage);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(err.message || '取消訂單失敗');
        setLoading(false);
      }
      console.error('取消訂單錯誤:', err);
    }
  };

  // 渲染操作按鈕
  const renderActionButtons = (order: Order) => {
    return (
      <div className="flex space-x-3">
        <Link 
          href={`/admin/bakery/orders/${order.order_number}`}
          className="text-blue-600 hover:text-blue-900"
        >
          詳情
        </Link>
        <Link 
          href={`/admin/bakery/orders/edit/${order.order_number}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          編輯
        </Link>
        <button 
          onClick={() => handleOpenStatusUpdate(order)}
          className="text-amber-600 hover:text-amber-900"
        >
          狀態
        </button>
      </div>
    );
  };
  
  // 匯出訂單功能
  const handleExportOrders = () => {
    setShowExportModal(true);
  };
  
  // 獲取匯出數據
  const fetchExportData = async (exportAll: boolean) => {
    if (!accessToken) {
      throw new Error('認證失敗，請重新登入系統');
    }
    
    // 調用匯出服務
    return await fetchOrdersForExport(
      {
        searchQuery,
        statusFilter,
        dateFilter,
        companyNameFilter,
        startDate,
        endDate
      },
      exportAll,
      () => getAuthHeaders(accessToken)
    );
  };

  // 開啟更新訂單狀態模態視窗
  const handleOpenStatusUpdate = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusUpdate(true);
  };

  // 更新訂單狀態 - 使用共用 Hook
  const handleUpdateStatus = async (status: string, note: string) => {
    if (!selectedOrder) return;
    
    await updateStatus(selectedOrder, status, note);
  };

  return (
    <div className="space-y-6">
      {/* 認證警告組件 */}
      <AuthWarning 
        showWarning={!!(showAuthWarning && error?.includes('認證'))} 
        onClose={() => setShowAuthWarning(false)}
        message="未獲取到認證令牌，請重新登入系統"
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
        <button 
          className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={handleExportOrders}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          匯出訂單
        </button>
      </div>

      {/* 過濾器組件 */}
      <OrderFilters
        onFilter={handleFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        companyNameFilter={companyNameFilter}
        setCompanyNameFilter={setCompanyNameFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        customers={customers}
        showCustomDateRange={showCustomDateRange}
      />

      {/* 錯誤訊息顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">發生錯誤</p>
                <p>{error}</p>
                {error.includes('網絡') && (
                  <p className="text-sm mt-1">建議檢查您的網絡連接，或重新整理頁面再試。</p>
                )}
                {error.includes('認證') && (
                  <p className="text-sm mt-1">您的登入可能已過期，請嘗試重新登入後再訪問此頁面。</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setError(null)}
                className="text-sm hover:text-red-900"
              >
                關閉
              </button>
              {error.includes('認證失敗') && (
                <button
                  onClick={() => handleRelogin()}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  重新登入
                </button>
              )}
              {!error.includes('認證失敗') && (
                <button
                  onClick={() => {
                    setError(null);
                    handleFetchOrders();
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  重試
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 成功訊息顯示 */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          <div className="flex justify-between">
            <p>{success}</p>
            <button
              onClick={() => setSuccess('')}
              className="text-sm hover:text-green-900"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 訂單表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-amber-600 border-r-2 border-amber-600 border-b-2 border-amber-600 border-l-2 border-gray-200"></div>
            <p className="mt-2 text-gray-600">載入訂單中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-600">
            <p>沒有找到符合條件的訂單</p>
          </div>
        ) : (
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
                  客戶業主
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總金額
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/admin/bakery/orders/${order.order_number}`}>
                        {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-500">{order.salesperson?.id}</div>
                      <div className="text-sm font-medium text-gray-900">{order.salesperson?.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusClass(order.status)}>
                        {getStatusDisplay(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderActionButtons(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        
        {/* 分頁控制 */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalOrders}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* 匯出訂單模態窗 */}
      <ExportOrdersModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filters={{
          searchQuery,
          statusFilter,
          dateFilter,
          companyNameFilter,
          startDate,
          endDate
        }}
        fetchExportData={fetchExportData}
      />

      {/* 更新訂單狀態模態視窗 */}
      <StatusUpdateModal
        isOpen={showStatusUpdate}
        onClose={() => setShowStatusUpdate(false)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        loading={statusUpdateLoading}
      />
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { 
  initializeAuth,
  getAuthHeaders,
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide,
  getStatusDisplay,
  getStatusClass
} from '../utils/authService';

// 定義資料介面
interface Order {
  id: string | number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  created_at: string;
  total_amount: number | string;
  subtotal: number | string;
  
  salesperson_id?: string;
  salesperson?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    location: string;
  };
}

interface CompanyInfo {
  id: number | string;
  name: string;
  companyName: string;
}

interface SalesStatistics {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalSubtotal: number;
  companyStats: Record<string, {
    sales: number;
    orders: number;
    products: number;
  }>;
  salesPersonStats: Record<string, {
    id: string;
    companyName?: string;
    sales: number;
    orders: number;
    products: number;
    subtotal: number;
  }>;
}

// 初始統計狀態
const initialStatistics: SalesStatistics = {
  totalSales: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalSubtotal: 0,
  companyStats: {},
  salesPersonStats: {}
};

export default function PerformanceReport() {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 篩選條件
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('');
  const [salesPersons, setSalesPersons] = useState<CompanyInfo[]>([]);

  // 日期範圍
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);

  // 統計數據
  const [statistics, setStatistics] = useState<SalesStatistics>(initialStatistics);

  // 匯出預覽相關
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [selectedAll, setSelectedAll] = useState<boolean>(false);
  const [selectedStats, setSelectedStats] = useState<Record<string, boolean>>({});

  // 初始化認證
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 處理認證錯誤
  const handleAuthErrorLocal = (errorMessage: string) => {
    handleAuthError(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleReloginLocal = () => {
    handleRelogin();
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);

  // 監聽日期篩選變更，控制自定義日期範圍的顯示
  useEffect(() => {
    setShowCustomDateRange(dateFilter === 'custom');
    
    // 如果不是自定義日期範圍，重置日期
    if (dateFilter !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else if (dateFilter === 'custom' && !startDate) {
      // 設置默認自定義日期範圍（如果為空）
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      setStartDate(lastMonth.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [dateFilter, startDate]);

  // 計算業務統計數據 - 使用 useCallback 優化
  const calculateStatistics = useCallback((orders: Order[]) => {
    if (!orders || orders.length === 0) {
      setStatistics(initialStatistics);
      return;
    }

    const stats: SalesStatistics = {
      totalSales: 0,
      totalOrders: orders.length,
      totalProducts: 0,
      totalSubtotal: 0,
      companyStats: {},
      salesPersonStats: {}
    };

    try {
      orders.forEach(order => {
        // 安全地將字符串轉換為數字
        const totalAmount = typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) || 0
          : order.total_amount || 0;
        
        const subtotalAmount = typeof order.subtotal === 'string'
          ? parseInt(order.subtotal, 10) || 0
          : (typeof order.subtotal === 'number' ? Math.floor(order.subtotal) : 0);
        
        // 累計總銷售額和總小計
        stats.totalSales += isNaN(totalAmount) ? 0 : totalAmount;
        stats.totalSubtotal += isNaN(subtotalAmount) ? 0 : subtotalAmount;
        
        // 按公司統計
        const companyName = order.salesperson?.companyName || '未知公司';
        if (!stats.companyStats[companyName]) {
          stats.companyStats[companyName] = {
            sales: 0,
            orders: 0,
            products: 0
          };
        }
        
        stats.companyStats[companyName].sales += isNaN(totalAmount) ? 0 : totalAmount;
        stats.companyStats[companyName].orders += 1;
        
        // 按業務人員ID統計
        const salesPersonId = order.salesperson_id || (order.salesperson?.id || '無業務');
        if (!stats.salesPersonStats[salesPersonId]) {
          stats.salesPersonStats[salesPersonId] = {
            id: salesPersonId,
            companyName: order.salesperson?.companyName,
            sales: 0,
            orders: 0,
            products: 0,
            subtotal: 0
          };
        }
        
        stats.salesPersonStats[salesPersonId].sales += isNaN(totalAmount) ? 0 : totalAmount;
        stats.salesPersonStats[salesPersonId].orders += 1;
        stats.salesPersonStats[salesPersonId].subtotal += isNaN(subtotalAmount) ? 0 : subtotalAmount;
      });

      setStatistics(stats);
    } catch (error) {
      console.error('計算統計數據錯誤:', error);
      setStatistics(initialStatistics);
    }
  }, []);

  // 獲取銷售人員列表 - 使用 useCallback 優化
  const fetchSalesPersons = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/customers?limit=100&sortBy=companyName&order=ASC', {
        headers: getAuthHeaders(accessToken),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthErrorLocal('獲取客戶數據時認證失敗');
        return;
      }

      if (!response.ok) {
        console.error('API 請求失敗:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      let customersWithCompany: CompanyInfo[] = [];
      
      // 檢查數據結構並進行適當處理
      if (data?.status === 'success' && data?.data?.lineUsers) {
        // 適用於 lineusers API
        customersWithCompany = data.data.lineUsers
          .filter((user: any) => user.customer && user.customer.companyName)
          .map((user: any) => ({
            id: user.id,
            name: user.name || user.displayName || '未知',
            companyName: user.customer?.companyName || '未知公司'
          }));
      } else if (data && Array.isArray(data.data)) {
        // 舊 API 格式 { data: [...customers] }
        customersWithCompany = data.data
          .filter((customer: any) => customer.companyName && customer.companyName.trim() !== '')
          .map((customer: any) => ({
            id: customer.id || '',
            name: customer.name || '未知',
            companyName: customer.companyName || '未知公司'
          }));
      } else if (data && Array.isArray(data.customers)) {
        // 另一種可能的格式 { customers: [...] }
        customersWithCompany = data.customers
          .filter((customer: any) => customer.companyName)
          .map((customer: any) => ({
            id: customer.id,
            name: customer.name || '未知',
            companyName: customer.companyName || '未知公司'
          }));
      } else {
        console.error('獲取客戶數據失敗: 未知的數據格式', data);
        setSalesPersons([]);
        return;
      }
      
      // 去除重複的公司名稱
      const uniqueCompanies: CompanyInfo[] = Array.from(
        new Map(customersWithCompany.map(item => [item.companyName, item]))
      ).map(([_, customer]) => customer);
      
      setSalesPersons(uniqueCompanies);
    } catch (error) {
      console.error('獲取客戶數據出錯:', error);
      setSalesPersons([]);
    }
  }, [accessToken]);

  // 獲取訂單數據 - 使用 useCallback 優化
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!accessToken) {
        setShowAuthWarning(true);
        setLoading(false);
        return;
      }

      // 構建查詢參數
      const params = new URLSearchParams({
        fetchAll: 'true'
      });
      
      // 添加可選過濾條件
      if (statusFilter) {
        params.append('status', statusFilter.toLowerCase());
      }
      
      // 處理搜尋查詢
      if (searchQuery) {
        const trimmedQuery = searchQuery.trim();
        // 檢查是否為訂單號格式
        if (/^ORD\d+$/.test(trimmedQuery)) {
          params.append('order_number', trimmedQuery);
        } else if (trimmedQuery.includes('@')) {
          // 可能是電子郵件
          params.append('customer_email', trimmedQuery);
        } else if (/^[0-9-]+$/.test(trimmedQuery)) {
          // 可能是電話號碼
          params.append('customer_phone', trimmedQuery);
        } else {
          // 視為客戶名稱或公司名稱
          params.append('companyName', trimmedQuery);
        }
      }
      
      // 處理日期過濾
      if (dateFilter) {
        if (['today', 'yesterday', 'this_month', 'last_month'].includes(dateFilter)) {
          params.append('date_range', dateFilter);
        } else if (dateFilter === 'custom') {
          // 自定義日期範圍
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
        }
      }
      
      // 添加銷售人員過濾
      if (salesPersonFilter) {
        params.append('salespersonId', salesPersonFilter);
      }
      
      // 添加排序參數
      params.append('sortBy', 'created_at');
      params.append('sortOrder', 'desc');
      
      // 發送請求獲取訂單數據
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAuthHeaders(accessToken),
        credentials: 'include',
      });
      
      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthErrorLocal('獲取訂單數據時認證失敗');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotalOrders(data.total || data.orders.length);
        calculateStatistics(data.orders);
      } else {
        setError(data.message || '獲取訂單數據失敗');
        setOrders([]);
        setStatistics(initialStatistics);
      }
    } catch (error: any) {
      setError(error.message || '獲取訂單數據時發生錯誤');
      setOrders([]);
      setStatistics(initialStatistics);
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, searchQuery, dateFilter, startDate, endDate, salesPersonFilter, calculateStatistics]);

  // 獲取銷售人員列表
  useEffect(() => {
    if (accessToken) {
      fetchSalesPersons();
    }
  }, [accessToken, fetchSalesPersons]);

  // 從API獲取所有訂單資料 - 只在初次載入時執行，不隨篩選條件變化而自動更新
  useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken]); // 移除 fetchOrders 依賴，避免篩選條件變更時自動觸發

  // 處理變更過濾條件
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(e.target.value);
  };
  
  const handleSalesPersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSalesPersonFilter(e.target.value);
  };

  // 處理過濾並獲取訂單
  const handleFilter = () => {
    fetchOrders();
  };

  // 處理打開匯出預覽模態框
  const handleOpenExportModal = () => {
    // 初始化所有業務人員統計為已選中
    const initialSelectedStats: Record<string, boolean> = {};
    sortedSalesPersonStats.forEach(stat => {
      initialSelectedStats[stat.id] = true;
    });
    setSelectedStats(initialSelectedStats);
    setSelectedAll(true);
    setShowExportModal(true);
  };

  // 處理關閉匯出預覽模態框
  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // 處理全選或取消全選
  const handleSelectAll = () => {
    const newSelectedAll = !selectedAll;
    setSelectedAll(newSelectedAll);
    
    const newSelectedStats: Record<string, boolean> = {};
    sortedSalesPersonStats.forEach(stat => {
      newSelectedStats[stat.id] = newSelectedAll;
    });
    setSelectedStats(newSelectedStats);
  };

  // 處理選擇單個業務人員
  const handleSelectStat = (id: string) => {
    const newSelectedStats = { ...selectedStats };
    newSelectedStats[id] = !newSelectedStats[id];
    setSelectedStats(newSelectedStats);
    
    // 檢查是否所有項目都被選中
    const allSelected = sortedSalesPersonStats.every(stat => newSelectedStats[stat.id]);
    setSelectedAll(allSelected);
  };

  // 處理Excel匯出
  const handleExportExcel = () => {
    try {
      setExportLoading(true);
      
      // 準備匯出數據
      const exportData = [
        // 表頭
        ['業務統計報表', `期間: ${formatDateRange()}`, '', '', '']
      ];
      
      // 添加整體統計數據 - 只保留總銷售額
      exportData.push(['總覽', '', '', '', '']);
      exportData.push(['銷售額(不含運費)', '', '', '', '']);
      exportData.push([
        statistics.totalSubtotal.toLocaleString(),
        '', '', '', ''
      ]);
      
      // 添加空行
      exportData.push(['', '', '', '', '']);
      
      // 添加各業務人員統計數據
      exportData.push(['各業務人員統計', '', '', '', '']);
      exportData.push(['業務ID', '公司名稱', '訂單數', '銷售額', '銷售額(不含運費)']);
      
      // 只匯出選中的業務人員統計
      sortedSalesPersonStats
        .filter(stats => selectedStats[stats.id])
        .forEach((stats) => {
          exportData.push([
            stats.id,
            stats.companyName || '-',
            stats.orders.toString(),
            stats.sales.toLocaleString(),
            stats.subtotal.toLocaleString()
          ]);
        });
      
      // 創建工作表
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      // 設置列寬
      const colWidths = [
        { wch: 20 }, // A
        { wch: 20 }, // B
        { wch: 15 }, // C
        { wch: 20 }, // D
        { wch: 20 }  // E
      ];
      ws['!cols'] = colWidths;
      
      // 創建工作簿並添加工作表
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '業務統計報表');
      
      // 生成文件名
      const now = new Date();
      const fileName = `業務統計報表_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`;
      
      // 匯出Excel
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('匯出Excel錯誤:', error);
      alert('匯出Excel時發生錯誤');
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  // 格式化日期範圍顯示
  const formatDateRange = () => {
    switch (dateFilter) {
      case 'today':
        return '今天';
      case 'yesterday':
        return '昨天';
      case 'this_month':
        return '本月';
      case 'last_month':
        return '上個月';
      case 'custom':
        return `${startDate || ''} 至 ${endDate || ''}`;
      default:
        return '所有時間';
    }
  };

  // 格式化日期顯示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) ? date.toLocaleDateString('zh-TW') : '';
    } catch (error) {
      return '';
    }
  };

  // 使用 useMemo 來計算排序後的業務人員數據
  const sortedSalesPersonStats = useMemo(() => {
    return Object.values(statistics.salesPersonStats)
      .sort((a, b) => b.subtotal - a.subtotal);
  }, [statistics.salesPersonStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">業務統計報表</h1>
        <button
          onClick={handleOpenExportModal}
          disabled={exportLoading || orders.length === 0}
          className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
            exportLoading || orders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {exportLoading ? '匯出中...' : '預覽並匯出Excel'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {/* 頂部認證警告條 */}
      {showAuthWarning && error && error.includes('認證') && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 border-b border-red-200 text-red-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>未獲取到認證令牌，請重新登入</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAuthWarning(false)} 
              className="text-red-700 hover:text-red-900"
            >
              關閉
            </button>
            <button 
              onClick={handleReloginLocal}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              重新登入
            </button>
          </div>
        </div>
      )}

      {/* 篩選條件區塊 */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">篩選條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              搜尋
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="訂單號/客戶名稱/電話/公司"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              訂單狀態
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">所有狀態</option>
              <option value="PENDING">待處理</option>
              <option value="PROCESSING">處理中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              日期範圍
            </label>
            <select
              value={dateFilter}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">所有時間</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="this_month">本月</option>
              <option value="last_month">上個月</option>
              <option value="custom">自定義日期範圍</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              公司/業務
            </label>
            <select
              value={salesPersonFilter}
              onChange={handleSalesPersonChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">所有公司/業務</option>
              {salesPersons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showCustomDateRange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                開始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                結束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleFilter}
            disabled={loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '載入中...' : '套用過濾'}
          </button>
        </div>
      </div>

      {/* 統計數據摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">訂單總覽</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">總訂單數</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalOrders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">銷售總覽</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">總銷售額</p>
              <p className="text-2xl font-bold text-amber-600">NT${statistics.totalSubtotal.toLocaleString()}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 業務人員統計表 */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">業務人員統計 (依銷售額排序)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業務ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  公司名稱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單數
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  銷售總額
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單小計
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSalesPersonStats.map((stats, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stats.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stats.companyName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{stats.orders}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">NT${stats.sales.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">NT${stats.subtotal.toLocaleString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 匯出預覽模態框 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900">預覽匯出數據</h3>
              <button
                onClick={handleCloseExportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2">匯出資訊</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <p><span className="font-medium">期間:</span> {formatDateRange()}</p>
                  <p><span className="font-medium">總 銷售額(不含運費):</span> NT${statistics.totalSubtotal.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold">選擇要匯出的業務人員</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectedAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                      全選
                    </label>
                  </div>
                </div>
                
                <div className="max-h-[40vh] overflow-y-auto border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          選擇
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          業務ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          公司名稱
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          訂單數
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          銷售額
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        銷售額(不含運費)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedSalesPersonStats.map((stats, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStats[stats.id] || false}
                              onChange={() => handleSelectStat(stats.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{stats.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{stats.companyName || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{stats.orders}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">NT${stats.sales.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">NT${stats.subtotal.toLocaleString()}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={handleCloseExportModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={exportLoading || Object.values(selectedStats).every(v => !v)}
                  className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
                    exportLoading || Object.values(selectedStats).every(v => !v) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {exportLoading ? '匯出中...' : '匯出Excel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
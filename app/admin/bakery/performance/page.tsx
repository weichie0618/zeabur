'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { 
  initializeAuth,
  apiGet,
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide,
  getStatusDisplay,
  getStatusClass
} from '../utils/authService';

// 佣金統計介面定義
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

// 佣金計劃統計
interface CommissionPlanStats {
  salesperson_id: string;
  salesperson_name: string;
  commission_plan?: {
    id: number;
    name: string;
    rule_type: string;
    fixed_rate: number | null;
    status: string;
  };
  commission_plan_name?: string; // 新增佣金專案名稱
  commission_plan_rule_type?: string; // 新增佣金專案類型
  contract_end_date?: string;
  total_orders: number;
  total_sales: number;          // 基於 subtotal 的銷售額
  subtotal?: number;            // 新增小計
  commission_base_amount?: number; // 新增分潤基準
  commission_rate?: number;     // 新增佣金分潤比例
  total_commission: number;     // 基於新機制計算的佣金
  average_order_value: number;
  current_month_sales: number;
  current_month_commission: number;
  last_month_sales: number;
  last_month_commission: number;
  growth_rate: number;
  actual_commission_rate?: number; // 新增實際佣金比例
}

export default function PerformanceReport() {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 篩選條件
  const [period, setPeriod] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);

  // 統計數據
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<CommissionPlanStats[]>([]);

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

  // 監聽期間篩選變更
  useEffect(() => {
    setShowCustomDateRange(period === 'custom');
    
    if (period !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else if (period === 'custom' && !startDate) {
      // 設置默認自定義日期範圍
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      setStartDate(lastMonth.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [period, startDate]);

  // 獲取佣金統計數據
  const fetchCommissionStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!accessToken) {
        setShowAuthWarning(true);
        setLoading(false);
        return;
      }

      // 構建查詢參數
      const params = new URLSearchParams();
      if (period === 'custom' && startDate && endDate) {
        params.append('period', 'custom');
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      
      // 🔑 使用新的佣金統計API
      const data = await apiGet(`/api/admin/commissions/stats?${params.toString()}`);
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || '獲取統計數據失敗');
      }
    } catch (error: any) {
      setError(error.message || '獲取統計數據時發生錯誤');
      if (error.message?.includes('認證')) {
        handleAuthErrorLocal(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, period, startDate, endDate]);

  // 獲取詳細佣金績效數據
  const fetchDetailedCommissionStats = useCallback(async () => {
    try {
      if (!accessToken) {
        return;
      }

      // 構建查詢參數
      const params = new URLSearchParams();
      if (period === 'custom' && startDate && endDate) {
        params.append('period', 'custom');
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }
      
      // 🔑 使用新的詳細佣金績效API
      const data = await apiGet(`/api/admin/commissions/performance-stats?${params.toString()}`);
      
      if (data.success) {
        // 設置詳細統計數據供匯出使用
        const detailedData = data.data.performance_details.map((detail: any) => {
          const processedDetail = {
            salesperson_id: detail.salesperson_id,
            salesperson_name: detail.salesperson_name,
            commission_plan: detail.commission_plan,
            commission_plan_name: detail.commission_plan?.name || '未設定',
            commission_plan_rule_type: detail.commission_plan?.rule_type || 'fixed',
            total_orders: Number(detail.total_orders) || 0,
            subtotal: Number(detail.subtotal) || 0, // 確保是數字類型
            commission_base_amount: Number(detail.commission_base_amount) || 0, // 確保是數字類型
            commission_rate: Number(detail.commission_rate) || 0, // 轉換字符串為數字
            total_commission: Number(detail.total_commission) || 0, // 確保是數字類型
            average_order_value: Number(detail.average_order_value) || 0,
            actual_commission_rate: Number(detail.actual_commission_rate) || 0,
            total_sales: Number(detail.subtotal) || 0, // 與 subtotal 相同
            current_month_sales: Number(detail.subtotal) || 0,
            current_month_commission: Number(detail.total_commission) || 0,
            last_month_sales: 0,
            last_month_commission: 0,
            growth_rate: 0,
            contract_end_date: detail.contract_end_date
          };
          
          return processedDetail;
        });
        
        setDetailedStats(detailedData);
      }
    } catch (error: any) {
      console.error('獲取詳細統計數據失敗:', error);
      // 不影響主要流程，錯誤只記錄不拋出
    }
  }, [accessToken, period, startDate, endDate]);

  // 當認證成功後獲取數據
  useEffect(() => {
    if (accessToken) {
      // 先執行基本統計，然後執行詳細統計
      fetchCommissionStats().then(() => {
        fetchDetailedCommissionStats();
      });
    }
  }, [accessToken, fetchCommissionStats, fetchDetailedCommissionStats]);

  // 手動觸發重新載入
  const handleRefresh = () => {
    fetchCommissionStats().then(() => {
      fetchDetailedCommissionStats();
    });
  };

  const handleOpenExportModal = () => {
    if (!stats || !detailedStats.length) {
      alert('目前沒有可匯出的數據');
      return;
    }
    
    // 初始化選擇狀態
    const initialSelectedStats: Record<string, boolean> = {};
    detailedStats.forEach(stat => {
      initialSelectedStats[stat.salesperson_id] = false;
    });
    setSelectedStats(initialSelectedStats);
    setSelectedAll(false);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  const handleSelectAll = () => {
    const newSelectedAll = !selectedAll;
    setSelectedAll(newSelectedAll);
    
    const newSelectedStats: Record<string, boolean> = {};
    detailedStats.forEach(stat => {
      newSelectedStats[stat.salesperson_id] = newSelectedAll;
    });
    setSelectedStats(newSelectedStats);
  };

  const handleSelectStat = (id: string) => {
    const newSelectedStats = {
      ...selectedStats,
      [id]: !selectedStats[id]
    };
    setSelectedStats(newSelectedStats);
    
    // 更新全選狀態
    const allSelected = detailedStats.every(stat => newSelectedStats[stat.salesperson_id]);
    setSelectedAll(allSelected);
  };

  const handleExportExcel = () => {
    setExportLoading(true);
    
    try {
      // 獲取選中的統計數據
      const selectedIds = Object.keys(selectedStats).filter(id => selectedStats[id]);
      const selectedStatsData = detailedStats.filter(stat => selectedIds.includes(stat.salesperson_id));
      
      if (selectedStatsData.length === 0) {
        alert('請選擇要匯出的數據');
        setExportLoading(false);
        return;
      }

      // 準備Excel數據
      const excelData = [
        ['佣金業績報表'],
        [],
        ['統計期間', formatDateRange()],
        ['總佣金金額', `NT$ ${stats?.totalCommissions?.toLocaleString() || 0}`],
        ['本期佣金', `NT$ ${stats?.thisMonthCommissions?.toLocaleString() || 0}`],
        ['業務員總數', stats?.totalSalespersons || 0],
        ['活躍業務員', stats?.activeSalespersons || 0],
        [],
        [
          '業務員ID', 
          '業務員姓名', 
          '佣金專案',
          '訂單數', 
          '小計', 
          '分潤基準(小計×0.95)', 
          '佣金分潤%', 
          '佣金金額'
        ],
        ...selectedStatsData.map(stat => [
          stat.salesperson_id,
          stat.salesperson_name,
          stat.commission_plan_name,
          stat.total_orders,
          formatCurrency(stat.subtotal || 0),
          formatCurrency(stat.commission_base_amount || 0),
          `${stat.commission_rate || 0}%`,
          formatCurrency(stat.total_commission || 0)
        ])
      ];

      // 創建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // 設置列寬
      const columnWidths = [
        { wch: 15 }, // 業務員ID
        { wch: 20 }, // 業務員姓名
        { wch: 20 }, // 佣金專案
        { wch: 10 }, // 訂單數
        { wch: 18 }, // 小計
        { wch: 22 }, // 分潤基準
        { wch: 15 }, // 佣金分潤%
        { wch: 18 }  // 佣金金額
      ];
      worksheet['!cols'] = columnWidths;

      // 創建工作簿
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '佣金業績報表');

      // 生成文件名
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const fileName = `佣金業績報表_${dateStr}.xlsx`;

      // 下載文件
      XLSX.writeFile(workbook, fileName);
      
      // 關閉模態框
      setShowExportModal(false);
    } catch (error) {
      console.error('匯出Excel時發生錯誤:', error);
      alert('匯出失敗，請稍後再試');
    } finally {
      setExportLoading(false);
    }
  };

  const formatDateRange = () => {
    switch (period) {
      case 'this_month':
        return '本月';
      case 'last_month':
        return '上個月';
      case 'this_quarter':
        return '本季';
      case 'last_quarter':
        return '上季';
      case 'this_year':
        return '今年';
      case 'custom':
        if (startDate && endDate) {
          return `${formatDate(startDate)} 至 ${formatDate(endDate)}`;
        }
        return '自定義範圍';
      default:
        return '本月';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
        <div>
          <h1 className="text-2xl font-bold">佣金業績報表</h1>
          <p className="text-sm text-gray-600 mt-1">佣金計算機制 (小計 × 0.95 × 專案分潤)</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            重新載入
          </button>
          <button
            onClick={handleOpenExportModal}
            disabled={exportLoading || !stats}
            className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
              exportLoading || !stats ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {exportLoading ? '匯出中...' : '匯出Excel'}
          </button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              統計期間
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="this_month">本月</option>
              <option value="last_month">上個月</option>
              <option value="this_quarter">本季</option>
              <option value="last_quarter">上季</option>
              <option value="this_year">今年</option>
              <option value="custom">自定義範圍</option>
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
            onClick={fetchCommissionStats}
            disabled={loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '載入中...' : '套用篩選'}
          </button>
        </div>
      </div>

      {/* 統計數據摘要 */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-blue-600">總佣金金額</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.totalCommissions)}</p>
                  <p className="text-sm text-gray-600">佣金機制</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-green-600">本期佣金</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.thisMonthCommissions)}</p>
                  <p className="text-sm text-gray-600">{formatDateRange()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-purple-600">業務員總數</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-purple-800">{stats.totalSalespersons}</p>
                  <p className="text-sm text-gray-600">活躍: {stats.activeSalespersons}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-amber-600">專案統計</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-amber-800">{stats.planStats?.length || 0}</p>
                  <p className="text-sm text-gray-600">活躍專案數</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 頂尖業務員表現 */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">頂尖業務員表現 (依佣金排序)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      排名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業務員ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      姓名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      佣金金額
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      訂單數
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topPerformers?.map((performer, index) => (
                    <tr key={performer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{performer.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">{formatCurrency(performer.totalCommissions)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{performer.orderCount}</div>
                      </td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
          </div>

          {/* 專案統計 */}
          {stats.planStats && stats.planStats.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">佣金專案統計</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        專案名稱
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        業務員數量
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        總佣金金額
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均佣金
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.planStats.map((planStat, index) => (
                      <tr key={planStat.planId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{planStat.planName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{planStat.salespersonCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{formatCurrency(planStat.totalCommissions)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(planStat.salespersonCount > 0 ? planStat.totalCommissions / planStat.salespersonCount : 0)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

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
                  <p><span className="font-medium">總佣金金額:</span> {formatCurrency(stats?.totalCommissions || 0)}</p>
                  <p><span className="font-medium">計算基準:</span> 小計 × 0.95 × 專案分潤比例</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold">選擇要匯出的業務員</h4>
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
                          業務員ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          姓名
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          佣金專案
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          訂單數
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          小計
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          分潤基準
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          佣金分潤%
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          佣金金額
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailedStats.map((stat, index) => (
                        <tr key={stat.salesperson_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStats[stat.salesperson_id] || false}
                              onChange={() => handleSelectStat(stat.salesperson_id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{stat.salesperson_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{stat.salesperson_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{stat.commission_plan_name || '未設定'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{stat.total_orders}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(stat.subtotal || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(stat.commission_base_amount || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{stat.commission_rate || 0}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">{formatCurrency(stat.total_commission)}</div>
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
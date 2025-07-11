'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  initializeAuth, 
  apiGet,
  apiPut,
  apiPost,
  handleAuthError,
  setupAuthWarningAutoHide 
} from '../../utils/authService';
import AuthWarning from '../../orders/components/AuthWarning';

interface CommissionRecord {
  id: number;
  order_id: number;
  customer_id: string;
  customer_name: string;
  salesperson_id: string;
  salesperson_name: string;
  commission_plan: {
    id: number;
    name: string;
    rule_type: string;
    fixed_rate: number | null;
    status: string;
  };
  order_amount: string;
  commission_amount: string;
  commission_rate: string;
  rule_name: string;
  rule_type: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  notes: string | null;
  batch_id?: string;
  payment_reference?: string;
  payment_date?: string;
  payment_method?: string;
}

interface FilterOptions {
  salespersonId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

// 新增批量計算表單介面
interface BatchCalculateForm {
  startDate: string;
  endDate: string;
  salesperson_id: string;
}

// 新增支付表單介面
interface PaymentForm {
  payment_reference: string;
  payment_method: string;
  notes: string;
}

// 新增批量計算結果介面
interface BatchCalculateResult {
  calculated_commissions: CommissionRecord[];
  summary: {
    total_records: number;
    total_amount: number;
    success_count: number;
    error_count: number;
  };
  salesPersonSummary: {
    [key: string]: {
      salesperson_id: string;
      salesperson_name: string;
      total_records: number;
      total_amount: number;
      records: CommissionRecord[];
    };
  };
}

// 新增預覽選擇狀態介面
interface PreviewSelection {
  [key: number]: boolean;
}

export default function CommissionHistoryPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [salespersons, setSalespersons] = useState<Array<{id: string, name: string}>>([]);
  const [plans, setPlans] = useState<Array<{id: number, name: string}>>([]);
  
  const [filters, setFilters] = useState<FilterOptions>({
    salespersonId: '',
    planId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);

  // 新增狀態管理
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  
  const [batchForm, setBatchForm] = useState<BatchCalculateForm>({
    startDate: '',
    endDate: '',
    salesperson_id: ''
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    payment_reference: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  // 新增批量計算預覽相關狀態
  const [showBatchPreview, setShowBatchPreview] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BatchCalculateResult | null>(null);
  const [previewSelection, setPreviewSelection] = useState<PreviewSelection>({});
  const [selectAllPreview, setSelectAllPreview] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
    setupAuthWarningAutoHide(error, setShowAuthWarning);
  }, [error]);

  const loadRecords = async () => {
    if (!accessToken) return;

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const data = await apiGet(`/api/admin/commissions/history?${params}`);

      if (data && data.success) {
        setRecords(data.data);
        setTotalRecords(data.pagination.total);
      } else {
        throw new Error(data?.message || '載入佣金記錄失敗');
      }
    } catch (error) {
      console.error('載入佣金記錄錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError('載入佣金記錄失敗');
      }
    }
  };

  const loadFilterData = async () => {
    if (!accessToken) return;

    try {
      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const [salespersonsData, plansData] = await Promise.all([
        apiGet('/api/admin/customers/salespersons'),
        apiGet('/api/admin/commission-plans')
      ]);

      if (salespersonsData && salespersonsData.success && salespersonsData.data) {
        setSalespersons(salespersonsData.data.map((c: any) => ({ id: c.id, name: c.name })));
      }
      
      // 修正 plans 資料處理邏輯
      if (plansData && plansData.success && plansData.data) {
        // 檢查 data.salespeople 是否存在（新 API 結構）
        if (plansData.data.salespeople) {
          const uniquePlans = new Map();
          plansData.data.salespeople.forEach((sp: any) => {
            if (sp.commission_plan) {
              uniquePlans.set(sp.commission_plan.id, {
                id: sp.commission_plan.id,
                name: sp.commission_plan.name
              });
            }
          });
          setPlans(Array.from(uniquePlans.values()));
        } else {
          // 舊的 API 結構處理
          const plansList = Array.isArray(plansData.data) ? plansData.data : [];
          setPlans(plansList.map((p: any) => ({ id: p.id, name: p.name })));
        }
      }
    } catch (error) {
      console.error('載入篩選數據錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError('載入篩選數據失敗');
      }
    }
  };

  useEffect(() => {
    if (accessToken) {
      setLoading(false);
      loadFilterData();
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadRecords();
    }
  }, [accessToken, filters.page, filters.salespersonId, filters.planId, filters.status, filters.startDate, filters.endDate]);

  const updateCommissionStatus = async (recordId: number, newStatus: 'pending' | 'paid' | 'cancelled') => {
    if (!accessToken) return;

    try {
      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const data = await apiPut(`/api/admin/commissions/${recordId}/status`, { 
        status: newStatus 
      });

      if (data && data.success) {
        loadRecords();
        alert('佣金狀態更新成功！');
      } else {
        throw new Error(data?.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新佣金狀態錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        alert(error instanceof Error ? error.message : '更新失敗');
      }
    }
  };

  const exportRecords = async () => {
    if (!accessToken) return;

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          params.append(key, value.toString());
        }
      });

      // 🔑 安全改進：使用 HttpOnly Cookie 認證 - 文件下載需要特殊處理
      try {
        const response = await fetch(`/api/admin/commissions/export?${params}`, {
          method: 'GET',
          credentials: 'include' // 只需要帶上 HttpOnly Cookie
        });

        if (response.status === 401) {
          handleAuthError('認證失敗，請重新登入', setError, setLoading, setShowAuthWarning);
          return;
        }

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `commission-history-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error('匯出失敗');
        }
      } catch (fetchError) {
        throw fetchError;
      }
    } catch (error) {
      console.error('匯出佣金記錄錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        alert(error instanceof Error ? error.message : '匯出失敗');
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      salespersonId: '',
      planId: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20
    });
  };

  // 新增批量計算佣金函數（彙總已計算的佣金）
  const handleBatchCalculate = async () => {
    if (!accessToken) return;

    try {
      setIsCalculating(true);
      
      // 構建查詢參數來獲取已計算的佣金記錄
      const params = new URLSearchParams({
        status: 'calculated',
        startDate: batchForm.startDate,
        endDate: batchForm.endDate
      });
      
      if (batchForm.salesperson_id) {
        params.append('salespersonId', batchForm.salesperson_id);
      }

      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const data = await apiGet(`/api/admin/commissions/history?${params}`);
      
      if (data && data.success && data.data) {
        const calculatedCommissions = data.data;
        
        // 按業務員進行彙總
        const salesPersonSummary: { [key: string]: any } = {};
        let totalAmount = 0;
        
        calculatedCommissions.forEach((record: CommissionRecord) => {
          const salespersonId = record.salesperson_id;
          const amount = parseFloat(record.commission_amount) || 0;
          totalAmount += amount;
          
          if (!salesPersonSummary[salespersonId]) {
            salesPersonSummary[salespersonId] = {
              salesperson_id: salespersonId,
              salesperson_name: record.salesperson_name,
              total_records: 0,
              total_amount: 0,
              records: []
            };
          }
          
          salesPersonSummary[salespersonId].total_records += 1;
          salesPersonSummary[salespersonId].total_amount += amount;
          salesPersonSummary[salespersonId].records.push(record);
        });

        const batchResult: BatchCalculateResult = {
          calculated_commissions: calculatedCommissions,
          summary: {
            total_records: calculatedCommissions.length,
            total_amount: totalAmount,
            success_count: calculatedCommissions.length,
            error_count: 0
          },
          salesPersonSummary
        };

        setBatchResult(batchResult);
        
        // 初始化預覽選擇狀態 - 全部選中
        const initialSelection: PreviewSelection = {};
        calculatedCommissions.forEach((record: CommissionRecord) => {
          initialSelection[record.id] = true;
        });
        setPreviewSelection(initialSelection);
        setSelectAllPreview(true);
        
        // 關閉批量計算模態框，顯示預覽模態框
        setShowBatchModal(false);
        setShowBatchPreview(true);
      } else {
        throw new Error(data?.message || '無法找到符合條件的已計算佣金記錄');
      }
    } catch (error) {
      console.error('批量彙總錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(error instanceof Error ? error.message : '批量彙總失敗');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // 新增支付處理函數
  const handlePayment = async () => {
    if (!accessToken || !selectedRecord) return;

    try {
      setIsProcessing(true);
      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const data = await apiPut(`/api/admin/commission/records/${selectedRecord.id}/status`, {
        status: 'paid',
        payment_reference: paymentForm.payment_reference,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });

      if (data && data.success) {
        alert('佣金支付成功！');
        loadRecords();
        setShowPaymentModal(false);
        setSelectedRecord(null);
        setPaymentForm({
          payment_reference: '',
          payment_method: 'bank_transfer',
          notes: ''
        });
      } else {
        throw new Error(data?.message || '支付處理失敗');
      }
    } catch (error) {
      console.error('支付處理錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(error instanceof Error ? error.message : '支付處理失敗');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 新增批量支付函數
  const handleBatchPayment = async () => {
    if (!accessToken || selectedRecords.length === 0) return;

    if (!confirm(`確定要將 ${selectedRecords.length} 筆佣金標記為已支付嗎？`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const promises = selectedRecords.map(recordId => 
        // 🔑 安全改進：使用 HttpOnly Cookie 認證
        apiPut(`/api/admin/commission/records/${recordId}/status`, {
          status: 'paid',
          notes: `批量支付 - ${new Date().toLocaleDateString()}`
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result.success).length;
      
      if (successCount > 0) {
        alert(`成功支付 ${successCount} 筆佣金記錄`);
        loadRecords();
        setSelectedRecords([]);
      }
      
      if (successCount < selectedRecords.length) {
        setError(`部分記錄支付失敗，成功 ${successCount}/${selectedRecords.length} 筆`);
      }
    } catch (error) {
      console.error('批量支付錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError('批量支付失敗');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 新增開啟支付模態框函數
  const openPaymentModal = (record: CommissionRecord) => {
    setSelectedRecord(record);
    setPaymentForm({
      payment_reference: '',
      payment_method: 'bank_transfer',
      notes: `${record.salesperson_name} - ${new Date().toLocaleDateString()} 佣金支付`
    });
    setShowPaymentModal(true);
  };

  // 新增選擇記錄函數
  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // 新增全選函數
  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(r => r.id));
    }
  };

  // 新增預覽模態框相關函數
  const handlePreviewSelectAll = () => {
    const newSelectAll = !selectAllPreview;
    setSelectAllPreview(newSelectAll);
    
    const newSelection: PreviewSelection = {};
    batchResult?.calculated_commissions?.forEach(record => {
      newSelection[record.id] = newSelectAll;
    });
    setPreviewSelection(newSelection);
  };

  const handlePreviewSelect = (recordId: number) => {
    const newSelection = { ...previewSelection };
    newSelection[recordId] = !newSelection[recordId];
    setPreviewSelection(newSelection);
    
    // 檢查是否全選
    const allSelected = batchResult?.calculated_commissions?.every(record => 
      newSelection[record.id]
    ) || false;
    setSelectAllPreview(allSelected);
  };

  // 確認批量支付
  const handleConfirmBatchCalculateAndPay = async () => {
    if (!accessToken || !batchResult) return;

    try {
      setIsConfirming(true);
      
      // 獲取選中的記錄
      const selectedCommissions = batchResult.calculated_commissions.filter(
        record => previewSelection[record.id]
      );

      if (selectedCommissions.length === 0) {
        alert('請至少選擇一筆記錄');
        return;
      }

      // 批量標記為已支付
      const paymentPromises = selectedCommissions.map((record: CommissionRecord) => 
        // 🔑 安全改進：使用 HttpOnly Cookie 認證
        apiPut(`/api/admin/commission/records/${record.id}/status`, {
          status: 'paid',
          notes: `批量結算支付 - ${new Date().toLocaleDateString()}`
        })
      );

      const paymentResults = await Promise.all(paymentPromises);
      const successCount = paymentResults.filter(result => result.success).length;

      if (successCount > 0) {
        alert(`成功支付 ${successCount} 筆佣金記錄`);
        
        // 匯出Excel
        await handleExportExcel();
        
        // 重新載入記錄並關閉模態框
        loadRecords();
        setShowBatchPreview(false);
        setBatchResult(null);
        setBatchForm({
          startDate: '',
          endDate: '',
          salesperson_id: ''
        });
      }

      if (successCount < selectedCommissions.length) {
        setError(`部分記錄處理失敗，成功 ${successCount}/${selectedCommissions.length} 筆`);
      }

    } catch (error) {
      console.error('確認批量支付錯誤:', error);
      if (error instanceof Error && error.message.includes('認證')) {
        handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(error instanceof Error ? error.message : '確認批量支付失敗');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // 匯出Excel函數
  const handleExportExcel = async () => {
    if (!batchResult) return;

    try {
      setIsExporting(true);
      
      // 獲取選中的記錄
      const selectedCommissions = batchResult.calculated_commissions.filter(
        record => previewSelection[record.id]
      );

      // 準備匯出數據
      const exportData = [
        ['佣金結算明細報表', , '', `結算時間: ${new Date().toLocaleString()}`],
        ['', '', '', '', '', '', ''],
        ['結算摘要', '', '', '', '', '', ''],
        ['總計算筆數', selectedCommissions.length.toString(), '', '', '', '', ''],
        ['總佣金金額', selectedCommissions.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0).toLocaleString(), '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['業務員匯總', '', '', '', '', '', ''],
        ['業務員ID', '業務員姓名', '佣金筆數','分潤比例' , '佣金總額', '', '']
      ];

      // 添加業務員匯總數據
      if (batchResult.salesPersonSummary) {
        Object.values(batchResult.salesPersonSummary)
          .filter(summary => {
            // 只包含有選中記錄的業務員
            return summary.records.some(record => previewSelection[record.id]);
          })
          .forEach(summary => {
            const selectedRecordsForThisPerson = summary.records.filter(record => previewSelection[record.id]);
            const totalAmountForThisPerson = selectedRecordsForThisPerson.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0);
            
            // 計算平均佣金比例
            const averageCommissionRate = selectedRecordsForThisPerson.reduce((sum, record) => 
              sum + parseFloat(record.commission_rate), 0) / selectedRecordsForThisPerson.length;
            
            exportData.push([
              summary.salesperson_id,
              summary.salesperson_name,
              selectedRecordsForThisPerson.length.toString(),
              averageCommissionRate.toFixed(2) + '%',  // 格式化平均佣金比例
              totalAmountForThisPerson.toLocaleString(),
              '', '', ''
            ]);
          });
      }

      exportData.push(['', '', '', '', '', '', '']);
      exportData.push(['詳細明細', '', '', '', '', '', '']);
      exportData.push(['記錄ID', '訂單編號', '業務員', '專案名稱', '抽成比例(%)', '佣金金額', '計算時間']);

      // 添加明細數據
      selectedCommissions.forEach(record => {
        exportData.push([
          record.id.toString(),
          record.order_id.toString(),
          record.salesperson_name,
          record.commission_plan?.name || '',
          parseFloat(record.commission_rate).toString(),
          formatCurrency(parseFloat(record.commission_amount)),
          new Date(record.created_at).toLocaleDateString()
        ]);
      });

      // 創建工作表
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      // 設置列寬
      const colWidths = [
        { wch: 15 }, // 記錄ID
        { wch: 15 }, // 訂單編號
        { wch: 20 }, // 業務員
        { wch: 20 }, // 專案名稱
        { wch: 15 }, // 抽成比例
        { wch: 20 }, // 佣金金額
        { wch: 15 }  // 計算時間
      ];
      ws['!cols'] = colWidths;
      
      // 創建工作簿
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '佣金結算明細');
      
      // 生成文件名
      const now = new Date();
      const fileName = `佣金結算明細_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.xlsx`;
      
      // 匯出Excel
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('匯出Excel錯誤:', error);
      alert('匯出Excel時發生錯誤');
    } finally {
      setIsExporting(false);
    }
  };

  // 關閉預覽模態框
  const handleCloseBatchPreview = () => {
    setShowBatchPreview(false);
    setBatchResult(null);
    setPreviewSelection({});
    setSelectAllPreview(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'paid':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'calculated':
        return `${baseClass} bg-blue-100 text-blue-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '已支付';
      case 'pending': return '待支付';
      case 'cancelled': return '已取消';
      case 'calculated': return '已計算';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((totalRecords || 0) / (filters.limit || 20)));

  return (
    <div className="space-y-6">
      {/* 認證警告組件 */}
      <AuthWarning 
        showWarning={showAuthWarning}
        onClose={() => setShowAuthWarning(false)}
        message="認證令牌已過期，請重新登入"
      />

      {/* 頁面標題 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">佣金記錄</h1>
            <p className="mt-1 text-sm text-gray-600">查看和管理詳細的佣金交易記錄</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBatchModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              批量結算佣金
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showFilters ? '隱藏篩選' : '顯示篩選'}
            </button>
            <button
              onClick={exportRecords}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              匯出記錄
            </button>
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 批量操作區域 */}
      {records.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRecords.length === records.length && records.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  全選 ({selectedRecords.length}/{records.length})
                </span>
              </label>
              {selectedRecords.length > 0 && (
                <span className="text-sm text-blue-600">
                  已選擇 {selectedRecords.length} 筆記錄
                </span>
              )}
            </div>
            {selectedRecords.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleBatchPayment}
                  disabled={isProcessing || !selectedRecords.some(id => {
                    const record = records.find(r => r.id === id);
                    return record && record.status === 'calculated';
                  })}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                >
                  {isProcessing ? '處理中...' : '批量標記已支付'}
                </button>
                <button
                  onClick={() => setSelectedRecords([])}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm"
                >
                  取消選擇
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 篩選器 */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">篩選條件</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">業務員</label>
              <select
                value={filters.salespersonId}
                onChange={(e) => setFilters(prev => ({ ...prev, salespersonId: e.target.value, page: 1 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">全部業務員</option>
                {salespersons && salespersons.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">專案</label>
              <select
                value={filters.planId}
                onChange={(e) => setFilters(prev => ({ ...prev, planId: e.target.value, page: 1 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">全部專案</option>
                {plans && plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">狀態</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">全部狀態</option>
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">開始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">結束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm mr-2"
            >
              重置篩選
            </button>
          </div>
        </div>
      )}

      {/* 記錄列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              佣金記錄 ({totalRecords} 筆)
            </h3>
            <div className="text-sm text-gray-500">
              第 {filters.page} 頁，共 {totalPages} 頁
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRecords.length === records.length && records.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單編號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業務員
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  專案
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  抽成比例
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  佣金金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支付資訊
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!records || records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                    暫無佣金記錄
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.salesperson_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.commission_plan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(parseFloat(record.order_amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(record.commission_rate)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(parseFloat(record.commission_amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(record.status)}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>計算: {new Date(record.created_at).toLocaleDateString()}</div>
                      {record.paid_at && (
                        <div className="text-xs text-green-600">
                          支付: {new Date(record.paid_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.payment_reference && (
                        <div>
                          <div className="text-xs text-gray-600">參考編號:</div>
                          <div className="font-medium">{record.payment_reference}</div>
                        </div>
                      )}
                      {record.payment_method && (
                        <div className="text-xs text-gray-500 mt-1">
                          方式: {record.payment_method === 'bank_transfer' ? '銀行轉帳' : 
                                record.payment_method === 'cash' ? '現金' : 
                                record.payment_method === 'check' ? '支票' : record.payment_method}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.status === 'calculated' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openPaymentModal(record)}
                            className="text-green-600 hover:text-green-900"
                          >
                            標記已付
                          </button>
                          <button
                            onClick={() => updateCommissionStatus(record.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                          >
                            取消
                          </button>
                        </div>
                      )}
                      {record.status === 'paid' && (
                        <span className="text-green-600 text-sm">已完成</span>
                      )}
                      {record.status === 'cancelled' && (
                        <span className="text-red-600 text-sm">已取消</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={filters.page === 1}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                上一頁
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, Math.max(1, totalPages || 1)) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
                      className={`px-3 py-2 rounded-md text-sm ${
                        filters.page === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                disabled={filters.page === totalPages}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 批量計算佣金模態框 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">批量結算佣金</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始日期 *</label>
                  <input
                    type="date"
                    value={batchForm.startDate}
                    onChange={(e) => setBatchForm(prev => ({...prev, startDate: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">結束日期 *</label>
                  <input
                    type="date"
                    value={batchForm.endDate}
                    onChange={(e) => setBatchForm(prev => ({...prev, endDate: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">特定業務員（可選）</label>
                  <select
                    value={batchForm.salesperson_id}
                    onChange={(e) => setBatchForm(prev => ({...prev, salesperson_id: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部業務員</option>
                    {salespersons && salespersons.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="text-sm text-yellow-800">
                    <strong>注意：</strong>此操作將彙總指定期間內狀態為「已計算」的佣金記錄，按業務員進行匯總統計。
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchForm({
                      startDate: '',
                      endDate: '',
                      salesperson_id: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                                  <button
                    onClick={handleBatchCalculate}
                    disabled={isCalculating || !batchForm.startDate || !batchForm.endDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCalculating ? '載入中...' : '開始結算'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 支付確認模態框 */}
      {showPaymentModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                確認支付佣金 - {selectedRecord.salesperson_name}
              </h3>
              
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">訂單編號：</span>
                    <span className="font-medium">{selectedRecord.order_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">佣金金額：</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(parseFloat(selectedRecord.commission_amount))}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">抽成比例：</span>
                    <span className="font-medium">{parseFloat(selectedRecord.commission_rate)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">專案：</span>
                    <span className="font-medium">{selectedRecord.commission_plan.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">支付參考編號</label>
                  <input
                    type="text"
                    value={paymentForm.payment_reference}
                    onChange={(e) => setPaymentForm(prev => ({...prev, payment_reference: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：銀行交易編號、支票號碼等"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({...prev, payment_method: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">銀行轉帳</option>
                    <option value="cash">現金</option>
                    <option value="check">支票</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">備註</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({...prev, notes: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="支付相關備註..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedRecord(null);
                    setPaymentForm({
                      payment_reference: '',
                      payment_method: 'bank_transfer',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? '處理中...' : '確認支付'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量計算預覽模態框 */}
      {showBatchPreview && batchResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900">佣金批量結算預覽</h3>
              <button
                onClick={handleCloseBatchPreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* 結算摘要 */}
              <div className="mb-6  top-0 bg-white z-10 pb-4">
                <h4 className="text-lg font-semibold mb-4">結算摘要</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-blue-600">總記錄筆數</p>
                    <p className="text-2xl font-bold text-blue-800">{batchResult.summary?.total_records || batchResult.calculated_commissions?.length || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-green-600">總佣金金額</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatCurrency(batchResult.calculated_commissions?.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0) || 0)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="text-sm text-yellow-600">選中筆數</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {Object.values(previewSelection).filter(Boolean).length}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-sm text-purple-600">選中金額</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {formatCurrency(
                        batchResult.calculated_commissions
                          ?.filter(record => previewSelection[record.id])
                          ?.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0) || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 業務員匯總表 */}
              {batchResult.salesPersonSummary && Object.keys(batchResult.salesPersonSummary).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">業務員匯總統計</h4>
                  <div className="overflow-x-auto border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            業務員ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            業務員姓名
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            佣金筆數
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            佣金總額
                          </th>
                         
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            選中筆數
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            選中金額
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.values(batchResult.salesPersonSummary).map((summary, index) => {
                          const selectedRecordsForThisPerson = summary.records.filter(record => previewSelection[record.id]);
                          const selectedAmountForThisPerson = selectedRecordsForThisPerson.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0);
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{summary.salesperson_id}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{summary.salesperson_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{summary.total_records}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-green-600">{formatCurrency(summary.total_amount)}</div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-blue-600">{selectedRecordsForThisPerson.length}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-purple-600">{formatCurrency(selectedAmountForThisPerson)}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* 選擇操作 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold">選擇要結算支付的佣金記錄</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="selectAllPreview"
                      checked={selectAllPreview}
                      onChange={handlePreviewSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="selectAllPreview" className="ml-2 text-sm text-gray-700">
                      全選
                    </label>
                  </div>
                </div>
                
                {/* 佣金記錄表格 */}
                <div className="max-h-[40vh] overflow-y-auto border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          選擇
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          記錄ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          訂單編號
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          業務員
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          專案名稱
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          訂單金額
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          抽成比例
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          佣金金額
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          狀態
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batchResult.calculated_commissions?.map((record, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${previewSelection[record.id] ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={previewSelection[record.id] || false}
                              onChange={() => handlePreviewSelect(record.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.order_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.salesperson_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.commission_plan?.name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(parseFloat(record.order_amount))}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{parseFloat(record.commission_rate)}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">{formatCurrency(parseFloat(record.commission_amount))}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(record.status)}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="text-sm text-yellow-800">
                  <strong>注意：</strong>點擊「確定」後將會：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>將選中的佣金記錄狀態標記為「已支付」</li>
                    <li>自動下載包含業務員匯總和明細的Excel報表</li>
                    <li>此操作無法撤銷，請確認後再執行</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseBatchPreview}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || Object.values(previewSelection).every(v => !v)}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                    isExporting || Object.values(previewSelection).every(v => !v) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isExporting ? '匯出中...' : '僅匯出Excel'}
                </button>
                                  <button
                    onClick={handleConfirmBatchCalculateAndPay}
                    disabled={isConfirming || Object.values(previewSelection).every(v => !v)}
                    className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${
                      isConfirming || Object.values(previewSelection).every(v => !v) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isConfirming ? '處理中...' : '確定結算並支付'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
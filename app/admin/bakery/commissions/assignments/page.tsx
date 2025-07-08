'use client';

import React, { useState, useEffect } from 'react';
import { initializeAuth, getAuthHeaders, handleAuthError, getToken } from '../../utils/authService';

// 定義接口
interface CommissionPlan {
  id: string;
  name: string;
  rule_type: string;
  fixed_rate: number;
  tiered_rules: any;
  status: string;
  effective_date: string;
  expiry_date: string;
}

interface AssignmentFormData {
  customer_id: string;
  commission_plan_id: string;
  contract_start_date: string;
  contract_end_date: string;
}

interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  commission_plan_id: string | null;
  commission_plan: CommissionPlan | null;
  contract_start_date: string;
  contract_end_date: string;
  created_at: string;
  updated_at: string;
  status: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface StatisticsData {
  total_salespeople: number;
  assigned_salespeople: number;
  active_contracts: number;
  expiring_soon: number;
}

export default function AssignmentsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData>({
    total_salespeople: 0,
    assigned_salespeople: 0,
    active_contracts: 0,
    expiring_soon: 0
  });
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0
  });
  
  // 搜尋和排序狀態
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('ASC');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Salesperson | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchFormData, setBatchFormData] = useState<Omit<AssignmentFormData, 'customer_id'>>({
    commission_plan_id: '',
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: ''
  });

  const [formData, setFormData] = useState<AssignmentFormData>({
    customer_id: '',
    commission_plan_id: '',
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: ''
  });

  // 初始化認證
  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);

  // 載入業務員列表
  const loadSalespeople = async () => {
    if (!accessToken) return;

    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(status && { status }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      });

      const response = await fetch(`/api/admin/commission-plans?${queryParams}`, {
        headers: getAuthHeaders(accessToken)
      });

      if (!response.ok) {
        throw new Error('載入業務員列表失敗');
      }

      const data = await response.json();
      if (data.success) {
        setSalespeople(data.data.salespeople);
        setPagination(data.data.pagination);
        // 設定統計資訊
        if (data.data.statistics) {
          setStatistics(data.data.statistics);
        }
      } else {
        throw new Error(data.message || '載入業務員列表失敗');
      }
    } catch (error) {
      console.error('載入業務員列表錯誤:', error);
      handleAuthError(
        error instanceof Error ? error.message : '載入業務員列表失敗',
        setError,
        setLoading,
        setShowAuthWarning
      );
    }
  };

  // 載入佣金專案列表
  const loadPlans = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/admin/commission-plans', {
        headers: getAuthHeaders(accessToken)
      });

      if (!response.ok) {
        throw new Error('載入佣金專案失敗');
      }

      const data = await response.json();
      
      // 檢查並處理新的 API 回傳格式
      if (data.success) {
        // 從所有業務員的 commission_plan 中提取不重複的計畫
        const uniquePlans = new Map();
        
        if (data.data.salespeople) {
          // 新 API 格式
          data.data.salespeople.forEach((salesperson: Salesperson) => {
            if (salesperson.commission_plan && salesperson.commission_plan.status === 'active') {
              uniquePlans.set(salesperson.commission_plan.id, salesperson.commission_plan);
            }
          });
        } else if (Array.isArray(data.data)) {
          // 舊 API 格式
          data.data.forEach((plan: CommissionPlan) => {
            if (plan.status === 'active') {
              uniquePlans.set(plan.id, plan);
            }
          });
        }
        
        setPlans(Array.from(uniquePlans.values()));
      } else {
        throw new Error(data.message || '載入佣金專案失敗');
      }
    } catch (error) {
      console.error('載入佣金專案錯誤:', error);
      handleAuthError(
        error instanceof Error ? error.message : '載入佣金專案失敗',
        setError,
        setLoading,
        setShowAuthWarning
      );
    }
  };

  // 當有accessToken時載入數據
  useEffect(() => {
    if (accessToken) {
      setLoading(false);
      loadSalespeople();
      loadPlans();
    }
  }, [accessToken]);

  // 當搜尋條件改變時重新載入數據
  useEffect(() => {
    if (accessToken) {
      loadSalespeople();
    }
  }, [accessToken, pagination.page, pagination.limit, searchQuery, status, sortBy, sortOrder]);

  // 重置表單
  const resetForm = () => {
    setFormData({
      customer_id: '',
      commission_plan_id: '',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: ''
    });
    setSelectedCustomer(null);
  };

  // 打開分配模態框
  const openAssignModal = (customer?: Salesperson) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        customer_id: customer.id,
        commission_plan_id: customer.commission_plan_id || '',
        contract_start_date: customer.contract_start_date,
        contract_end_date: customer.contract_end_date
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // 關閉模態框
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // 提交分配
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError('');

    try {
      const submitData = {
        commission_plan_id: parseInt(formData.commission_plan_id) || null,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date || null
      };

      const response = await fetch(`/api/admin/customers/${formData.customer_id}/commission-plan`, {
        method: 'PUT',
        headers: getAuthHeaders(accessToken),
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        closeModal();
        loadSalespeople();
        alert('業務分配更新成功！');
      } else {
        throw new Error(data.message || '分配失敗');
      }
    } catch (error) {
      console.error('提交分配錯誤:', error);
      setError(error instanceof Error ? error.message : '分配失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 移除分配
  const removeAssignment = async (customerId: string) => {
    if (!accessToken) return;

    if (!confirm('確定要移除此業務員的佣金專案分配嗎？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/commission-plan`, {
        method: 'PUT',
        headers: getAuthHeaders(accessToken),
        body: JSON.stringify({
          commission_plan_id: null,
          contract_start_date: null,
          contract_end_date: null
        })
      });

      const data = await response.json();

      if (data.success) {
        loadSalespeople();
        alert('分配移除成功！');
      } else {
        throw new Error(data.message || '移除失敗');
      }
    } catch (error) {
      console.error('移除分配錯誤:', error);
      alert(error instanceof Error ? error.message : '移除失敗');
    }
  };

  // 狀態標籤樣式
  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // 合約狀態檢查
  const getContractStatus = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return { status: 'unassigned', text: '未分配', class: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (start > now) {
      return { status: 'pending', text: '待生效', class: 'bg-yellow-100 text-yellow-800' };
    }

    if (end && end < now) {
      return { status: 'expired', text: '已過期', class: 'bg-red-100 text-red-800' };
    }

    return { status: 'active', text: '生效中', class: 'bg-green-100 text-green-800' };
  };

  // 新增: 處理選擇/取消選擇業務員
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  // 新增: 處理全選/取消全選
  const handleSelectAll = () => {
    if (selectedCustomers.length === salespeople.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(salespeople.map(c => c.id));
    }
  };

  // 新增: 開啟批次分配模態框
  const openBatchAssignModal = () => {
    setBatchFormData({
      commission_plan_id: '',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: ''
    });
    setShowBatchModal(true);
  };

  // 新增: 關閉批次分配模態框
  const closeBatchModal = () => {
    setShowBatchModal(false);
    setBatchFormData({
      commission_plan_id: '',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: ''
    });
  };

  // 新增: 提交批次分配
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || selectedCustomers.length === 0) return;

    setSubmitting(true);
    setError('');

    try {
      const promises = selectedCustomers.map(customerId => {
        const submitData = {
          commission_plan_id: parseInt(batchFormData.commission_plan_id) || null,
          contract_start_date: batchFormData.contract_start_date,
          contract_end_date: batchFormData.contract_end_date || null
        };

        return fetch(`/api/admin/customers/${customerId}/commission-plan`, {
          method: 'PUT',
          headers: getAuthHeaders(accessToken),
          body: JSON.stringify(submitData)
        }).then(res => res.json());
      });

      const results = await Promise.all(promises);
      const hasError = results.some(result => !result.success);

      if (hasError) {
        throw new Error('部分業務員分配失敗');
      }

      closeBatchModal();
      loadSalespeople();
      setSelectedCustomers([]);
      alert('批次分配成功！');
    } catch (error) {
      console.error('批次分配錯誤:', error);
      setError(error instanceof Error ? error.message : '批次分配失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 處理搜尋
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination((prev: PaginationData) => ({ ...prev, page: 1 }));
  };

  // 處理狀態篩選
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPagination((prev: PaginationData) => ({ ...prev, page: 1 }));
  };

  // 處理排序
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setPagination((prev: PaginationData) => ({ ...prev, page: 1 }));
  };

  // 處理分頁
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 載入中
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {showAuthWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                您需要重新登入以繼續操作。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">佣金專案分配</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* 搜尋和篩選區 */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mt-5">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  搜尋業務員
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="姓名、信箱、電話、公司名稱"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  分配狀態
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={handleStatusFilter}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">全部</option>
                    <option value="with_plan">已分配專案</option>
                    <option value="without_plan">未分配專案</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                  排序方式
                </label>
                <div className="mt-1">
                  <select
                    id="sortBy"
                    name="sortBy"
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="name">姓名</option>
                    <option value="email">信箱</option>
                    <option value="created_at">建立時間</option>
                    <option value="updated_at">更新時間</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 統計資訊卡片 */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">總</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">總業務員</dt>
                        <dd className="text-lg font-medium text-gray-900">{statistics.total_salespeople}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">分</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">已分配</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {statistics.assigned_salespeople}
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
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">效</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">生效中</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {statistics.active_contracts}
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
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">期</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">即將到期</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {statistics.expiring_soon}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 表格區域 */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <input
                                type="checkbox"
                                checked={selectedCustomers.length === salespeople.length}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              業務員資訊
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              分配專案
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              合約期間
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              合約狀態
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              業務狀態
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {salespeople.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                暫無業務員數據
                              </td>
                            </tr>
                          ) : (
                            salespeople.map((customer) => {
                              const contractStatus = getContractStatus(customer.contract_start_date, customer.contract_end_date);
                              const assignedPlan = plans.find(p => p.id === customer.commission_plan_id);
                              
                              return (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={selectedCustomers.includes(customer.id)}
                                      onChange={() => handleSelectCustomer(customer.id)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {customer.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {customer.email}
                                      </div>
                                      {customer.phone && (
                                        <div className="text-sm text-gray-500">
                                          {customer.phone}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {assignedPlan ? (
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {assignedPlan.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {assignedPlan.rule_type === 'fixed' 
                                            ? `固定 ${assignedPlan.fixed_rate}%`
                                            : '階梯式'
                                          }
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 text-sm">未分配</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {customer.contract_start_date ? (
                                      <div>
                                        <div>開始: {new Date(customer.contract_start_date).toLocaleDateString()}</div>
                                        {customer.contract_end_date && (
                                          <div>結束: {new Date(customer.contract_end_date).toLocaleDateString()}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">未設定</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contractStatus.class}`}>
                                      {contractStatus.text}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={getStatusBadge(customer.status)}>
                                      {customer.status === 'active' ? '啟用' : '停用'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => openAssignModal(customer)}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        {customer.commission_plan_id ? '編輯' : '分配'}
                                      </button>
                                      {customer.commission_plan_id && (
                                        <button
                                          onClick={() => removeAssignment(customer.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          移除
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 分頁控制 */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                上一頁
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                下一頁
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  顯示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  筆，共{' '}
                  <span className="font-medium">{pagination.total}</span> 筆結果
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">第一頁</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M9.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">上一頁</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* 頁碼按鈕 */}
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pageNumber = pagination.page + i - 2;
                    if (pageNumber > 0 && pageNumber <= pagination.total_pages) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNumber === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">下一頁</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={pagination.page === pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">最後一頁</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M10.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L14.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* 新增: 批次操作按鈕 */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === salespeople.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  已選擇 {selectedCustomers.length} 個業務員
                </span>
              </div>
              <button
                onClick={openBatchAssignModal}
                disabled={selectedCustomers.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                批次分配專案
              </button>
            </div>
          </div>

          {/* 新增: 批次分配模態框 */}
          {showBatchModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    批次分配佣金專案 - 已選擇 {selectedCustomers.length} 個業務員
                  </h3>
                  
                  <form onSubmit={handleBatchSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        選擇佣金專案 *
                      </label>
                      <select
                        required
                        value={batchFormData.commission_plan_id}
                        onChange={(e) => setBatchFormData(prev => ({ ...prev, commission_plan_id: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">請選擇專案</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.rule_type === 'fixed' 
                              ? `固定 ${plan.fixed_rate}%` 
                              : '階梯式'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          合約開始日期 *
                        </label>
                        <input
                          type="date"
                          required
                          value={batchFormData.contract_start_date}
                          onChange={(e) => setBatchFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          合約結束日期
                        </label>
                        <input
                          type="date"
                          value={batchFormData.contract_end_date}
                          onChange={(e) => setBatchFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-gray-500">留空表示無期限</p>
                      </div>
                    </div>

                    {/* 按鈕 */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeBatchModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                      >
                        {submitting ? '處理中...' : '確認批次分配'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 分配模態框 */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedCustomer ? `分配佣金專案 - ${selectedCustomer.name}` : '分配佣金專案'}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        選擇佣金專案 *
                      </label>
                      <select
                        required
                        value={formData.commission_plan_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, commission_plan_id: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">請選擇專案</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.rule_type === 'fixed' 
                              ? `固定 ${plan.fixed_rate}%` 
                              : '階梯式'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          合約開始日期 *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.contract_start_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          合約結束日期
                        </label>
                        <input
                          type="date"
                          value={formData.contract_end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-gray-500">留空表示無期限</p>
                      </div>
                    </div>

                    {/* 按鈕 */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                      >
                        {submitting ? '處理中...' : '確認分配'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
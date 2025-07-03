'use client';

import React, { useState, useEffect } from 'react';
import { initializeAuth, getAuthHeaders, handleAuthError, getToken } from '../../utils/authService';

// 定義接口
interface CommissionPlan {
  id: number;
  name: string;
  description: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate: number | null;
  status: 'active' | 'inactive';
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  commission_plan_id: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  status: 'active' | 'inactive';
  commissionPlan?: CommissionPlan;
  isSelected?: boolean;
}

interface AssignmentFormData {
  customer_id: string;
  commission_plan_id: string;
  contract_start_date: string;
  contract_end_date: string;
}

export default function AssignmentsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
  const loadCustomers = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/admin/customers/salespersons', {
        headers: getAuthHeaders(accessToken)
      });

      if (!response.ok) {
        throw new Error('載入業務員列表失敗');
      }

      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
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
      if (data.success) {
        setPlans(data.data.filter((plan: CommissionPlan) => plan.status === 'active'));
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
      loadCustomers();
      loadPlans();
    }
  }, [accessToken]);

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
  const openAssignModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        customer_id: customer.id,
        commission_plan_id: customer.commission_plan_id?.toString() || '',
        contract_start_date: customer.contract_start_date 
          ? customer.contract_start_date.split('T')[0] 
          : new Date().toISOString().split('T')[0],
        contract_end_date: customer.contract_end_date 
          ? customer.contract_end_date.split('T')[0] 
          : ''
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
        loadCustomers();
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
        loadCustomers();
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
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
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
      loadCustomers();
      setSelectedCustomers([]);
      alert('批次分配成功！');
    } catch (error) {
      console.error('批次分配錯誤:', error);
      setError(error instanceof Error ? error.message : '批次分配失敗');
    } finally {
      setSubmitting(false);
    }
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
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">業務分配管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              管理業務人員與佣金專案的分配關係，設定合約期間
            </p>
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <dd className="text-lg font-medium text-gray-900">{customers.length}</dd>
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
                    {customers.filter(c => c.commission_plan_id).length}
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
                    {customers.filter(c => {
                      if (!c.contract_start_date) return false;
                      const now = new Date();
                      const start = new Date(c.contract_start_date);
                      const end = c.contract_end_date ? new Date(c.contract_end_date) : null;
                      return start <= now && (!end || end >= now);
                    }).length}
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
                    {customers.filter(c => {
                      if (!c.contract_end_date) return false;
                      const end = new Date(c.contract_end_date);
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      return end <= thirtyDaysFromNow && end >= new Date();
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增: 批次操作按鈕 */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedCustomers.length === customers.length}
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

      {/* 業務員列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length}
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    暫無業務員數據
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
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
  );
} 
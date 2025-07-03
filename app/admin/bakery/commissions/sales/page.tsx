'use client';

import React, { useState, useEffect } from 'react';
import { 
  initializeAuth, 
  getAuthHeaders,
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide
} from '../../utils/authService';
import AuthWarning from '../../orders/components/AuthWarning';

interface CommissionPlan {
  id: number;
  name: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate?: number;
  status: 'active' | 'inactive';
}

interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  commission_plan_id: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  status: 'active' | 'inactive';
  commissionPlan?: CommissionPlan;
}

interface AssignmentForm {
  customer_id: string;
  commission_plan_id: number;
  contract_start_date: string;
  contract_end_date: string;
}

const SalespersonManagementPage: React.FC = () => {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [commissionPlans, setCommissionPlans] = useState<CommissionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 彈窗狀態
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    customer_id: '',
    commission_plan_id: 0,
    contract_start_date: '',
    contract_end_date: ''
  });

  // 篩選和搜尋
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
    setupAuthWarningAutoHide(error, setShowAuthWarning);
    if (accessToken) {
      fetchData();
    }
  }, [accessToken, error]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!accessToken) {
        setAuthWarning('請先登入');
        return;
      }

      const headers = getAuthHeaders(accessToken);

      // 並行獲取數據
      const [salespersonsRes, plansRes] = await Promise.all([
        fetch('/api/admin/customers/salespersons', { headers }),
        fetch('/api/admin/commission-plans', { headers })
      ]);

      if (salespersonsRes.status === 401 || plansRes.status === 401) {
        handleAuthError('認證失敗，請重新登入', setError, setLoading, setShowAuthWarning);
        return;
      }

      if (!salespersonsRes.ok) {
        throw new Error(`獲取業務員列表失敗: ${salespersonsRes.statusText}`);
      }

      if (!plansRes.ok) {
        throw new Error(`獲取佣金專案失敗: ${plansRes.statusText}`);
      }

      const salespersonsData = await salespersonsRes.json();
      const plansData = await plansRes.json();

      if (salespersonsData.success && salespersonsData.data) {
        setSalespersons(salespersonsData.data);
      }

      if (plansData.success && plansData.data) {
        setCommissionPlans(plansData.data);
      }

      setError(null);
    } catch (err: any) {
      console.error('獲取數據錯誤:', err);
      setError(err.message || '獲取數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = (salesperson: Salesperson) => {
    setSelectedSalesperson(salesperson);
    setAssignmentForm({
      customer_id: salesperson.id,
      commission_plan_id: salesperson.commission_plan_id || 0,
      contract_start_date: salesperson.contract_start_date || '',
      contract_end_date: salesperson.contract_end_date || ''
    });
    setShowAssignModal(true);
  };

  const submitAssignment = async () => {
    try {
      if (!accessToken) {
        setAuthWarning('請先登入');
        return;
      }

      const response = await fetch(`/api/admin/customers/${assignmentForm.customer_id}/commission-plan`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(accessToken),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commission_plan_id: assignmentForm.commission_plan_id || null,
          contract_start_date: assignmentForm.contract_start_date || null,
          contract_end_date: assignmentForm.contract_end_date || null
        })
      });

      if (response.status === 401) {
        handleAuthError('認證失敗，請重新登入', setError, setLoading, setShowAuthWarning);
        return;
      }

      if (!response.ok) {
        throw new Error('更新佣金專案分配失敗');
      }

      const result = await response.json();
      if (result.success) {
        setShowAssignModal(false);
        fetchData(); // 重新獲取數據
        setError(null);
      }
    } catch (err: any) {
      console.error('更新分配錯誤:', err);
      setError(err.message || '更新分配失敗');
    }
  };

  // 篩選業務員
  const filteredSalespersons = salespersons.filter(salesperson => {
    const matchesSearch = salesperson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salesperson.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salesperson.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || salesperson.status === statusFilter;
    
    const matchesPlan = planFilter === 'all' || 
                       (planFilter === 'assigned' && salesperson.commission_plan_id) ||
                       (planFilter === 'unassigned' && !salesperson.commission_plan_id);
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // 統計數據
  const stats = {
    total: salespersons.length,
    active: salespersons.filter(s => s.status === 'active').length,
    assigned: salespersons.filter(s => s.commission_plan_id).length,
    expiringSoon: salespersons.filter(s => {
      if (!s.contract_end_date) return false;
      const endDate = new Date(s.contract_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length
  };

  // 合約狀態檢查
  const getContractStatus = (salesperson: Salesperson) => {
    if (!salesperson.contract_end_date) return 'no-contract';
    
    const endDate = new Date(salesperson.contract_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'active';
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusText = (status: string) => {
    switch (status) {
      case 'expired':
        return '已過期';
      case 'expiring':
        return '即將到期';
      case 'active':
        return '生效中';
      default:
        return '無合約';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 認證警告組件 */}
      <AuthWarning 
        showWarning={showAuthWarning}
        onClose={() => setShowAuthWarning(false)}
        message="認證令牌已過期，請重新登入"
      />

      {/* 標題 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">業務員管理</h1>
        <p className="text-gray-600">管理業務員與佣金專案的分配關係</p>
      </div>

      {/* 認證警告 */}
      {authWarning && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p>{authWarning}</p>
        </div>
      )}

      {/* 錯誤信息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總業務員數</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">活躍業務員</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已分配專案</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.assigned}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">即將到期</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.expiringSoon}</p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋業務員</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="姓名、郵箱或公司名稱"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">狀態篩選</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部狀態</option>
              <option value="active">活躍</option>
              <option value="inactive">非活躍</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">專案篩選</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="assigned">已分配專案</option>
              <option value="unassigned">未分配專案</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              重新整理
            </button>
          </div>
        </div>
      </div>

      {/* 業務員列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            業務員列表 ({filteredSalespersons.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業務員資訊
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  佣金專案
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  合約期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalespersons.map((salesperson) => {
                const contractStatus = getContractStatus(salesperson);
                return (
                  <tr key={salesperson.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {salesperson.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {salesperson.email}
                        </div>
                        {salesperson.companyName && (
                          <div className="text-sm text-gray-500">
                            {salesperson.companyName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {salesperson.commissionPlan ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {salesperson.commissionPlan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {salesperson.commissionPlan.rule_type === 'fixed' ? '固定比例' : '階梯式'}
                            {salesperson.commissionPlan.fixed_rate && ` (${salesperson.commissionPlan.fixed_rate}%)`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未分配</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salesperson.contract_start_date && salesperson.contract_end_date ? (
                        <div>
                          <div>{new Date(salesperson.contract_start_date).toLocaleDateString()}</div>
                          <div className="text-gray-500">至 {new Date(salesperson.contract_end_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">無合約</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          salesperson.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {salesperson.status === 'active' ? '活躍' : '非活躍'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContractStatusColor(contractStatus)}`}>
                          {getContractStatusText(contractStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAssignPlan(salesperson)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        分配專案
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSalespersons.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              沒有找到符合條件的業務員
            </div>
          )}
        </div>
      </div>

      {/* 分配專案彈窗 */}
      {showAssignModal && selectedSalesperson && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                分配佣金專案 - {selectedSalesperson.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    佣金專案
                  </label>
                  <select
                    value={assignmentForm.commission_plan_id}
                    onChange={(e) => setAssignmentForm({
                      ...assignmentForm,
                      commission_plan_id: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>請選擇佣金專案</option>
                    {commissionPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.rule_type === 'fixed' ? '固定比例' : '階梯式'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    合約開始日期
                  </label>
                  <input
                    type="date"
                    value={assignmentForm.contract_start_date}
                    onChange={(e) => setAssignmentForm({
                      ...assignmentForm,
                      contract_start_date: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    合約結束日期
                  </label>
                  <input
                    type="date"
                    value={assignmentForm.contract_end_date}
                    onChange={(e) => setAssignmentForm({
                      ...assignmentForm,
                      contract_end_date: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={submitAssignment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  確認分配
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespersonManagementPage; 
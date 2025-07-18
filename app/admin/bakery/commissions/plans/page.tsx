'use client';

import React, { useState, useEffect } from 'react';
import { initializeAuth, handleAuthError, apiGet, apiPost, apiPut, apiDelete } from '../../utils/authService';

// 定義接口
interface TieredRule {
  min_amount: number;
  max_amount: number | null;
  rate: number;
}

interface CommissionPlan {
  id: number;
  name: string;
  description: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate: number | null;
  tiered_rules: TieredRule[] | null;
  status: 'active' | 'inactive';
  effective_date: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  customer_count: number;
  customers: Array<{
    id: string;
    name: string;
    contract_start_date: string;
    contract_end_date: string;
  }>;
}

interface FormData {
  name: string;
  description: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate: string;
  tiered_rules: TieredRule[];
  effective_date: string;
  expiry_date: string;
}

export default function CommissionPlansPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>(''); // 模態框內的錯誤信息

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    rule_type: 'fixed',
    fixed_rate: '',
    tiered_rules: [],
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: ''
  });

  // 初始化認證
  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);

  // 載入佣金專案列表
  const loadPlans = async () => {
    if (!accessToken) return;

    try {
      const data = await apiGet('/api/admin/commission-plans/list');
      
      if (data.success && data.data && data.data.plans) {
        setPlans(data.data.plans);
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
      loadPlans();
    }
  }, [accessToken]);

  // 重置表單
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'fixed',
      fixed_rate: '',
      tiered_rules: [],
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: ''
    });
    setEditingPlan(null);
    setModalError(''); // 清除模態框錯誤
  };

  // 打開新增/編輯模態框
  const openModal = (plan?: CommissionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        rule_type: plan.rule_type,
        fixed_rate: plan.fixed_rate?.toString() || '',
        tiered_rules: plan.tiered_rules || [],
        effective_date: plan.effective_date ? plan.effective_date.split('T')[0] : '',
        expiry_date: plan.expiry_date ? plan.expiry_date.split('T')[0] : ''
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

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setModalError(''); // 清除之前的錯誤

    try {
      const url = editingPlan 
        ? `/api/admin/commission-plans/${editingPlan.id}`
        : '/api/admin/commission-plans';
      
      const method = editingPlan ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        fixed_rate: formData.rule_type === 'fixed' ? parseFloat(formData.fixed_rate) : null,
        tiered_rules: formData.rule_type === 'tiered' ? formData.tiered_rules : null
      };

      let data;
      if (editingPlan) {
        data = await apiPut(url, submitData);
      } else {
        data = await apiPost(url, submitData);
      }

      if (data.success) {
        closeModal();
        loadPlans();
        alert(editingPlan ? '佣金專案更新成功！' : '佣金專案創建成功！');
      } else {
        throw new Error(data.message || '操作失敗');
      }
    } catch (error) {
      console.error('提交表單錯誤:', error);
      setModalError(error instanceof Error ? error.message : '操作失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除專案
  const deletePlan = async (planId: number) => {
    if (!accessToken) return;

    if (!confirm('確定要刪除此佣金專案嗎？此操作無法復原。')) {
      return;
    }

    try {
      const data = await apiDelete(`/api/admin/commission-plans/${planId}`);

      if (data.success) {
        loadPlans();
        alert('佣金專案刪除成功！');
      } else {
        throw new Error(data.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除專案錯誤:', error);
      alert(error instanceof Error ? error.message : '刪除失敗');
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
            <h1 className="text-2xl font-bold text-gray-900">佣金專案管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              管理共用的佣金專案，設定不同的抽成規則。例如：專案A（2.5%固定）、專案B（階梯式）
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            新增專案
          </button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* 範例說明卡片 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">使用範例：</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• <strong>專案A</strong> - 固定抽成2.5%，適用於一般業務</div>
          <div>• <strong>專案B</strong> - 階梯式抽成，高金額訂單有更高抽成</div>
          <div>• <strong>分配範例</strong> - C業務使用專案A（2025/7/30到期）、H業務使用專案A（2026/7/30到期）、J業務使用專案B（2025/7/30到期）</div>
        </div>
      </div>

      {/* 專案列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  專案名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  規則類型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  抽成設定
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用業務
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    暫無佣金專案數據
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {plan.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {plan.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.rule_type === 'fixed' ? '固定比例' : '階梯式'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.rule_type === 'fixed' ? (
                        `${plan.fixed_rate}%`
                      ) : (
                        <div className="space-y-1">
                          {plan.tiered_rules?.map((rule, index) => (
                            <div key={index} className="text-xs">
                              ${rule.min_amount}
                              {rule.max_amount ? ` - $${rule.max_amount}` : '+'}: {rule.rate}%
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {plan.customer_count} 位業務
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(plan.status)}>
                        {plan.status === 'active' ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>生效: {new Date(plan.effective_date).toLocaleDateString()}</div>
                        {plan.expiry_date && (
                          <div>失效: {new Date(plan.expiry_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(plan)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={plan.customer_count > 0}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/編輯模態框 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPlan ? '編輯佣金專案' : '新增佣金專案'}
              </h3>
              
              {/* 模態框內的錯誤訊息 */}
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="text-red-800">{modalError}</div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 基本資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      專案名稱 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="例如：專案A"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      專案名稱必須唯一，不能與現有專案重複
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      規則類型 *
                    </label>
                    <select
                      value={formData.rule_type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        rule_type: e.target.value as 'fixed' | 'tiered',
                        tiered_rules: e.target.value === 'tiered' ? [] : prev.tiered_rules
                      }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="fixed">固定比例</option>
                      <option value="tiered">階梯式</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    專案描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="專案說明..."
                  />
                </div>

                {/* 抽成規則設定 */}
                {formData.rule_type === 'fixed' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      固定抽成比例 (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={formData.fixed_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, fixed_rate: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="例如：2.5"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        階梯抽成規則
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          tiered_rules: [...prev.tiered_rules, { min_amount: 0, max_amount: null, rate: 0 }]
                        }))}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        新增階梯
                      </button>
                    </div>
                    
                    {formData.tiered_rules.map((rule, index) => (
                      <div key={index} className="border border-gray-200 rounded p-3 mb-2">
                        <div className="grid grid-cols-4 gap-2 items-center">
                          <div>
                            <label className="block text-xs text-gray-600">最小金額</label>
                            <input
                              type="number"
                              min="0"
                              value={rule.min_amount}
                              onChange={(e) => {
                                const newRules = [...formData.tiered_rules];
                                newRules[index] = { ...rule, min_amount: parseInt(e.target.value) || 0 };
                                setFormData(prev => ({ ...prev, tiered_rules: newRules }));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">最大金額</label>
                            <input
                              type="number"
                              min="0"
                              value={rule.max_amount || ''}
                              onChange={(e) => {
                                const newRules = [...formData.tiered_rules];
                                newRules[index] = { ...rule, max_amount: e.target.value ? parseInt(e.target.value) : null };
                                setFormData(prev => ({ ...prev, tiered_rules: newRules }));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="不限"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">抽成比例 (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={rule.rate}
                              onChange={(e) => {
                                const newRules = [...formData.tiered_rules];
                                newRules[index] = { ...rule, rate: parseFloat(e.target.value) || 0 };
                                setFormData(prev => ({ ...prev, tiered_rules: newRules }));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                const newRules = formData.tiered_rules.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, tiered_rules: newRules }));
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 有效期間 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      生效日期 *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.effective_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      失效日期
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
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
                    {submitting ? '處理中...' : (editingPlan ? '更新' : '創建')}
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
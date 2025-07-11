'use client';

import React, { useState, useEffect } from 'react';
import { initializeAuth, handleRelogin, handleAuthError, setupAuthWarningAutoHide, apiGet, apiPost, apiPut, apiDelete } from '../utils/authService';
import { format } from 'date-fns';

// 優惠碼類型枚舉
enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount"
}

// 優惠碼介面
interface DiscountCode {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  usage_limit: number | null;
  current_usage: number;
  created_at: string;
  updated_at: string;
}

// 優惠碼用戶介面
interface DiscountCodeUser {
  id: number;
  discount_code_id: number;
  customer_id: string;
  is_limited_to_user: boolean;
}

// 編輯表單介面
interface EditFormData {
  id?: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit: number | null;
  specificUsers: string;
}

export default function CouponsManagement() {
  // 狀態管理
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    code: '',
    discount_type: DiscountType.PERCENTAGE,
    discount_value: 10,
    start_date: '',
    end_date: '',
    is_active: true,
    usage_limit: null,
    specificUsers: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // 獲取優惠碼列表
  const fetchDiscountCodes = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      
      const response = await apiGet('/api/discounts');
      
      if (response && Array.isArray(response)) {
        setDiscountCodes(response);
        setError(null);
      } else {
        setDiscountCodes([]);
        setError('獲取優惠碼資料格式異常');
      }
    } catch (err: any) {
      console.error('獲取優惠碼失敗:', err);
      if (err.message && err.message.includes('認證失敗')) {
        handleAuthErrorLocal('獲取優惠碼時認證失敗');
      } else {
        setError(err.message || '獲取優惠碼資料失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  // 當令牌就緒時獲取數據
  useEffect(() => {
    if (accessToken) {
      fetchDiscountCodes();
    }
  }, [accessToken]);

  // 處理新增優惠碼
  const handleAddCoupon = async () => {
    setIsEditMode(false);
    setEditFormData({
      code: '',
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 10,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      is_active: true,
      usage_limit: null,
      specificUsers: ''
    });
    setIsModalOpen(true);
  };

  // 處理編輯優惠碼
  const handleEditCoupon = (coupon: DiscountCode) => {
    setIsEditMode(true);
    setEditFormData({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      start_date: coupon.start_date ? format(new Date(coupon.start_date), 'yyyy-MM-dd') : '',
      end_date: coupon.end_date ? format(new Date(coupon.end_date), 'yyyy-MM-dd') : '',
      is_active: coupon.is_active,
      usage_limit: coupon.usage_limit,
      specificUsers: '' // 此資料需從後端獲取，暫時設為空字串
    });
    setIsModalOpen(true);
  };

  // 處理表單變更
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setEditFormData({
        ...editFormData,
        [name]: checkbox.checked
      });
    } else if (name === 'usage_limit') {
      setEditFormData({
        ...editFormData,
        [name]: value === '' ? null : parseInt(value)
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      setError('您需要先登入才能執行此操作');
      return;
    }

    try {
      const formData = {
        ...editFormData,
        start_date: editFormData.start_date ? new Date(editFormData.start_date).toISOString() : null,
        end_date: editFormData.end_date ? new Date(editFormData.end_date).toISOString() : null,
        users: editFormData.specificUsers ? editFormData.specificUsers.split(',').map(id => id.trim()) : []
      };

      let response;
      if (isEditMode) {
        response = await apiPut(`/api/discounts/${editFormData.id}`, formData);
      } else {
        response = await apiPost('/api/discounts', formData);
      }
      
      setIsModalOpen(false);
      fetchDiscountCodes();
      setError(null);
    } catch (err: any) {
      console.error('保存優惠碼失敗:', err);
      if (err.message && err.message.includes('認證失敗')) {
        handleAuthErrorLocal('保存優惠碼時認證失敗');
      } else {
        setError(err.message || '保存優惠碼失敗');
      }
    }
  };

  // 處理優惠碼刪除
  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('確定要刪除這個優惠碼嗎？此操作無法恢復。')) {
      return;
    }

    try {
      await apiDelete(`/api/discounts/${id}`);
      
      fetchDiscountCodes();
      setError(null);
    } catch (err: any) {
      console.error('刪除優惠碼失敗:', err);
      if (err.message && err.message.includes('認證失敗')) {
        handleRelogin();
      } else {
        setError(err.message || '刪除優惠碼失敗');
      }
    }
  };

  // 處理優惠碼啟用/停用狀態切換
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await apiPut(`/api/discounts/${id}`, { is_active: !currentStatus });
      
      fetchDiscountCodes();
      setError(null);
    } catch (err: any) {
      console.error('更改優惠碼狀態失敗:', err);
      if (err.message && err.message.includes('認證失敗')) {
        handleRelogin();
      } else {
        setError(err.message || '更改優惠碼狀態失敗');
      }
    }
  };

  // 格式化顯示優惠值
  const formatDiscountValue = (discount: DiscountCode) => {
    if (discount.discount_type === DiscountType.PERCENTAGE) {
      return `${discount.discount_value}%`;
    } else {
      return `NT$${discount.discount_value}`;
    }
  };

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">優惠碼管理</h1>
        <button
          onClick={handleAddCoupon}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          新增優惠碼
        </button>
      </div>

      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span className="font-bold">認證錯誤:</span>
          <span> {error || '請重新登入以繼續操作'}</span>
          <button 
            onClick={() => handleReloginLocal()}
            className="ml-2 bg-red-700 text-white px-2 py-1 rounded text-xs"
          >
            重新登入
          </button>
        </div>
      )}

      {/* 搜尋列 */}
      <div className="mb-6">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <svg className="w-5 h-5 ml-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="text"
            placeholder="搜尋優惠碼..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* 優惠碼列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      ) : error && !showAuthWarning ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  優惠碼
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  折扣
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期間
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次數
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
              {discountCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    目前沒有優惠碼資料
                  </td>
                </tr>
              ) : (
                discountCodes
                  .filter(coupon => 
                    searchQuery === '' || 
                    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDiscountValue(coupon)}</div>
                        <div className="text-xs text-gray-500">
                          {coupon.discount_type === DiscountType.PERCENTAGE ? '百分比折扣' : '固定金額'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.start_date ? format(new Date(coupon.start_date), 'yyyy/MM/dd') : '不限'}
                          {' - '}
                          {coupon.end_date ? format(new Date(coupon.end_date), 'yyyy/MM/dd') : '不限'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.current_usage}
                          {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {coupon.usage_limit ? `限制 ${coupon.usage_limit} 次` : '不限次數'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.is_active ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                          className={`mr-2 text-xs px-2 py-1 rounded ${
                            coupon.is_active 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {coupon.is_active ? '停用' : '啟用'}
                        </button>
                        <button 
                          onClick={() => handleEditCoupon(coupon)}
                          className="mr-2 text-indigo-600 hover:text-indigo-900"
                        >
                          編輯
                        </button>
                        <button 
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
          
          {/* 分頁控制 - 如果擁有分頁功能可啟用 */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex justify-between items-center border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-700">
                  顯示第 <span className="font-medium">{currentPage}</span> 頁，共 <span className="font-medium">{totalPages}</span> 頁
                </p>
              </div>
              <div>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  上一頁
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`ml-2 px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 新增/編輯優惠碼模態框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditMode ? '編輯優惠碼' : '新增優惠碼'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">優惠碼</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={editFormData.code}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例：SUMMER2023"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-1">折扣類型</label>
                  <select
                    id="discount_type"
                    name="discount_type"
                    value={editFormData.discount_type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={DiscountType.PERCENTAGE}>百分比折扣</option>
                    <option value={DiscountType.FIXED_AMOUNT}>固定金額</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-1">
                    折扣值 {editFormData.discount_type === DiscountType.PERCENTAGE ? '(%)' : '(NT$)'}
                  </label>
                  <input
                    type="number"
                    id="discount_value"
                    name="discount_value"
                    value={editFormData.discount_value}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={editFormData.discount_type === DiscountType.PERCENTAGE ? '例：10' : '例：100'}
                    required
                    min="0"
                    max={editFormData.discount_type === DiscountType.PERCENTAGE ? '100' : undefined}
                  />
                </div>
                <div>
                  <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 mb-1">使用次數上限 (留空為不限)</label>
                  <input
                    type="number"
                    id="usage_limit"
                    name="usage_limit"
                    value={editFormData.usage_limit === null ? '' : editFormData.usage_limit}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例：100"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">開始日期 (留空為不限)</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={editFormData.start_date}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">結束日期 (留空為不限)</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={editFormData.end_date}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="specificUsers" className="block text-sm font-medium text-gray-700 mb-1">
                  指定用戶 ID (逗號分隔，留空為所有用戶)
                </label>
                <textarea
                  id="specificUsers"
                  name="specificUsers"
                  value={editFormData.specificUsers}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="例：user123,user456"
                  rows={2}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  如需限制特定用戶使用，請輸入用戶ID，多個ID請用逗號分隔
                </p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={editFormData.is_active}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    啟用優惠碼
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium"
                >
                  {isEditMode ? '更新優惠碼' : '新增優惠碼'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  initializeAuth, 
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide,
  apiGet,
  apiPut
} from '../../../utils/authService';

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  location: string;
  status: string;
  notes: string;
}

export default function EditOwner() {
  const { id } = useParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState<Owner>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    location: '',
    status: 'active',
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 初始化認證
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setFetchError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 處理認證錯誤
  const handleAuthErrorLocal = (errorMessage: string) => {
    handleAuthError(errorMessage, setFetchError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleReloginLocal = () => {
    handleRelogin();
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(fetchError, setShowAuthWarning);
    return cleanup;
  }, [fetchError]);
  
  // 獲取業主詳情
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!accessToken) {
        // 等待token獲取
        return;
      }
      
      try {
        setLoading(true);
        setFetchError(null);
        
        // 🔑 安全改進：使用 HttpOnly Cookie 認證
        const data = await apiGet(`api/customers/${id}`);
        
        // 確保所有字段都不為 null，用空字符串替代
        const safeData = {
          id: data.id || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          companyName: data.companyName || '',
          location: data.location || '',
          status: data.status || 'active',
          notes: data.notes || ''
        };
        
        setFormData(safeData);
      } catch (err) {
        console.error('獲取業主詳情錯誤:', err);
        setFetchError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };
    
    if (id && accessToken) {
      fetchOwnerDetails();
    }
  }, [id, accessToken]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // 必填欄位檢查
    if (!formData.name.trim()) {
      newErrors.name = '姓名為必填欄位';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '電子郵件為必填欄位';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件格式';
    }
    
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/[- ]/g, ''))) {
      newErrors.phone = '請輸入有效的電話號碼';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 清除欄位錯誤當用戶開始輸入
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setApiError(null);
    
    if (!accessToken) {
      setApiError('缺少認證令牌，請重新登入後再試');
      setShowAuthWarning(true);
      return;
    }
    
    // 表單驗證
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const data = await apiPut(`api/customers/${id}`, formData);
      
      // 成功更新，導航到詳情頁
      router.push(`api/admin/bakery/owners/${id}`);
      
    } catch (err) {
      console.error('更新業主錯誤:', err);
      setApiError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
        <p className="text-gray-600">正在加載業主資料...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          錯誤: {fetchError}
        </div>
        {showAuthWarning && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <div>認證失敗，請重新登入系統以獲取有效的認證憑證。</div>
            <button 
              onClick={handleReloginLocal}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              重新登入
            </button>
          </div>
        )}
        <Link 
          href="/admin/bakery/owners" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          返回列表
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">編輯業主</h1>
        <div className="flex gap-2">
          <Link 
            href={`/admin/bakery/owners/${id}`} 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            返回詳情
          </Link>
          <Link 
            href="/admin/bakery/owners" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            返回列表
          </Link>
        </div>
      </div>
      
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {apiError}
        </div>
      )}
      
      {showAuthWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <div>認證失敗，請重新登入系統以獲取有效的認證憑證。</div>
          <button 
            onClick={handleReloginLocal}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            重新登入
          </button>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 姓名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            {/* 電子郵件 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            {/* 電話 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                電話
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
            
            {/* 地址 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                地址
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* 公司名稱 */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                公司名稱
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* 地點 */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                營業區域
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* 狀態 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">啟用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
          
          {/* 備註 */}
          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              備註
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <Link 
              href={`/admin/bakery/owners/${id}`} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : (
                '保存更改'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// 定義客戶表單類型
interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  companyId: string;
  industry: string;
  status: string;
  notes: string;
}

// 定義表單錯誤類型
interface FormErrors {
  [key: string]: string;
}

export default function EditCustomer() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;
  
  // 行業別選項
  const industryOptions = [
    '烘焙坊／麵包店',
    '咖啡廳／茶館',
    '餐廳',
    '飯店',
    '零售商店',
    '其他'
  ];
  
  // 初始化表單狀態
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    companyId: '',
    industry: '',
    status: 'active',
    notes: ''
  });
  
  // 錯誤和提交狀態
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // 載入相關狀態
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 獲取客戶資料
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        
        const response = await fetch(`/api/customers/${customerId}`);
        
        if (!response.ok) {
          throw new Error(`無法獲取客戶資料: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 設置表單初始值
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          companyName: data.companyName || '',
          companyId: data.companyId || '',
          industry: data.industry || '',
          status: data.status || 'active',
          notes: data.notes || ''
        });
        
      } catch (err) {
        console.error('獲取客戶錯誤:', err);
        setLoadError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };
    
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);
  
  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除該欄位的錯誤
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // 必填欄位驗證
    if (!formData.name.trim()) {
      newErrors.name = '客戶姓名為必填欄位';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '電子郵件為必填欄位';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }
    
    // 電話格式驗證 (選填，但如果填了需要符合格式)
    if (formData.phone && !/^[0-9+\-\s()]{8,15}$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的電話號碼';
    }
    
    // 統一編號驗證 (選填，但如果填了需要符合格式)
    if (formData.companyId && !/^\d{8}$/.test(formData.companyId)) {
      newErrors.companyId = '請輸入有效的8位數統一編號';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 先進行前端驗證
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '更新客戶失敗');
      }
      
      // 提交成功
      setSubmitSuccess(true);
      
      // 2秒後跳轉到客戶詳情頁
      setTimeout(() => {
        router.push(`/admin/bakery/customers/${customerId}`);
      }, 2000);
      
    } catch (err) {
      console.error('更新客戶錯誤:', err);
      setSubmitError(err instanceof Error ? err.message : '更新客戶時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600">正在加載客戶資料...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            錯誤: {loadError}
          </div>
          <div className="flex justify-center">
            <Link href="/admin/bakery/customers" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              返回客戶列表
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">編輯客戶</h1>
        <div className="flex gap-2">
          <Link href={`/admin/bakery/customers/${customerId}`} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
            返回詳情
          </Link>
          <Link href="/admin/bakery/customers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
            返回列表
          </Link>
        </div>
      </div>
      
      {/* 成功訊息 */}
      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          客戶資料更新成功！正在跳轉回客戶詳情頁...
        </div>
      )}
      
      {/* 錯誤訊息 */}
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          錯誤: {submitError}
        </div>
      )}
      
      {/* 表單 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">基本資訊</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
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
                      className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      電話
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      客戶狀態
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="active">活躍</option>
                      <option value="inactive">非活躍</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                      行業別
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">請選擇行業別</option>
                      {industryOptions.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 公司信息 */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">公司資訊</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div>
                    <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                      統一編號
                    </label>
                    <input
                      type="text"
                      id="companyId"
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleInputChange}
                      placeholder="8位數字"
                      className={`w-full px-3 py-2 border ${errors.companyId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.companyId && (
                      <p className="mt-1 text-sm text-red-500">{errors.companyId}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 地址信息 */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">地址資訊</h2>
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
              </div>
              
              {/* 附加信息 */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">附加資訊</h2>
                <div>
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
                  ></textarea>
                </div>
              </div>
              
              {/* 提交按鈕 */}
              <div className="col-span-1 md:col-span-2 flex justify-end space-x-2 mt-4">
                <Link 
                  href={`/admin/bakery/customers/${customerId}`}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center ${(isSubmitting || submitSuccess) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      處理中...
                    </>
                  ) : (
                    '更新客戶資料'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
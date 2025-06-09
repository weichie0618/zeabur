'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast'; // 引入 toast 通知和 Toaster 元件

// 定義客戶表單類型
interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  companyId: string;
  status: string;
  notes: string;
  displayName: string;  // LINE顯示名稱
  customerId: string;   // 客戶編號
  carrier: string;      // 載具
  taxId: string;        // 統編
}

// 定義表單錯誤類型
interface FormErrors {
  [key: string]: string;
}

// API 響應類型
interface ApiResponse {
  status: string;
  message: string;
  data: {
    lineUser: {
      id: number;
      lineId: string;
      customerId: string;
      displayName: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      carrier: string | null; // 新增 carrier 欄位
      taxId: string | null;   // 新增 taxId 欄位
      createdAt: string;      // 更新為必填欄位
      updatedAt: string;      // 更新為必填欄位
    };
    customer: {              // 新增 customer 物件
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      companyName: string;
      location: string;      // 新增 location 欄位
      status: string;
     
      notes: string | null;  // 更新為可為 null
      created_at: string;    // 更新為必填欄位
      updated_at: string;    // 更新為必填欄位
    };
  };
}

export default function EditCustomer() {
  const params = useParams();
  const router = useRouter();
  const lineId = params.id; // 直接使用URL參數作為lineId
  
 
  // 初始化表單狀態
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    companyId: '',
    status: 'active',
    notes: '',
    displayName: '',
    customerId: '',
    carrier: '',
    taxId: ''
  });
  
  // 保存原始資料，用於比較變更
  const [originalData, setOriginalData] = useState<CustomerForm | null>(null);
  
  // 錯誤和提交狀態
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // 載入相關狀態
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 獲取認證頭部的通用函數
  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  };

  // 獲取客戶資料
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        
        // 直接使用lineId獲取完整LINE用戶數據
        const response = await fetch(`/api/customer/admin/lineusers/${lineId}`, {
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`無法獲取LINE用戶資料: ${response.status}`);
        }
        
        const responseData: ApiResponse = await response.json();
        
        if (responseData.status !== 'success') {
          throw new Error(responseData.message || '獲取LINE用戶資料失敗');
        }
        
        const lineUser = responseData.data.lineUser;
        
        // 設置表單初始值
        const initialData = {
          name: lineUser.name || '',
          email: lineUser.email || '',
          phone: lineUser.phone || '',
          address: lineUser.address || '',
          companyName: responseData.data.customer.companyName || '',
          companyId: lineUser.taxId || '', // 更新為使用 taxId
          status: responseData.data.customer.status || 'active',
          notes: responseData.data.customer.notes || '',
          displayName: lineUser.displayName || '',
          customerId: lineUser.customerId || '',
          carrier: lineUser.carrier || '',
          taxId: lineUser.taxId || ''
        };
        
        setFormData(initialData);
        setOriginalData(initialData); // 保存原始資料
        
      } catch (err) {
        console.error('獲取LINE用戶錯誤:', err);
        setLoadError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };
    
    if (lineId) {
      fetchCustomer();
    }
  }, [lineId]);
  
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
    
    // 電子郵件格式驗證 (如果填寫了)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }
    
    // 電話格式驗證 (如果填寫了)
    if (formData.phone && !/^[0-9+\-\s()]{8,15}$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的電話號碼';
    }
    
    // 統一編號驗證 (如果填寫了)
    if (formData.companyId && !/^\d{8}$/.test(formData.companyId)) {
      newErrors.companyId = '請輸入有效的8位數統一編號';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 檢查是否有變更
  const hasChanges = (): boolean => {
    if (!originalData) return false;
    
    // 只檢查API支援的欄位
    const fieldsToCheck = ['name', 'displayName', 'email', 'phone', 'address', 'customerId', 
                           'companyName', 'companyId', 'industry', 'status', 'notes', 'carrier', 'taxId'];
    
    return fieldsToCheck.some(field => formData[field as keyof CustomerForm] !== originalData[field as keyof CustomerForm]);
  };
  
  // 準備提交資料 (只提交已變更的欄位)
  const prepareSubmitData = () => {
    if (!originalData) return formData;
    
    const changedData: Partial<CustomerForm> = {};
    
    Object.keys(formData).forEach(key => {
      const typedKey = key as keyof CustomerForm;
      if (formData[typedKey] !== originalData[typedKey]) {
        changedData[typedKey] = formData[typedKey];
      }
    });
    
    return changedData;
  };
  
  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 檢查是否有變更
    if (!hasChanges()) {
      toast('沒有變更需要保存');
      return;
    }
    
    // 進行前端驗證
    if (!validateForm()) {
      toast.error('請修正表單中的錯誤');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // 準備只發送變更的欄位
      const submitData = prepareSubmitData();
      
      // 使用lineId更新LINE用戶
      const response = await fetch(`/api/customer/admin/lineusers/${lineId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(submitData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '更新LINE用戶失敗');
      }
      
      // 提交成功
      setSubmitSuccess(true);
      toast.success('LINE用戶資料更新成功！');
      
      // 更新原始資料
      setOriginalData({...formData});
      
      // 1.5秒後跳轉到客戶詳情頁
      setTimeout(() => {
        router.push(`/admin/bakery/customers/${lineId}`);
      }, 1500);
      
    } catch (err) {
      console.error('更新LINE用戶錯誤:', err);
      const errorMessage = err instanceof Error ? err.message : '更新LINE用戶時發生錯誤';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 返回上一頁
  const handleCancel = () => {
    if (hasChanges()) {
      if (window.confirm('您有未保存的變更，確定要離開嗎？')) {
        router.back();
      }
    } else {
      router.back();
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
      {/* Toaster 元件用於顯示通知 */}
      <Toaster position="top-right" />
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">編輯LINE用戶</h1>
        <div className="flex gap-2">
          <Link href={`/admin/bakery/customers/${lineId}`} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
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
          LINE用戶資料更新成功！正在跳轉回用戶詳情頁...
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
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                      LINE暱稱
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">LINE上顯示的用戶名稱</p>
                  </div>
                  
                  <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                    客戶業主編號
                    </label>
                    <input
                      type="text"
                      id="customerId"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">自定義客戶識別碼</p>
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      姓名(收件人)
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
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
                      placeholder="例如: 0912-345-678"
                      className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                      載具
                    </label>
                    <input
                      type="text"
                      id="carrier"
                      name="carrier"
                      value={formData.carrier}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">電子發票載具</p>
                  </div>
                  
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                      統編
                    </label>
                    <input
                      type="text"
                      id="taxId"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">統一編號</p>
                  </div>
                </div>
              </div>
              
              {/* 公司資訊 */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">客戶業主資訊</h2>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      公司名稱
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                      {formData.companyName || '無公司資料'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">公司資訊僅供查看</p>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      地址
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                      {formData.address || '無地址資料'}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      備註
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                      {formData.notes || '無備註'}
                    </div>
                  </div>
                </div>
              </div>
              
              
              
              {/* 提交按鈕 */}
              <div className="col-span-1 md:col-span-2 flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess || !hasChanges()}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center ${(isSubmitting || submitSuccess || !hasChanges()) ? 'opacity-70 cursor-not-allowed' : ''}`}
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
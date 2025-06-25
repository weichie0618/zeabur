'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useLiff } from '@/lib/LiffProvider';

// 虛擬點數卡項目接口
interface VirtualCardItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  product_type: 'virtual_card';
  virtual_card_id: number;
  points_value: number;
  description: string;
}

// 表單驗證狀態接口
interface FormValidation {
  name: boolean;
  email: boolean;
  phone: boolean;
}

// 客戶資料介面
interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
  lineId?: string;
}

// LINE 用戶接口
interface LineUser {
  id: number;
  lineId: string;
  displayName?: string;
  name?: string;
}

export default function VirtualCardCheckoutPage() {
  const router = useRouter();
  const { liff, profile, isLoggedIn, isLoading: liffLoading, customerData, updateCustomerData } = useLiff();
  
  // 狀態管理
  const [cart, setCart] = useState<VirtualCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'line_pay' | 'bank_transfer'>('line_pay');
  
  // 表單資料
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: ''
  });
  
  const [validation, setValidation] = useState<FormValidation>({
    name: true,
    email: true,
    phone: true
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // 手動 LIFF 初始化狀態
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);

  // 從 localStorage 獲取客戶資料的輔助函數
  const getCustomerDataFromLocalStorage = (): CustomerData | null => {
    try {
      const savedCustomerData = localStorage.getItem('customerData');
      if (savedCustomerData) {
        const parsedData = JSON.parse(savedCustomerData);
        console.log('從 localStorage 讀取到客戶資料:', parsedData);
        return parsedData;
      }
    } catch (e) {
      console.error('解析本地客戶資料失敗', e);
    }
    return null;
  };

  // 獲取 LINE 用戶 ID
  const getLineUserId = useCallback((): string | null => {
    // 首先嘗試從 LIFF SDK 獲取
    if (isLoggedIn && profile && profile.userId) {
      console.log('從 LIFF SDK 成功獲取 LINE 用戶 ID:', profile.userId);
      return profile.userId;
    }
    
    // 嘗試從 localStorage 獲取
    const localCustomerData = getCustomerDataFromLocalStorage();
    if (localCustomerData && localCustomerData.lineId) {
      console.log('從 localStorage 成功獲取 LINE 用戶 ID:', localCustomerData.lineId);
      return localCustomerData.lineId;
    }
    
    console.warn('無法獲取 LINE 用戶 ID');
    return null;
  }, [isLoggedIn, profile]);

  // 獲取 LINE 用戶資料
  const getOrCreateLineUser = useCallback(async (): Promise<LineUser | null> => {
    const lineUserId = getLineUserId();
    if (!lineUserId) return null;

    try {
      // 檢查用戶是否存在
      const checkResponse = await fetch('/api/customer/line/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineId: lineUserId
        }),
      });

      const checkData = await checkResponse.json();
      
      if (checkData.data) {
        return checkData.data;
      }

      return null;
    } catch (error) {
      console.error('獲取LINE用戶失敗:', error);
      return null;
    }
  }, [getLineUserId]);

  // 載入購物車中的虛擬點數卡
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('bakeryCart');
        if (savedCart) {
          const allItems = JSON.parse(savedCart);
          // 只取虛擬點數卡項目
          const virtualCardItems = allItems.filter((item: any) => item.product_type === 'virtual_card');
          setCart(virtualCardItems);
        }
      } catch (error) {
        console.error('無法載入購物車資料', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  // 如果有LIFF用戶資料，自動填充表單
  useEffect(() => {
    if (isLoggedIn && profile && !liffLoading) {
      console.log('從 LIFF 獲取到用戶資料:', profile);
      setFormData(prev => ({
        ...prev,
        customerName: profile.displayName || prev.customerName,
        email: profile.email || prev.email,
      }));
    }
  }, [isLoggedIn, profile, liffLoading]);

  // 如果有客戶資料，自動填充表單
  useEffect(() => {
    // 先檢查從 LiffProvider 中獲取的客戶資料
    if (customerData) {
      console.log('從 LiffProvider 中獲取的客戶資料:', customerData);
      setFormData(prev => ({
        ...prev,
        customerName: customerData.name || prev.customerName,
        email: customerData.email || prev.email,
        phone: customerData.phone || prev.phone,
      }));
    } else {
      // 嘗試從 localStorage 加載客戶數據
      const localCustomerData = getCustomerDataFromLocalStorage();
      if (localCustomerData) {
        setFormData(prev => ({
          ...prev,
          customerName: localCustomerData.name || prev.customerName,
          email: localCustomerData.email || prev.email,
          phone: localCustomerData.phone || prev.phone,
        }));
      }
    }
  }, [customerData]);

  // 處理輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除對應欄位的錯誤狀態
    if (validation[name as keyof FormValidation] === false) {
      setValidation(prev => ({ ...prev, [name]: true }));
    }
  };

  // 表單驗證
  const validateForm = (): boolean => {
    const newValidation: FormValidation = {
      name: formData.customerName.trim() !== '',
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      phone: /^[0-9-+().\s]{8,}$/.test(formData.phone)
    };

    setValidation(newValidation);
    return Object.values(newValidation).every(valid => valid);
  };

  // 計算總金額
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPoints = cart.reduce((sum, item) => sum + (item.points_value * item.quantity), 0);

  // LIFF 腳本載入完成處理
  const handleLiffScriptLoad = () => {
    console.log('LIFF 腳本載入完成');
    setIsLiffScriptLoaded(true);
  };

  // 手動初始化 LIFF
  const initializeLiffManually = async () => {
    if (!window.liff) {
      console.error('LIFF SDK 未載入');
      return;
    }

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      console.error('LIFF ID 未設定');
      return;
    }

    try {
      console.log('開始手動初始化 LIFF...');
      await window.liff.init({ liffId });
      console.log('LIFF 手動初始化成功');
      setManualLiff(window.liff);
      
      if (window.liff.isLoggedIn()) {
        console.log('用戶已登入');
      } else if (window.liff.isInClient()) {
        console.log('在 LINE 中但未登入，自動登入...');
        window.liff.login();
      }
    } catch (error) {
      console.error('LIFF 手動初始化失敗:', error);
    }
  };

  // 當 LIFF 腳本載入完成且沒有從 LiffProvider 獲取到 LIFF 時，嘗試手動初始化
  useEffect(() => {
    if (isLiffScriptLoaded && !liff && !manualLiff) {
      console.log('嘗試手動初始化 LIFF...');
      initializeLiffManually();
    }
  }, [isLiffScriptLoaded, liff, manualLiff]);

  // 處理結帳提交
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFormError('請填寫所有必填欄位並確保格式正確');
      return;
    }

    // 檢查購物車是否為空
    if (cart.length === 0) {
      setFormError('購物車中沒有虛擬點數卡商品');
      return;
    }

    // 獲取 LINE 用戶 ID
    const lineUserId = getLineUserId();
    
    if (!lineUserId) {
      const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);
      
      if (currentIsLoggedIn) {
        setFormError('無法獲取您的 LINE 用戶 ID，請重新整理頁面後再試');
      } else {
        setFormError('請先登入 LINE');
        
        // 嘗試登入
        const currentLiff = liff || manualLiff;
        if (currentLiff && currentLiff.login) {
          try {
            currentLiff.login();
          } catch (error) {
            console.error('LIFF 登入失敗:', error);
          }
        }
      }
      return;
    }

    setFormError(null);
    setSubmitting(true);
    setPaymentStatus('processing');

    // 將客戶資料保存到 Context 和 localStorage
    const customerDataToSave = {
      name: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      lineId: lineUserId
    };
    
    updateCustomerData(customerDataToSave);
    console.log('虛擬點數卡結帳頁面: 已更新客戶資料', customerDataToSave);

    try {
      // 獲取 LINE 用戶資料來取得內部 ID
      const user = await getOrCreateLineUser();
      if (!user) {
        setFormError('無法獲取用戶資料，請稍後再試');
        setSubmitting(false);
        setPaymentStatus('failed');
        return;
      }

      // 處理每個虛擬點數卡的購買
      const purchasePromises = cart.map(async (item) => {
        for (let i = 0; i < item.quantity; i++) {
          const response = await fetch('/api/points/virtual-cards/purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lineUserId: user.id,
              virtualCardProductId: item.virtual_card_id,
              paymentMethod: paymentMethod,
              ipAddress: undefined,
              userAgent: navigator.userAgent,
              notes: `從LINE點數商城購買 ${item.name}`
            }),
          });

          const data = await response.json();
          
          if (!data.success) {
            throw new Error(`購買 ${item.name} 失敗：${data.message}`);
          }
        }
      });

      await Promise.all(purchasePromises);

      // 購買成功
      setPaymentStatus('success');
      
      // 清空購物車中的虛擬點數卡
      const allItems = JSON.parse(localStorage.getItem('bakeryCart') || '[]');
      const remainingItems = allItems.filter((item: any) => item.product_type !== 'virtual_card');
      localStorage.setItem('bakeryCart', JSON.stringify(remainingItems));

      // 跳轉到確認頁面
      const confirmationParams = new URLSearchParams({
        type: 'virtual_card',
        totalAmount: totalAmount.toString(),
        totalPoints: totalPoints.toString(),
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0).toString(),
        paymentMethod: paymentMethod
      });

      router.push(`/client/bakery/points/purchase/confirmation?${confirmationParams.toString()}`);

    } catch (error: any) {
      console.error('購買失敗:', error);
      setFormError(error.message || '購買過程中發生錯誤，請稍後再試');
      setPaymentStatus('failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 檢查 LIFF 狀態
  const currentLiff = liff || manualLiff;
  const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);

  // 載入中狀態
  if (loading || (liffLoading && !manualLiff)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // 購物車為空
  if (cart.length === 0) {
    return (
      <>
        <Script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          onLoad={handleLiffScriptLoad}
        />
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">購物車中沒有虛擬點數卡</h3>
              <p className="text-gray-600 mb-4">請先選擇您要購買的虛擬點數卡</p>
              <Link 
                href="/client/bakery/points/purchase" 
                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                前往選購
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        onLoad={handleLiffScriptLoad}
      />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 頁面標題 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">虛擬點數卡結帳</h1>
          <p className="text-gray-600">確認您的訂單資訊並完成付款</p>
          
          {/* 返回連結 */}
          <div className="mt-4">
            <Link 
              href="/client/bakery/points/purchase" 
              className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回商品選購
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：訂單摘要 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">訂單摘要</h2>
              
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">數量: {item.quantity}</span>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">NT$ {(item.price * item.quantity).toLocaleString()}</div>
                          <div className="text-sm text-amber-600">獲得 {(item.points_value * item.quantity).toLocaleString()} 點</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 總計 */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">總金額</span>
                  <span className="text-xl font-bold text-gray-900">NT$ {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">總獲得點數</span>
                  <span className="text-xl font-bold text-amber-600">{totalPoints.toLocaleString()} 點</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：客戶資訊和付款方式 */}
          <div className="space-y-6">
            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              {/* 客戶資訊 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">客戶資訊</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        !validation.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="請輸入您的姓名"
                    />
                    {!validation.name && (
                      <p className="text-red-500 text-xs mt-1">請輸入姓名</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        !validation.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="請輸入您的電子郵件"
                    />
                    {!validation.email && (
                      <p className="text-red-500 text-xs mt-1">請輸入有效的電子郵件地址</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      手機號碼 *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        !validation.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="請輸入您的手機號碼"
                    />
                    {!validation.phone && (
                      <p className="text-red-500 text-xs mt-1">請輸入有效的手機號碼</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 付款方式 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">付款方式</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="line_pay"
                      checked={paymentMethod === 'line_pay'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'line_pay')}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium mr-3">
                        LINE Pay
                      </div>
                      <span className="text-gray-700">LINE Pay 付款</span>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'bank_transfer')}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-medium mr-3">
                        匯款
                      </div>
                      <span className="text-gray-700">銀行轉帳</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 錯誤訊息 */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700">{formError}</span>
                  </div>
                </div>
              )}

              {/* 提交按鈕 */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-all duration-200 ${
                  submitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    處理中...
                  </div>
                ) : (
                  `確認購買 - NT$ ${totalAmount.toLocaleString()}`
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 購買須知 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            購買須知
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              點數卡購買後，點數會立即加入您的帳戶
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              點數可用於購物時折抵現金，1點 = 1元
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              點數無使用期限，請安心購買
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              如有任何問題，請聯繫客服人員
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

// 擴展 Window 介面以支援 LIFF
declare global {
  interface Window {
    liff: any;
  }
} 
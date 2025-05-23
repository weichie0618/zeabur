'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLiff } from '@/lib/LiffProvider';

// 表單驗證狀態接口
interface FormValidation {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
}

// 訂單資料接口
interface OrderData {
  items: {
    product_id: number;
    quantity: number;
  }[];
  customer_details: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  shipping_method: string;
  salesperson_code?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { liff, profile, isLoggedIn, isLoading: liffLoading, customerData, updateCustomerData } = useLiff();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'takkyubin'>('takkyubin');
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [validation, setValidation] = useState<FormValidation>({
    name: true,
    email: true,
    phone: true,
    address: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // 從 localStorage 獲取購物車資料
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('bakeryCart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('無法載入購物車資料', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
    
    // 嘗試從 localStorage 加載客戶數據（不依賴於 LIFF）
    try {
      const savedCustomerData = localStorage.getItem('customerData');
      if (savedCustomerData) {
        const parsedData = JSON.parse(savedCustomerData);
        console.log('從 localStorage 讀取到客戶資料:', parsedData);
        
        // 調試輸出 lineId 資訊
        if (parsedData && parsedData.lineId) {
          console.log('從 localStorage 讀取到 LINE ID:', parsedData.lineId);
        } else {
          console.warn('localStorage 中的客戶資料不包含 LINE ID');
        }
        
        if (parsedData) {
          setFormData(prev => ({
            ...prev,
            customerName: parsedData.name || prev.customerName,
            email: parsedData.email || prev.email,
            phone: parsedData.phone || prev.phone,
            address: parsedData.address || prev.address
          }));
        }
      }
    } catch (e) {
      console.error('解析本地客戶資料失敗', e);
    }
  }, []);

  // 如果有LIFF用戶資料，自動填充表單
  useEffect(() => {
    if (isLoggedIn && profile && !liffLoading) {
      console.log('從 LIFF 獲取到用戶資料:', profile);
      console.log('LINE 用戶 ID:', profile.userId || '未獲取到 ID');
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
        address: customerData.address || prev.address
      }));
      console.log('已從 LiffProvider 中獲取的客戶資料自動填充表單', customerData);
      return;
    }

    // 如果沒有從 LiffProvider 獲取資料，則檢查本地儲存
    if (isLoggedIn && !liffLoading && profile && profile.userId) {
      console.log('LINE 用戶已登入，ID:', profile.userId);
      
      const savedCustomerData = localStorage.getItem('customerData');
      if (savedCustomerData) {
        try {
          const parsedData = JSON.parse(savedCustomerData);
          setFormData(prev => ({
            ...prev,
            customerName: parsedData.name || prev.customerName,
            email: parsedData.email || prev.email,
            phone: parsedData.phone || prev.phone,
            address: parsedData.address || prev.address
          }));
          console.log('已從儲存的客戶資料中自動填充表單', parsedData);
        } catch (e) {
          console.error('解析客戶資料失敗', e);
        }
      }
    }
  }, [isLoggedIn, liffLoading, profile, customerData]);

  // 購物車為空時，導回首頁
  useEffect(() => {
    if (!loading && cart.length === 0) {
      router.push('/client/bakery');
    }
  }, [cart, loading, router]);

  // 計算總金額
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // 表單值變更處理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 重置此欄位的驗證狀態
    setValidation({
      ...validation,
      [name.replace('customer', '').toLowerCase()]: true
    });
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newValidation = {
      name: !!formData.customerName,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      phone: /^09\d{8}$/.test(formData.phone),
      address: !!formData.address
    };

    setValidation(newValidation);
    return Object.values(newValidation).every(v => v);
  };

  // 處理結帳提交
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFormError('請填寫所有必填欄位並確保格式正確');
      return;
    }

    // 檢查是否在 LINE 應用內
    if (liff && !liff.isInClient()) {
      setFormError('請在 LINE 應用內完成訂單，以確保能正確關聯您的 LINE 帳號');
      return;
    }

    // 從 LIFF SDK 或 localStorage 獲取 LINE ID
    let lineUserId: string | null = null;
    
    // 首先嘗試從 LIFF SDK 獲取
    if (isLoggedIn && profile && profile.userId) {
      lineUserId = profile.userId;
      console.log('從 LIFF SDK 成功獲取 LINE 用戶 ID:', lineUserId);
    } else {
      console.warn('無法從 LIFF SDK 獲取 LINE 用戶 ID，嘗試從 localStorage 讀取');
      
      // 嘗試從 localStorage 獲取
      try {
        const savedCustomerData = localStorage.getItem('customerData');
        if (savedCustomerData) {
          const parsedData = JSON.parse(savedCustomerData);
          if (parsedData && parsedData.lineId) {
            lineUserId = parsedData.lineId;
            console.log('從 localStorage 成功獲取 LINE 用戶 ID:', lineUserId);
          }
        }
      } catch (error) {
        console.error('從 localStorage 解析 LINE 用戶 ID 失敗:', error);
      }
    }
    
    // 如果仍然無法獲取 LINE ID，顯示錯誤並中止提交
    if (!lineUserId) {
      console.error('未能獲取 LINE 用戶 ID (LIFF 和 localStorage 均失敗)');
      
      // 顯示適當的錯誤訊息
      if (!isLoggedIn) {
        setFormError('您尚未登入 LINE，請重新登入後再試');
      } else if (!profile) {
        setFormError('無法獲取您的 LINE 個人資料，請確認已授權應用存取您的資料');
      } else {
        setFormError('無法獲取您的 LINE 用戶 ID，請確保您已在 LINE 應用中登入並授權');
      }
      
      // 如果 LIFF 物件存在，嘗試重新登入
      if (liff && !isLoggedIn) {
        setTimeout(() => {
          try {
            liff.login();
          } catch (error) {
            console.error('LIFF 登入失敗', error);
          }
        }, 2000);
      }
      
      return;
    }

    setFormError(null);
    setSubmitting(true);
    setPaymentStatus('processing');

    // 將當前客戶資料保存到 Context 和 localStorage
    const customerDataToSave = {
      name: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address
    };
    
    // 使用 LiffProvider 提供的方法更新客戶資料
    updateCustomerData(customerDataToSave);
    console.log('結帳頁面: 已更新客戶資料', customerDataToSave);

    // 準備訂單資料（根據新的 API 規格調整）
    const orderData = {
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      customer_info: {
        name: formData.customerName,
        email: formData.email,
        phone: formData.phone
      },
      shipping_address: {
        recipientName: formData.customerName,
        phone: formData.phone,
        address1: formData.address,
        city: "", // 可以根據需求添加這些字段
        postal_code: ""
      },
      // 選填項目
      salesperson_code: "",
      // 使用獲取到的 LINE 用戶 ID
      lineid: lineUserId
    };

    // LINE 用戶資訊記錄（用於調試）
    console.log('LINE 用戶資訊已添加至訂單:', {
      userId: lineUserId,
      displayName: profile?.displayName || '未獲取'
    });

    try {
      // 呼叫後端 API 建立訂單
      const response = await fetch('/api/orders/create/bakery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '建立訂單失敗');
      }

      // 導向訂單確認頁面
      const orderItems = data.order.items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }));
      
      // 將訂單數據編碼為 URL 安全的字符串
      const encodedItems = encodeURIComponent(JSON.stringify(orderItems));
      
      router.push(`/client/checkout/confirmation?orderNumber=${data.order.order_number}&orderId=${data.order.id}&totalAmount=${data.order.total_amount}&items=${encodedItems}`);

      // 清空購物車
      localStorage.removeItem('bakeryCart');
      
      setPaymentStatus('success');
    } catch (error) {
      console.error('結帳失敗', error);
      setFormError('結帳過程中發生錯誤，請稍後再試');
      setPaymentStatus('failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">結帳</h1>
        <div className="h-1 w-20 bg-amber-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側 - 購物車商品概覽與顧客資料輸入表單 */}
        <div className="lg:col-span-2">
          {/* 商品列表 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">訂購商品</h2>
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.id} className="py-4 flex items-center">
                  <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                    <Image 
                      src={item.images} 
                      alt={item.name} 
                      fill 
                      style={{ objectFit: 'cover' }} 
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">數量: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">小計</span>
                <span className="font-medium">${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 font-medium">運費</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between items-center mt-4 text-lg">
                <span className="font-bold">總計</span>
                <span className="font-bold text-amber-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 顧客資料表單 */}
          <form onSubmit={handleCheckoutSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">顧客資料</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="customerName" className="block text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="請輸入您的姓名"
                  required
                />
                {!validation.name && <p className="text-red-500 text-sm mt-1">請輸入姓名</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-1">電子郵件 *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="example@email.com"
                  required
                />
                {!validation.email && <p className="text-red-500 text-sm mt-1">請輸入有效的電子郵件</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-1">手機號碼 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="09XXXXXXXX"
                  required
                />
                {!validation.phone && <p className="text-red-500 text-sm mt-1">請輸入有效的手機號碼（格式：09XXXXXXXX）</p>}
              </div>
              
              <div>
                <label htmlFor="address" className="block text-gray-700 mb-1">收件地址 *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="請輸入您的詳細地址"
                  required
                />
                {!validation.address && <p className="text-red-500 text-sm mt-1">請輸入收件地址</p>}
              </div>
            </div>
            
            {/* 只在開發環境顯示的 Debug 信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 bg-gray-100 p-3 rounded-md text-xs">
                <div className="flex justify-between mb-2">
                  <span>Debug 模式</span>
                  <button 
                    type="button"
                    onClick={() => {
                      // 檢查 localStorage 中的 LINE ID
                      let localStorageLineId = '未獲取';
                      try {
                        const savedData = localStorage.getItem('customerData');
                        if (savedData) {
                          const parsedData = JSON.parse(savedData);
                          localStorageLineId = parsedData.lineId || '未獲取';
                        }
                      } catch (e) {
                        localStorageLineId = '解析錯誤';
                      }
                      
                      console.log('目前顧客資料狀態:', {
                        formData,
                        customerData,
                        profile,
                        lineIdFromProfile: profile?.userId || '未獲取',
                        lineIdFromLocalStorage: localStorageLineId,
                        localStorage: localStorage.getItem('customerData')
                          ? JSON.parse(localStorage.getItem('customerData') || '{}')
                          : null
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    檢查數據
                  </button>
                </div>
                <div>
                  <div>Profile: {profile ? '已載入' : '未載入'}</div>
                  <div>CustomerData: {customerData ? '已載入' : '未載入'}</div>
                  <div>LINE ID (LIFF): {profile?.userId || '未獲取'}</div>
                  <div>LINE ID (localStorage): {(() => {
                    try {
                      const savedData = localStorage.getItem('customerData');
                      if (savedData) {
                        const parsedData = JSON.parse(savedData);
                        return parsedData.lineId || '未獲取';
                      }
                      return '未獲取';
                    } catch (e) {
                      return '解析錯誤';
                    }
                  })()}</div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 右側 - 付款方式與確認訂單 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">配送方式</h2>
            <div className="space-y-3">
              <div 
                className="border rounded-md p-3 flex items-center border-amber-500 bg-amber-50"
              >
                <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                  <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                </div>
                <div className="flex-grow">
                  <div className="font-medium">黑貓宅配(冷凍)</div>
                  <div className="text-sm text-gray-500">全台配送，商品以低溫冷凍宅配</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <button 
              type="submit"
              onClick={handleCheckoutSubmit}
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-md mb-4 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : (
                <>確認訂單</>
              )}
            </button>
            
           
            
            <Link href="/client/bakery" className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 rounded-md flex items-center justify-center text-center transition-colors">
              返回購物
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
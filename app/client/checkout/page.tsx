'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'atm' | 'cvs'>('credit');
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
  }, []);

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

    setFormError(null);
    setSubmitting(true);
    setPaymentStatus('processing');

    // 準備訂單資料（根據 API 規格調整）
    const orderData: OrderData = {
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      customer_details: {
        name: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      },
      shipping_method: "home_delivery"
      // 如果需要業務人員代碼，可以在這裡加入
      // salesperson_code: "XXXX"
    };

    try {
      // 呼叫後端 API 建立訂單
      const response = await fetch('/api/orders/create', {
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

      // 根據支付方式，導向不同頁面
      if (paymentMethod === 'credit') {
        // 使用 API 回傳的 ecpay_form，但採用更安全的DOM操作方式
        const formContainer = document.createElement('div');
        formContainer.innerHTML = data.ecpay_form;
        document.body.appendChild(formContainer);
        
        // 確保表單立即提交
        const form = formContainer.querySelector('form');
        if (form) {
          form.submit();
        } else {
          throw new Error('無法找到綠界付款表單');
        }
        
        // 清空購物車後會由綠界支付頁導向結果頁
      } else if (paymentMethod === 'atm') {
        // 保存訂單和付款資訊
        localStorage.setItem('atmPaymentInfo', JSON.stringify({
          order_id: data.order_id,
          order_number: data.order_number,
          ...data
        }));
        router.push('/client/payment/atm?orderId=' + data.order_id);
      } else if (paymentMethod === 'cvs') {
        // 保存訂單和付款資訊
        localStorage.setItem('cvsPaymentInfo', JSON.stringify({
          order_id: data.order_id,
          order_number: data.order_number,
          ...data
        }));
        router.push('/client/payment/cvs?orderId=' + data.order_id);
      }

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
          </form>
        </div>

        {/* 右側 - 付款方式與確認訂單 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">選擇付款方式</h2>
            <div className="space-y-3">
              <div 
                className={`border rounded-md p-3 flex items-center cursor-pointer ${paymentMethod === 'credit' ? 'border-amber-500 bg-amber-50' : ''}`}
                onClick={() => setPaymentMethod('credit')}
              >
                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'credit' ? 'border-amber-600' : 'border-gray-300'}`}>
                  {paymentMethod === 'credit' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">信用卡付款</div>
                  <div className="text-sm text-gray-500">支援VISA, MasterCard, JCB</div>
                </div>
                <div className="flex space-x-1">
                  <div className="w-10 h-6 bg-gray-100 rounded"></div>
                  <div className="w-10 h-6 bg-gray-100 rounded"></div>
                  <div className="w-10 h-6 bg-gray-100 rounded"></div>
                </div>
              </div>
              
              <div 
                className={`border rounded-md p-3 flex items-center cursor-pointer ${paymentMethod === 'atm' ? 'border-amber-500 bg-amber-50' : ''}`}
                onClick={() => setPaymentMethod('atm')}
              >
                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'atm' ? 'border-amber-600' : 'border-gray-300'}`}>
                  {paymentMethod === 'atm' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">ATM轉帳</div>
                  <div className="text-sm text-gray-500">取得專屬虛擬帳號</div>
                </div>
              </div>
              
              <div 
                className={`border rounded-md p-3 flex items-center cursor-pointer ${paymentMethod === 'cvs' ? 'border-amber-500 bg-amber-50' : ''}`}
                onClick={() => setPaymentMethod('cvs')}
              >
                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'cvs' ? 'border-amber-600' : 'border-gray-300'}`}>
                  {paymentMethod === 'cvs' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">超商繳費</div>
                  <div className="text-sm text-gray-500">7-11, 全家, 萊爾富, OK</div>
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
                <>確認訂單並付款</>
              )}
            </button>
            
            <Link href="/client/bakery" className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 rounded-md flex items-center justify-center text-center transition-colors">
              返回購物
            </Link>
            
            <div className="mt-6 text-xs text-gray-500">
              <p>點擊「確認訂單並付款」，即表示您同意我們的</p>
              <div className="flex space-x-1 mt-1">
                <a href="/terms" className="text-amber-600 hover:underline">服務條款</a>
                <span>和</span>
                <a href="/privacy" className="text-amber-600 hover:underline">隱私政策</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
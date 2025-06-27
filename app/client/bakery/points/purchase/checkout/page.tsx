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

// LINE 用戶接口
interface LineUser {
  id: number;
  lineId: string;
  displayName?: string;
  name?: string;
}

export default function VirtualCardCheckoutPage() {
  const router = useRouter();
  const { liff, profile, isLoggedIn, isLoading: liffLoading } = useLiff();
  
  // 狀態管理
  const [cart, setCart] = useState<VirtualCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer'>('bank_transfer');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // 手動 LIFF 初始化狀態
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);

  // 獲取 LINE 用戶 ID
  const getLineUserId = useCallback((): string | null => {
    // 從 LIFF SDK 獲取
    if (isLoggedIn && profile && profile.userId) {
      console.log('從 LIFF SDK 成功獲取 LINE 用戶 ID:', profile.userId);
      return profile.userId;
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
        const savedCart = localStorage.getItem('pointsCart');
        if (savedCart) {
          const cartItems = JSON.parse(savedCart);
          // 確保是陣列格式
          if (Array.isArray(cartItems)) {
            setCart(cartItems);
          }
        }
      } catch (error) {
        console.error('無法載入購物車資料', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);



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
      
      // 清空點數購物車
      localStorage.removeItem('pointsCart');

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">點數結帳</h1>
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
            
              
              {cart.map((item) => (
                <div key={item.id} className="space-y-6">
                  {/* 真實點數卡設計 */}
                  <div className="relative">
                    {/* 點數卡主體 - 適合手機的尺寸 */}
                    <div className="relative w-full max-w-xs mx-auto aspect-[1.6/1] bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl shadow-xl overflow-hidden">
                      
                      {/* 烘焙主題背景紋理 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-amber-400/25 to-orange-600/35"></div>
                      
                      {/* 測試背景 - 確保背景可見 */}
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white/60 rounded-full border border-white/80"></div>
                      <div className="absolute top-1 right-1 w-3 h-3 bg-orange-300/80 rounded-full"></div>
                      
                      {/* 卡片背景裝飾 - 烘焙主題 */}
                      <div className="absolute inset-0">
                        {/* 烘焙背景圖案 */}
                        <div className="absolute inset-0 opacity-40">
                          {/* 小麥穗裝飾 */}
                          <div className="absolute top-2 left-2">
                            <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l-1 2.5v3l1-2.5 1 2.5v-3L12 2zm0 6l-1 2.5v3l1-2.5 1 2.5v-3L12 8zm0 6l-1 2.5v3l1-2.5 1 2.5v-3L12 14zm0 6l-1 2.5v1.5l1-2.5 1 2.5v-1.5L12 20zm-3-16l-.5 2v2.5l.5-2 .5 2V6l-.5-2zm6 0l-.5 2v2.5l.5-2 .5 2V6l-.5-2zM9 8l-.5 2v2.5l.5-2 .5 2V10l-.5-2zm6 0l-.5 2v2.5l.5-2 .5 2V10l-.5-2z"/>
                            </svg>
                          </div>
                          
                          {/* 麵包形狀裝飾 */}
                          <div className="absolute top-4 right-3">
                            <svg className="w-6 h-6 text-white/75" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.5 12c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5zm-8 0c0 1.93-1.57 3.5-3.5 3.5S3.5 13.93 3.5 12 5.07 8.5 7 8.5s3.5 1.57 3.5 3.5zm4-5c1.93 0 3.5 1.57 3.5 3.5S16.93 14 15 14s-3.5-1.57-3.5-3.5S13.07 7 15 7z"/>
                            </svg>
                          </div>
                          
                          {/* 麵粉雲朵效果 */}
                          <div className="absolute bottom-3 left-4">
                            <svg className="w-10 h-6 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6.5 20c-2.76 0-5-2.24-5-5 0-2.64 2.05-4.78 4.65-4.96C6.72 8.73 8.25 8 10 8c2.21 0 4 1.79 4 4 0 .34-.05.67-.14.98.86.8 1.39 1.93 1.39 3.02 0 2.21-1.79 4-4 4H6.5z"/>
                            </svg>
                          </div>
                          
                          {/* 麵包裝飾 */}
                          <div className="absolute bottom-5 right-6">
                            <svg className="w-5 h-5 text-white/75" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 9c0-1.1-.9-2-2-2s-2 .9-2 2c0 .74.4 1.38 1 1.72V19c0 .55.45 1 1 1s1-.45 1-1v-8.28c.6-.34 1-.98 1-1.72zm-8 0c0-1.1-.9-2-2-2s-2 .9-2 2c0 .74.4 1.38 1 1.72V19c0 .55.45 1 1 1s1-.45 1-1v-8.28c.6-.34 1-.98 1-1.72zm4-5c-2.21 0-4 1.79-4 4 0 1.1.45 2.1 1.17 2.83L12 17l.83-6.17C13.55 10.1 14 9.1 14 8c0-2.21-1.79-4-4-4z"/>
                            </svg>
                          </div>
                          
                          {/* 裝飾性小點點 (模擬麵粉) */}
                          <div className="absolute top-8 left-8 w-2 h-2 bg-white/60 rounded-full"></div>
                          <div className="absolute top-12 right-12 w-2.5 h-2.5 bg-white/55 rounded-full"></div>
                          <div className="absolute bottom-12 left-12 w-2 h-2 bg-white/65 rounded-full"></div>
                          <div className="absolute bottom-6 right-3 w-1.5 h-1.5 bg-white/70 rounded-full"></div>
                          <div className="absolute top-16 left-16 w-1 h-1 bg-white/80 rounded-full"></div>
                          
                          {/* 額外的烘焙元素 */}
                          {/* 麵包師帽 */}
                          <div className="absolute top-6 left-14">
                            <svg className="w-5 h-5 text-white/65" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.69 2 6 4.69 6 8c0 2.5 1.5 4.61 3.64 5.64C9.87 15.78 10.4 18 12 18s2.13-2.22 2.36-4.36C16.5 12.61 18 10.5 18 8c0-3.31-2.69-6-6-6zm0 14c-.83 0-1.5-.67-1.5-1.5S11.17 13 12 13s1.5.67 1.5 1.5S12.83 16 12 16z"/>
                            </svg>
                          </div>
                          
                          {/* 烘焙刷子 */}
                          <div className="absolute bottom-8 left-8 rotate-45">
                            <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 17h2v2H3v-2zm2-2h2v2H5v-2zm2-2h2v2H7v-2zm2-2h2v2H9v-2zm2-2h2v2h-2V9zm2-2h2v2h-2V7zm2-2h2v2h-2V5zm2-2h2v2h-2V3z"/>
                            </svg>
                          </div>
                          
                          {/* 烘焙溫度計 */}
                          <div className="absolute top-10 right-8">
                            <svg className="w-4 h-4 text-white/75" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-2V5c0-.55.45-1 1-1s1 .45 1 1v6h-2z"/>
                            </svg>
                          </div>
                          
                          {/* 星星裝飾 (品質象徵) */}
                          <div className="absolute bottom-10 right-4">
                            <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          
                          {/* 心形裝飾 (愛心烘焙) */}
                          <div className="absolute top-14 left-6">
                            <svg className="w-3.5 h-3.5 text-white/65" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* 溫暖烘焙色調漸層覆蓋 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/25 via-amber-100/15 to-yellow-200/30"></div>
                        
                        {/* 烘焙質感紋理 */}
                        <div className="absolute inset-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-orange-900/20"></div>
                          <div className="absolute inset-0 bg-gradient-to-tl from-amber-300/15 via-transparent to-white/20"></div>
                        </div>
                        
                        {/* 光澤效果 (模擬新鮮出爐的光澤) */}
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/25 to-transparent"></div>
                        
                        {/* 邊緣溫暖光暈 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-600/10 rounded-2xl"></div>
                        
                        {/* 烘焙紋理效果 */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 w-1/3 h-full animate-pulse"></div>
                        </div>
                        
                        {/* 專業烘焙質感 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/5 via-orange-300/10 to-amber-500/15 mix-blend-overlay"></div>
                      </div>

                      {/* 卡片內容 */}
                      <div className="relative h-full p-4 flex flex-col justify-between text-white">
                        
                        {/* 頂部區域 */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-bold text-black/50 tracking-wide opacity-90">BAKERY</div>
                           
                            <div className="text-xs text-black/50 opacity-80 mt-0.5">POINTS CARD</div>
                          </div>
                          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 overflow-hidden absolute right-3">
                            <img 
                              src="https://joinmeet.sunnyhausbakery.com.tw/sample/favicon.ico" 
                              alt="Bakery Logo" 
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                        </div>

                        {/* 中央點數顯示 */}
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-black drop-shadow-lg tracking-tight mb-1">
                              {Math.round(item.price).toLocaleString()}
                            </div>
                            <div className="text-xl font-semibold opacity-95 tracking-wider">點數</div>
                          </div>
                        </div>

                        {/* 底部資訊 */}
                        <div className="flex justify-between items-end text-xs">
                          
                         
                        </div>
                      </div>

                      {/* 卡片邊緣高光 */}
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20"></div>
                      
                      {/* 頂部反光效果 */}
                      <div className="absolute top-0 left-1/4 right-1/4 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl"></div>
                    </div>

                    {/* 卡片陰影 */}
                    <div className="absolute -bottom-3 -right-3 w-full h-full bg-gradient-to-br from-amber-400/10 to-orange-600/20 rounded-2xl blur-sm -z-10"></div>
                    <div className="absolute -bottom-1 -right-1 w-full h-full bg-gradient-to-br from-amber-300/15 to-orange-500/25 rounded-2xl -z-10"></div>
                  </div>

                  {/* 商品資訊卡片 */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                        {/* 優惠贈送顯示 */}
                        {item.points_value > item.price && (
                            <div className="inline-flex items-center mb-2 bg-green-100 border border-green-300 rounded-full px-3 py-1 mt-1">
                              
                              <span className="text-xs font-bold text-green-700">
                                +{(item.points_value - item.price).toLocaleString()} 點贈送
                              </span>
                            </div>
                          )}
                      <p className="text-gray-600 mb-3 text-sm">{item.description}</p>
                      
                      
                      
                    
                    
                    </div>
                  </div>

                  {/* 價格詳情 */}
                
                   
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center mb-2">
                        {/* <span className="text-lg font-medium text-gray-900">金額</span> */}
                        <span className="text-2xl font-bold text-gray-900">NT$</span>
                        <span className="text-2xl font-bold text-gray-900">{Math.round(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      {/* <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-amber-700">獲得點數</span>
                        <span className="text-2xl font-bold text-amber-600">{(item.points_value * item.quantity).toLocaleString()} 點</span>
                      </div> */}
                    </div>
                  
                </div>
              ))}

             
            </div>
          </div>

          {/* 右側：付款方式和結帳 */}
          <div className="space-y-6">
            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              {/* 付款方式 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">付款方式</h2>
                
                <div className="space-y-3">
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
                  `確認購買`
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
              點數卡購買後，會由總部核帳完成，將點數卡加入您的帳戶
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
              本商品由本公司自行擔保，若出現無法使用錯誤等情形，請於 7 日內聯繫客服，我們將協助處理
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
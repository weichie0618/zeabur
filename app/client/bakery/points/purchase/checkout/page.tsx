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
                  {/* 點數卡設計 */}
                  <div className="relative">
                    {/* 點數卡主體 */}
                    <div className="relative w-full max-w-sm mx-auto aspect-[1.6/1] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl shadow-2xl overflow-hidden">
                      {/* 卡片背景紋理 */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white/30 rounded-full"></div>
                        <div className="absolute top-8 right-6 w-12 h-12 border-2 border-white/20 rounded-full"></div>
                        <div className="absolute bottom-6 left-8 w-8 h-8 border-2 border-white/25 rounded-full"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20"></div>
                      </div>

                      {/* 卡片內容 */}
                      <div className="relative h-full p-6 flex flex-col justify-between text-white">
                        {/* 頂部 - 卡片標題 */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium opacity-90">點數卡</div>
                            <div className="text-xs opacity-75">POINTS CARD</div>
                          </div>
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                          </div>
                        </div>

                        {/* 中央 - 點數值 */}
                        <div className="text-center">
                          <div className="text-4xl font-bold mb-1 drop-shadow-lg">
                            {item.points_value.toLocaleString()}
                          </div>
                          <div className="text-lg font-medium opacity-95">POINTS</div>
                        </div>

                        {/* 底部 - 卡片信息 */}
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-xs opacity-75 mb-1">VALID THRU</div>
                            <div className="text-sm font-medium">∞</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-75 mb-1">CARD NO.</div>
                            <div className="text-sm font-mono">{String(item.virtual_card_id).padStart(8, '0')}</div>
                          </div>
                        </div>
                      </div>

                      {/* 金屬光澤效果 */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                    </div>

                    {/* 卡片陰影效果 */}
                    <div className="absolute -bottom-2 -right-2 w-full h-full bg-gradient-to-br from-amber-300/20 to-amber-700/20 rounded-2xl -z-10"></div>
                  </div>

                  {/* 商品資訊卡片 */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                      <p className="text-gray-600 mb-3 text-sm">{item.description}</p>
                      
                    
                    </div>
                  </div>

                  {/* 價格詳情 */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                   
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-medium text-gray-900">小計金額</span>
                        <span className="text-2xl font-bold text-gray-900">NT$ {Math.round(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-amber-700">獲得點數</span>
                        <span className="text-2xl font-bold text-amber-600">{(item.points_value * item.quantity).toLocaleString()} 點</span>
                      </div>
                    </div>
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
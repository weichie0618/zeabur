'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { useLiff } from '@/lib/LiffProvider';
import Link from 'next/link';

interface VirtualCard {
  id: number;
  name: string;
  description: string;
  price: number;
  pointsValue: number;
  imageUrl?: string;
  displayOrder?: number;
  status: string;
}

interface LineUser {
  id: number;
  lineId: string;
  displayName?: string;
  name?: string;
}

export default function PurchasePage() {
  const { liff, profile, isLoggedIn, isLoading: liffLoading } = useLiff();
  
  // 狀態管理
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  
  // 載入狀態
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  
  // 錯誤狀態
  const [cardsError, setCardsError] = useState<string>('');

  // 手動 LIFF 初始化狀態
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);

  // 從 localStorage 獲取客戶資料的輔助函數
  const getCustomerDataFromLocalStorage = (): any | null => {
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

  // 獲取 LINE 用戶 ID（與 checkout 頁面邏輯一致）
  const getLineUserId = useCallback((): string | null => {
    // 首先嘗試從 LIFF SDK 獲取
    if (isLoggedIn && profile && profile.userId) {
      console.log('從 LIFF SDK 成功獲取 LINE 用戶 ID:', profile.userId);
      return profile.userId;
    }
    
    // 嘗試從手動 LIFF 獲取
    if (manualLiff?.isLoggedIn && manualLiff.isLoggedIn()) {
      try {
        // 嘗試從手動 LIFF 獲取 profile
        console.log('嘗試從手動 LIFF 獲取用戶 ID');
        return null; // 手動 LIFF 的 profile 需要異步獲取
      } catch (error) {
        console.error('從手動 LIFF 獲取 profile 失敗:', error);
      }
    }
    
    // 嘗試從 localStorage 獲取
    const localCustomerData = getCustomerDataFromLocalStorage();
    if (localCustomerData && localCustomerData.lineId) {
      console.log('從 localStorage 成功獲取 LINE 用戶 ID:', localCustomerData.lineId);
      return localCustomerData.lineId;
    }
    
    console.warn('無法獲取 LINE 用戶 ID');
    return null;
  }, [isLoggedIn, profile, manualLiff]);

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

  // 載入虛擬點數卡商品
  const loadVirtualCards = useCallback(async () => {
    setCardsLoading(true);
    setCardsError('');

    try {
      const response = await fetch('/api/points/virtual-cards');
      const data = await response.json();

      if (data.success && data.data) {
        // 按價格排序
        const sortedCards = data.data.sort((a: VirtualCard, b: VirtualCard) => a.price - b.price);
        setVirtualCards(sortedCards);
      } else {
        setCardsError('載入商品失敗');
      }
    } catch (error) {
      console.error('載入虛擬點數卡商品失敗:', error);
      setCardsError('載入商品失敗');
    } finally {
      setCardsLoading(false);
    }
  }, []);

  // 處理購買虛擬點數卡
  const handlePurchase = useCallback(async (card: VirtualCard) => {
    const currentLineUserId = getLineUserId();
    console.log('購買檢查 - lineUserId:', currentLineUserId);
    console.log('購買檢查 - isLoggedIn:', isLoggedIn);
    console.log('購買檢查 - profile:', profile);
    console.log('購買檢查 - manualLiff isLoggedIn:', manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : 'N/A');
    
    // 使用與 checkout 頁面相同的邏輯獲取 LINE ID
    const lineUserId = getLineUserId();
    
    if (!lineUserId) {
      // 檢查是否已登入但沒有用戶 ID
      const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);
      
      if (currentIsLoggedIn) {
        alert('無法獲取您的 LINE 用戶 ID，請重新整理頁面後再試');
      } else {
        alert('請先登入 LINE');
        
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

    setSelectedCard(card);
    setPurchasing(true);

    try {
      // 獲取 LINE 用戶資料來取得內部 ID
      const user = await getOrCreateLineUser();
      if (!user) {
        alert('無法獲取用戶資料，請稍後再試');
        setPurchasing(false);
        setSelectedCard(null);
        return;
      }

      const response = await fetch('/api/points/virtual-cards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: user.id,
          virtualCardProductId: card.id,
          paymentMethod: 'line_pay',
          ipAddress: undefined,
          userAgent: navigator.userAgent,
          notes: `從LINE購買 ${card.name}`
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`🎉 購買成功！\n您已成功購買 ${card.name}\n將獲得 ${card.pointsValue.toLocaleString()} 點數`);
        
        // 跳轉到點數頁面查看結果
        window.location.href = '/client/bakery/points';
      } else {
        alert(`購買失敗：${data.message}`);
      }
    } catch (error) {
      console.error('購買失敗:', error);
      alert('購買過程中發生錯誤，請稍後再試');
    } finally {
      setPurchasing(false);
      setSelectedCard(null);
    }
  }, [getLineUserId, getOrCreateLineUser, isLoggedIn, profile, manualLiff, liff]);

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

  // 初始化用戶（簡化版本）
  useEffect(() => {
    const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);
    const lineUserId = getLineUserId();
    
    if (currentIsLoggedIn && lineUserId) {
      console.log('LINE用戶已登入，ID:', lineUserId);
    } else if (currentIsLoggedIn && !lineUserId) {
      console.log('已登入但無法獲取用戶ID');
    } else {
      console.log('用戶未登入');
    }
  }, [isLoggedIn, profile, manualLiff, getLineUserId, liff]);

  // 載入商品
  useEffect(() => {
    loadVirtualCards();
  }, [loadVirtualCards]);

  // 檢查 LIFF 狀態
  const currentLiff = liff || manualLiff;
  const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);

  // 載入中狀態
  if (liffLoading && !manualLiff) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // 未登入狀態
  if (!currentIsLoggedIn) {
    return (
      <>
        <Script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          onLoad={handleLiffScriptLoad}
        />
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mx-4">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">需要登入</h2>
            <p className="text-yellow-700 mb-4">請先登入 LINE 帳號才能購買點數卡</p>
            {currentLiff && (
              <button
                onClick={() => currentLiff.login()}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                登入 LINE
              </button>
            )}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">虛擬點數卡商城</h1>
          <p className="text-gray-600">購買點數卡，享受更多優惠！</p>
          
          {/* 用戶狀態調試資訊 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-left max-w-md mx-auto">
              <div><strong>調試資訊:</strong></div>
              <div>LIFF已登入: {String(currentIsLoggedIn)}</div>
              <div>用戶ID: {profile?.userId || 'N/A'}</div>
              <div>用戶名稱: {profile?.displayName || 'N/A'}</div>
              <div>LINE用戶ID: {getLineUserId() || '未獲取'}</div>
              <div>手動LIFF: {manualLiff ? '已初始化' : '未初始化'}</div>
            </div>
          )}
          
          {/* 返回連結 */}
          <div className="mt-4">
            <Link 
              href="/client/bakery/points" 
              className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              回到點數總覽
            </Link>
          </div>
        </div>

      {/* 錯誤提示 */}
      {cardsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{cardsError}</span>
          </div>
        </div>
      )}

      {/* 商品列表 */}
      {cardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : virtualCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {virtualCards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* 商品圖片區域 */}
              <div className="relative h-48 bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                {card.imageUrl ? (
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div className="text-3xl font-bold">{card.pointsValue.toLocaleString()}</div>
                    <div className="text-sm opacity-90">點數</div>
                  </div>
                )}
                
                {/* 推薦標籤 (如果點數價值比價格高) */}
                {card.pointsValue > card.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    超值
                  </div>
                )}
              </div>

              {/* 商品資訊 */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.name}</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{card.description}</p>
                
                {/* 價格和點數資訊 */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">售價</span>
                    <span className="text-2xl font-bold text-gray-900">NT$ {card.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">獲得點數</span>
                    <span className="text-xl font-bold text-amber-600">{card.pointsValue.toLocaleString()} 點</span>
                  </div>
                  
                  {/* 優惠資訊 */}
                  {card.pointsValue > card.price && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">額外贈送</span>
                      <span className="text-green-600 font-medium">+{(card.pointsValue - card.price).toLocaleString()} 點</span>
                    </div>
                  )}
                </div>

                {/* 購買按鈕 */}
                <button
                  onClick={() => handlePurchase(card)}
                  disabled={purchasing && selectedCard?.id === card.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    purchasing && selectedCard?.id === card.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {purchasing && selectedCard?.id === card.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      處理中...
                    </div>
                  ) : (
                    '立即購買'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暫無商品</h3>
            <p className="text-gray-600">目前沒有可購買的點數卡商品</p>
          </div>
        </div>
      )}

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
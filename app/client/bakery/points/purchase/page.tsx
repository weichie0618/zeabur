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



export default function PurchasePage() {
  const { liff, profile, isLoggedIn, isLoading: liffLoading } = useLiff();
  
  // 狀態管理
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  
  // 載入狀態
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  
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
    // 添加虛擬點數卡到購物車
    const virtualCardItem = {
      id: `virtual_card_${card.id}`,
      name: card.name,
      price: card.price,
      quantity: 1,
      image: card.imageUrl || '',
      product_type: 'virtual_card',
      virtual_card_id: card.id,
      points_value: card.pointsValue,
      description: card.description
    };

    try {
      // 先清空點數購物車，然後只保存選取的商品
      localStorage.setItem('pointsCart', JSON.stringify([virtualCardItem]));

      // 跳轉到結帳頁面
      window.location.href = '/client/bakery/points/purchase/checkout';

    } catch (error) {
      console.error('添加到購物車失敗:', error);
      alert('添加到購物車時發生錯誤，請稍後再試');
    }
  }, []);

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
    
    if (currentIsLoggedIn) {
      console.log('LINE用戶已登入');
    } else {
      console.log('用戶未登入');
    }
  }, [isLoggedIn, profile, manualLiff, liff]);

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
              <div>LINE用戶ID: {profile?.userId || '未獲取'}</div>
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
              {/* 商品圖片區域 - 精美點數卡設計 */}
              <div className="relative h-64 p-6 flex items-center justify-center">
                {card.imageUrl ? (
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="relative">
                    {/* 點數卡主體 - 參考結帳頁面的較大尺寸 */}
                    <div className="relative h-40 w-70 max-w-md mx-auto aspect-[1.6/1] bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl shadow-xl overflow-hidden">
                      
                      {/* 烘焙主題背景紋理 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-amber-400/25 to-orange-600/35"></div>
                      
                      {/* 卡片背景裝飾 - 烘焙主題 */}
                      <div className="absolute inset-0 opacity-50">
                        {/* 小麥穗裝飾 */}
                        <div className="absolute top-1 left-1">
                          <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l-1 2.5v3l1-2.5 1 2.5v-3L12 2zm0 6l-1 2.5v3l1-2.5 1 2.5v-3L12 8zm0 6l-1 2.5v3l1-2.5 1 2.5v-3L12 14z"/>
                          </svg>
                        </div>
                        
                        {/* 麵包形狀裝飾 */}
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-white/75" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.5 12c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5zm-8 0c0 1.93-1.57 3.5-3.5 3.5S3.5 13.93 3.5 12 5.07 8.5 7 8.5s3.5 1.57 3.5 3.5z"/>
                          </svg>
                        </div>
                        
                        {/* 麵粉雲朵效果 */}
                        <div className="absolute bottom-1 left-2">
                          <svg className="w-8 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.5 20c-2.76 0-5-2.24-5-5 0-2.64 2.05-4.78 4.65-4.96C6.72 8.73 8.25 8 10 8c2.21 0 4 1.79 4 4 0 .34-.05.67-.14.98.86.8 1.39 1.93 1.39 3.02 0 2.21-1.79 4-4 4H6.5z"/>
                          </svg>
                        </div>
                        
                        {/* 星星裝飾 (品質象徵) */}
                        <div className="absolute bottom-2 right-4">
                          <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                        
                        {/* 裝飾性小點點 (模擬麵粉) */}
                        <div className="absolute top-5 left-6 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                        <div className="absolute top-7 right-8 w-2 h-2 bg-white/55 rounded-full"></div>
                        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white/65 rounded-full"></div>
                        <div className="absolute bottom-4 right-2 w-1 h-1 bg-white/70 rounded-full"></div>
                        
                        {/* 烘焙溫度計 */}
                        <div className="absolute top-6 right-6">
                          <svg className="w-3 h-3 text-white/75" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-2V5c0-.55.45-1 1-1s1 .45 1 1v6h-2z"/>
                          </svg>
                        </div>
                        
                        {/* 心形裝飾 (愛心烘焙) */}
                        <div className="absolute top-8 left-4">
                          <svg className="w-3 h-3 text-white/65" fill="currentColor" viewBox="0 0 24 24">
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
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-2xl"></div>
                      
                      {/* 邊緣溫暖光暈 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-600/10 rounded-2xl"></div>
                      
                      {/* 烘焙紋理效果 */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 w-1/3 h-full animate-pulse"></div>
                      </div>
                      
                      {/* 專業烘焙質感 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/5 via-orange-300/10 to-amber-500/15 mix-blend-overlay"></div>

                                              {/* 卡片內容 */}
                        <div className="relative h-full p-5 flex flex-col justify-between text-white">
                          
                          {/* 頂部區域 */}
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-bold text-black/50 tracking-wide opacity-90">BAKERY</div>
                              <div className="text-sm text-black/50 opacity-80 mt-0.5">POINTS CARD</div>
                            </div>
                            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 overflow-hidden absolute top-3 right-3">
                              <img 
                                src="/sample/favicon.ico" 
                                alt="Bakery Logo" 
                                className="w-12 h-12 object-contain"
                              />
                            </div>
                          </div>

                          {/* 中央點數顯示 */}
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-4xl font-black drop-shadow-lg tracking-tight mb-1">
                                {Math.round(card.price).toLocaleString()}
                              </div>
                              <div className="text-2xl font-semibold opacity-95 tracking-wider">點數</div>
                            </div>
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
                    <span className="text-2xl font-bold text-gray-900">NT$ {Math.round(card.price).toLocaleString()}</span>
                  </div>
                  
                   {/* 優惠資訊 */}
                   {card.pointsValue > card.price && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">額外贈送</span>
                      <span className="text-green-600 font-medium">+{(card.pointsValue - card.price).toLocaleString()} 點</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">獲得點數</span>
                    <span className="text-xl font-bold text-amber-600">{card.pointsValue.toLocaleString()} 點</span>
                  </div>
                  
                 
                </div>

                {/* 購買按鈕 */}
                <button
                  onClick={() => handlePurchase(card)}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg transform hover:scale-105"
                >
                  立即購買
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
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  
  // 載入狀態
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  
  // 錯誤狀態
  const [cardsError, setCardsError] = useState<string>('');

  // 獲取或創建 LINE 用戶
  const getOrCreateLineUser = useCallback(async (): Promise<LineUser | null> => {
    if (!profile?.userId) return null;

    try {
      const checkResponse = await fetch('/api/customer/line/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineId: profile.userId,
          displayName: profile.displayName,
          name: profile.displayName
        }),
      });

      const checkData = await checkResponse.json();
      
      if (checkData.success && checkData.data) {
        return checkData.data;
      }

      return null;
    } catch (error) {
      console.error('獲取或創建LINE用戶失敗:', error);
      return null;
    }
  }, [profile]);

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
    if (!lineUser) {
      alert('請先登入LINE');
      return;
    }

    setSelectedCard(card);
    setPurchasing(true);

    try {
      const response = await fetch('/api/points/virtual-cards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: lineUser.id,
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
  }, [lineUser]);

  // 初始化用戶
  useEffect(() => {
    if (isLoggedIn && profile?.userId) {
      getOrCreateLineUser().then(user => {
        if (user) {
          setLineUser(user);
        }
      });
    }
  }, [isLoggedIn, profile, getOrCreateLineUser]);

  // 載入商品
  useEffect(() => {
    loadVirtualCards();
  }, [loadVirtualCards]);

  // 載入中狀態
  if (liffLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // 未登入狀態
  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mx-4">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">需要登入</h2>
          <p className="text-yellow-700">請先登入 LINE 帳號才能購買點數卡</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 頁面標題 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">虛擬點數卡商城</h1>
        <p className="text-gray-600">購買點數卡，享受更多優惠！</p>
        
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
  );
} 
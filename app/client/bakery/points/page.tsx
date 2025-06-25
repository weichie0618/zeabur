'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLiff } from '@/lib/LiffProvider';
import PointsBalance from './components/PointsBalance';
import VirtualCardList from './components/VirtualCardList';
import PurchaseHistory from './components/PurchaseHistory';

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

interface Purchase {
  id: number;
  virtualCardProduct: {
    name: string;
    pointsValue: number;
  };
  purchasePrice: number;
  pointsRedeemed: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

interface LineUser {
  id: number;
  lineId: string;
  displayName?: string;
  name?: string;
}

export default function PointsPage() {
  const { liff, profile, isLoggedIn, isLoading: liffLoading } = useLiff();
  
  // 狀態管理
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // 載入狀態
  const [pointsLoading, setPointsLoading] = useState<boolean>(false);
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  const [purchasesLoading, setPurchasesLoading] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  
  // 錯誤狀態
  const [pointsError, setPointsError] = useState<string>('');
  const [cardsError, setCardsError] = useState<string>('');
  const [purchasesError, setPurchasesError] = useState<string>('');

  // 獲取或創建 LINE 用戶
  const getOrCreateLineUser = useCallback(async (): Promise<LineUser | null> => {
    if (!profile?.userId) return null;

    try {
      // 先檢查用戶是否存在
      const checkResponse = await fetch('/api/customer/line/user', {
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

  // 載入用戶點數餘額
  const loadPointsBalance = useCallback(async (lineUserId: number) => {
    setPointsLoading(true);
    setPointsError('');

    try {
      const response = await fetch(`/api/points/balance/${lineUserId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setCurrentPoints(data.data.availablePoints || 0);
      } else {
        setCurrentPoints(0);
      }
    } catch (error) {
      console.error('載入點數餘額失敗:', error);
      setPointsError('載入點數餘額失敗');
    } finally {
      setPointsLoading(false);
    }
  }, []);

  // 載入虛擬點數卡商品
  const loadVirtualCards = useCallback(async () => {
    setCardsLoading(true);
    setCardsError('');

    try {
      const response = await fetch('/api/points/virtual-cards');
      const data = await response.json();

      if (data.success && data.data) {
        setVirtualCards(data.data);
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

  // 載入購買記錄
  const loadPurchaseHistory = useCallback(async (lineUserId: number) => {
    setPurchasesLoading(true);
    setPurchasesError('');

    try {
      const response = await fetch(`/api/points/virtual-cards/purchases/${lineUserId}?limit=20`);
      const data = await response.json();

      if (data.success && data.data) {
        setPurchases(data.data);
      }
    } catch (error) {
      console.error('載入購買記錄失敗:', error);
      setPurchasesError('載入購買記錄失敗');
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  // 處理購買虛擬點數卡
  const handlePurchase = useCallback(async (card: VirtualCard) => {
    if (!lineUser) {
      alert('請先登入LINE');
      return;
    }

    // 確認購買
    const confirmed = confirm(
      `確定要購買 ${card.name} 嗎？\n` +
      `價格：NT$ ${card.price.toLocaleString()}\n` +
      `獲得點數：${card.pointsValue.toLocaleString()} 點`
    );

    if (!confirmed) return;

    setPurchasing(card.id);

    try {
      const response = await fetch('/api/points/virtual-cards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: lineUser.id,
          virtualCardProductId: card.id,
          paymentMethod: 'line_pay', // 預設使用 LINE Pay
          ipAddress: undefined,
          userAgent: navigator.userAgent,
          notes: `從LINE購買 ${card.name}`
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('購買請求已提交！請完成付款流程。');
        
        // 重新載入數據
        await Promise.all([
          loadPointsBalance(lineUser.id),
          loadPurchaseHistory(lineUser.id)
        ]);
      } else {
        alert(`購買失敗：${data.message}`);
      }
    } catch (error) {
      console.error('購買虛擬點數卡失敗:', error);
      alert('購買失敗，請稍後重試');
    } finally {
      setPurchasing(null);
    }
  }, [lineUser, loadPointsBalance, loadPurchaseHistory]);

  // 初始化用戶和載入數據
  useEffect(() => {
    const initializeUser = async () => {
      if (!liffLoading && isLoggedIn && profile?.userId) {
        const user = await getOrCreateLineUser();
        if (user) {
          setLineUser(user);
          
          // 並行載入所有數據
          await Promise.all([
            loadPointsBalance(user.id),
            loadVirtualCards(),
            loadPurchaseHistory(user.id)
          ]);
        }
      } else if (!liffLoading && !isLoggedIn) {
        // 即使未登入也載入商品
        loadVirtualCards();
      }
    };

    initializeUser();
  }, [liffLoading, isLoggedIn, profile, getOrCreateLineUser, loadPointsBalance, loadVirtualCards, loadPurchaseHistory]);

  // 如果 LIFF 還在載入中
  if (liffLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="text-center py-12 bg-amber-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mb-3"></div>
          <p className="text-gray-600 font-medium">正在載入點數商城...</p>
          <p className="text-gray-500 text-sm mt-2">請稍候，我們正在為您準備點數服務</p>
        </div>
      </div>
    );
  }

  // 如果未登入 LINE
  if (!isLoggedIn) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="text-center py-10 bg-amber-50 rounded-lg mb-6">
          <div className="text-amber-600 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-2">請先登入LINE</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">登入後即可查看您的點數餘額並購買點數卡</p>
        </div>
        
        {/* 即使未登入也顯示商品列表 */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">虛擬點數卡商品</h2>
            <VirtualCardList
              cards={virtualCards}
              loading={cardsLoading}
              error={cardsError}
              onPurchase={() => alert('請先登入LINE')}
              purchasing={null}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">點數商城</h1>
          <p className="text-gray-600">購買虛擬點數卡，享受更多購物優惠</p>
        </div>

        {/* 點數餘額 */}
        <PointsBalance
          points={currentPoints}
          loading={pointsLoading}
          error={pointsError}
          onRefresh={() => lineUser && loadPointsBalance(lineUser.id)}
        />

        {/* 虛擬點數卡商品 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">虛擬點數卡商品</h2>
          <VirtualCardList
            cards={virtualCards}
            loading={cardsLoading}
            error={cardsError}
            onPurchase={handlePurchase}
            purchasing={purchasing}
          />
        </div>

        {/* 購買記錄 */}
        <PurchaseHistory
          purchases={purchases}
          loading={purchasesLoading}
          error={purchasesError}
        />
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useLiff } from '@/lib/LiffProvider';
import PointsBalance from './components/PointsBalance';
import PurchaseHistory from './components/PurchaseHistory';



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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // 載入狀態
  const [pointsLoading, setPointsLoading] = useState<boolean>(false);
  const [purchasesLoading, setPurchasesLoading] = useState<boolean>(false);
  
  // 錯誤狀態
  const [pointsError, setPointsError] = useState<string>('');
  const [purchasesError, setPurchasesError] = useState<string>('');

  // 手動 LIFF 初始化狀態
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);

  // 獲取或創建 LINE 用戶
  const getOrCreateLineUser = useCallback(async (): Promise<LineUser | null> => {
    if (!profile?.userId) return null;

    try {
      // 先檢查用戶是否存在
      const checkResponse = await fetch('/api/customer/line/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineId: profile.userId
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
  }, [profile]);

  // 載入用戶點數餘額
  const loadPointsBalance = useCallback(async (lineId: string) => {
    setPointsLoading(true);
    setPointsError('');

    try {
      const response = await fetch(`/api/points/balance/${lineId}`);
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



  // 載入購買記錄
  const loadPurchaseHistory = useCallback(async (lineId: string) => {
    setPurchasesLoading(true);
    setPurchasesError('');

    try {
      const response = await fetch(`/api/points/virtual-cards/purchases/${lineId}?limit=20`);
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



  // 初始化用戶和載入數據
  useEffect(() => {
    const initializeUser = async () => {
      const currentLiff = liff || manualLiff;
      const currentProfile = profile || (manualLiff?.getProfile ? await manualLiff.getProfile() : null);
      const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);
      
      if (!liffLoading && currentIsLoggedIn && currentProfile?.userId) {
        const user = await getOrCreateLineUser();
        if (user) {
          setLineUser(user);
          
          // 並行載入所有數據
          await Promise.all([
            loadPointsBalance(user.lineId),
            loadPurchaseHistory(user.lineId)
          ]);
        }
      }
    };

    initializeUser();
  }, [liffLoading, isLoggedIn, profile, manualLiff, getOrCreateLineUser, loadPointsBalance, loadPurchaseHistory]);

  // 檢查 LIFF 狀態
  const currentLiff = liff || manualLiff;
  const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);

  // 如果 LIFF 還在載入中
  if (liffLoading && !manualLiff) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
          <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-gray-700 font-semibold text-base sm:text-lg">正在載入點數商城...</p>
          <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-md mx-auto">請稍候，我們正在為您準備點數服務</p>
        </div>
      </div>
    );
  }

  // 如果未登入 LINE
  if (!currentIsLoggedIn) {
    return (
      <>
        <Script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          onLoad={handleLiffScriptLoad}
        />
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10 sm:py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 mb-6">
            <div className="text-amber-600 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-gray-800 font-bold text-lg sm:text-xl mb-3">請先登入LINE</h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">登入後即可查看您的點數餘額並購買點數卡，享受更多購物優惠</p>
            {currentLiff && (
              <button
                onClick={() => currentLiff.login()}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>登入 LINE</span>
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
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* 頁面標題 */}
          <div className="text-center px-4 sm:px-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">點數商城</h1>
            <p className="text-gray-600 text-sm sm:text-base">購買虛擬點數卡，享受更多購物優惠</p>
          </div>

          {/* 點數餘額 */}
          <div className="flex justify-center px-4 sm:px-0">
            <PointsBalance
              points={currentPoints}
              loading={pointsLoading}
              error={pointsError}
              onRefresh={() => lineUser && loadPointsBalance(lineUser.lineId)}
            />
          </div>

          {/* 按鈕區 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
            <Link
              href="/client/bakery/points/purchase"
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
            >
              <div className="relative z-10 flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>購買點數卡</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
            
            <Link
              href="/client/bakery/points/transactions"
              className="group relative overflow-hidden bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
            >
              <div className="relative z-10 flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>點數記錄</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/20 to-slate-600/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>

          {/* 購買記錄 */}
          <PurchaseHistory
            purchases={purchases}
            loading={purchasesLoading}
            error={purchasesError}
          />
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
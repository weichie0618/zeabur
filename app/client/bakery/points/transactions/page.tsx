'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { useLiff } from '@/lib/LiffProvider';
import Link from 'next/link';

interface Transaction {
  id: number;
  transactionType: string;
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  description: string;
  status: string;
  createdAt: string;
  order?: {
    id: number;
    orderNumber: string;
  };
}

interface LineUser {
  id: number;
  lineId: string;
  displayName?: string;
  name?: string;
}

const getTransactionTypeText = (type: string) => {
  switch (type) {
    case 'earn_purchase':
      return '購買回饋';
    case 'use_payment':
      return '消費抵扣';
    case 'card_redeem':
      return '點數卡兌換';
    case 'admin_adjust':
      return '管理員調整';
    default:
      return type;
  }
};

const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case 'earn_purchase':
    case 'card_redeem':
      return 'text-green-600';
    case 'use_payment':
      return 'text-red-600';
    case 'admin_adjust':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TransactionsPage() {
  const { liff, profile, isLoggedIn, isLoading: liffLoading } = useLiff();
  
  const [lineUser, setLineUser] = useState<LineUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 手動 LIFF 初始化狀態
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);

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

  // 載入交易記錄
  const loadTransactions = useCallback(async (lineUserId: number) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/points/transactions/${lineUserId}?limit=50`);
      const data = await response.json();

      if (data.success && data.data) {
        setTransactions(data.data);
      } else {
        setError('載入交易記錄失敗');
      }
    } catch (error) {
      console.error('載入交易記錄失敗:', error);
      setError('載入交易記錄失敗');
    } finally {
      setLoading(false);
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

  // 初始化
  useEffect(() => {
    const initializeUser = async () => {
      const currentLiff = liff || manualLiff;
      const currentProfile = profile || (manualLiff?.getProfile ? await manualLiff.getProfile() : null);
      const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);
      
      if (!liffLoading && currentIsLoggedIn && currentProfile?.userId) {
        const user = await getOrCreateLineUser();
        if (user) {
          setLineUser(user);
          await loadTransactions(user.id);
        }
      }
    };

    initializeUser();
  }, [liffLoading, isLoggedIn, profile, manualLiff, getOrCreateLineUser, loadTransactions]);

  // 檢查 LIFF 狀態
  const currentLiff = liff || manualLiff;
  const currentIsLoggedIn = isLoggedIn || (manualLiff?.isLoggedIn ? manualLiff.isLoggedIn() : false);

  if (liffLoading && !manualLiff) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="text-center py-12 bg-amber-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mb-3"></div>
          <p className="text-gray-600 font-medium">正在載入交易記錄...</p>
        </div>
      </div>
    );
  }

  if (!currentIsLoggedIn) {
    return (
      <>
        <Script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          onLoad={handleLiffScriptLoad}
        />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center py-10 bg-amber-50 rounded-lg">
            <div className="text-amber-600 text-5xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">請先登入LINE</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">登入後即可查看您的點數交易記錄</p>
            {currentLiff && (
              <button
                onClick={() => currentLiff.login()}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="space-y-6">
          {/* 頁面標題和導航 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">點數交易記錄</h1>
              <p className="text-gray-600 mt-1">查看您的點數獲得和使用記錄</p>
            </div>
            <Link
              href="/client/bakery/points"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              返回點數商城
            </Link>
          </div>

          {/* 交易記錄 */}
          <div className="bg-white rounded-lg shadow-md">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-1 w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="text-red-600 text-lg mb-2">載入失敗</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => lineUser && loadTransactions(lineUser.id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  重新載入
                </button>
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-600 mb-2">暫無交易記錄</h3>
                <p className="text-gray-500">您還沒有任何點數交易記錄</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-medium text-gray-900 mr-3">
                            {getTransactionTypeText(transaction.transactionType)}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            #{transaction.id}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">
                          {transaction.description}
                        </p>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>交易時間: {formatDate(transaction.createdAt)}</div>
                          <div>
                            餘額變化: {transaction.pointsBefore} → {transaction.pointsAfter} 點
                          </div>
                          {transaction.order && (
                            <div>
                              相關訂單: {transaction.order.orderNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className={`text-lg font-bold ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()} 點
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.status === 'completed' ? '已完成' : transaction.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
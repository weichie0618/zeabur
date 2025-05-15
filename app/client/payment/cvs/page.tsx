'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// 標記為完全動態路由，跳過所有靜態優化
export const dynamic = 'force-dynamic';
export const fetchCache = 'only-no-store';
export const revalidate = 0;
export const runtime = 'edge';

interface CVSInfo {
  PaymentNo: string;
  ExpireDate: string;
  orderId: string;
  amount: number;
  Barcode1: string;
  Barcode2: string;
  Barcode3: string;
}

// 客戶端渲染的主要內容組件
const CVSPaymentContent = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [cvsInfo, setCvsInfo] = useState<CVSInfo | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 從 localStorage 獲取超商付款資訊
    try {
      const savedInfo = localStorage.getItem('cvsPaymentInfo');
      if (savedInfo && savedInfo !== 'undefined') {
        try {
          const parsedInfo = JSON.parse(savedInfo);
          
          // 驗證必要欄位
          if (!parsedInfo.PaymentNo || !parsedInfo.ExpireDate) {
            throw new Error('付款資訊不完整');
          }
          
          setCvsInfo(parsedInfo);
          
          // 計算過期時間倒數
          if (parsedInfo.ExpireDate) {
            const expireDate = new Date(parsedInfo.ExpireDate);
            const now = new Date();
            const diffTime = expireDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setCountdown(diffDays);
            setIsExpired(diffDays <= 0);
          }
        } catch (error) {
          console.error('解析超商付款資訊時發生錯誤:', error);
          setError('付款資訊格式錯誤，請聯繫客服');
        }
      } else {
        setError('找不到付款資訊');
      }
    } catch (e) {
      console.error('獲取付款資訊時發生錯誤:', e);
      setError('獲取付款資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('已複製到剪貼簿');
      })
      .catch(err => {
        console.error('無法複製: ', err);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !cvsInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">找不到付款資訊</h2>
          <p className="mb-6 text-gray-600">{error || '無法取得超商付款資訊，請返回訂單頁面查詢。'}</p>
          <Link href="/client/bakery" className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 transition-colors">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">超商代碼繳費</span>
        <h1 className="text-2xl font-bold mt-4">感謝您的訂購</h1>
        <p className="text-gray-600 mt-2">訂單編號：{cvsInfo.orderId}</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-green-50 p-4 border-b">
          <h2 className="text-xl font-semibold text-center">超商繳費資訊</h2>
        </div>
        
        <div className="p-6">
          {isExpired ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              <p className="font-medium">此付款資訊已過期</p>
              <p className="text-sm mt-1">請聯繫客服或重新下單</p>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-6">
              <p className="font-medium">請在 {countdown} 天內完成繳費</p>
              <p className="text-sm mt-1">繳費完成後，系統將自動進行訂單處理</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">繳費代碼</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-mono font-semibold">{cvsInfo.PaymentNo}</p>
                <button 
                  onClick={() => copyToClipboard(cvsInfo.PaymentNo)}
                  className="text-green-600 text-sm hover:text-green-700 focus:outline-none"
                >
                  複製
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm mb-1">繳費金額</p>
              <p className="text-xl font-semibold">${cvsInfo.amount}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm mb-1">繳費期限</p>
              <p className="text-lg font-semibold">{new Date(cvsInfo.ExpireDate).toLocaleDateString('zh-TW')}</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-medium mb-3">繳費說明：</h3>
            <ol className="text-gray-600 text-sm space-y-2 list-decimal pl-5">
              <li>請至全家、7-11、萊爾富或OK便利商店，使用多媒體機台輸入代碼繳費。</li>
              <li>請務必在繳費期限前完成繳費，否則訂單將被取消。</li>
              <li>繳費完成後，款項確認約需 1-2 個工作天。</li>
              <li>若有任何問題，請聯繫客服：service@bakery.com</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/client/bakery" className="text-amber-600 hover:text-amber-700 font-medium">
          返回首頁
        </Link>
      </div>
    </div>
  );
};

// 頁面主要導出組件 - 使用客戶端檢測避免服務器渲染
export default function CVSPaymentPage() {
  // 初始加載佔位符
  const [isClient, setIsClient] = useState(false);
  
  // 在客戶端渲染後設置標誌
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 在服務器端渲染時返回最小加載狀態
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入付款資訊中...</p>
        </div>
      </div>
    );
  }
  
  // 只在客戶端渲染時返回實際內容
  return <CVSPaymentContent />;
} 
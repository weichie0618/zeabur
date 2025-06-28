'use client'

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 包含 useSearchParams 的組件
function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // 從URL參數獲取LINE Pay付款URL
    const paymentUrl = searchParams?.get('url') || '';
    
    if (paymentUrl) {
      // 等待1000毫秒後導向付款URL
     
        window.location.href = paymentUrl;
      
      
      // 嘗試關閉視窗，但捕捉可能的錯誤
      setTimeout(() => {
        try {
          // 檢查是否可以關閉視窗（只有在彈窗中才能關閉）
          if (window.opener || window.parent !== window) {
            window.close();
          } else {
            // 如果不是彈窗，則導回到首頁或關閉頁面
            console.log('無法關閉視窗，導回首頁');
            window.location.href = 'https://sunnyhausbakery.com.tw/';
          }
        } catch (error) {
          console.log('關閉視窗失敗:', error);
          // 發生錯誤時導回首頁
          window.location.href = 'https://sunnyhausbakery.com.tw/';
        }
      }, 1000);
    } else {
      // 如果沒有找到付款URL，顯示錯誤並倒數計時
      setError(true);
      
      // 倒數計時器
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/client/bakery');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-red-800 mb-2">付款異常</h1>
          <p className="text-red-600 mb-4">未找到有效的付款連結</p>
          <p className="text-gray-600 text-sm">
            系統將在 <span className="font-bold text-red-600">{countdown}</span> 秒後自動返回商城首頁
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
      <h1 className="text-xl font-semibold mb-2">正在前往付款頁面...</h1>
      <p className="text-gray-600">請稍候，系統正在處理您的付款請求</p>
    </div>
  );
}

// 加載時的內容
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
      <h1 className="text-xl font-semibold mb-2">載入中...</h1>
      <p className="text-gray-600">請稍候，系統正在準備付款流程</p>
    </div>
  );
}

// 主要頁面組件，使用 Suspense 包裝含有 useSearchParams 的內容
export default function PaymentRedirect() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentRedirectContent />
    </Suspense>
  );
} 
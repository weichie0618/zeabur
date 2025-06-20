'use client'

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 包含 useSearchParams 的組件
function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 從URL參數獲取LINE Pay付款URL
    const paymentUrl = searchParams?.get('url') || '';
    
    if (paymentUrl) {
      // 嘗試在新窗口中打開付款URL
      const paymentWindow = window.open(paymentUrl, '_blank');
      
      // 如果成功打開新窗口，嘗試關閉當前窗口
      setTimeout(() => {
        try {
          // 嘗試關閉當前窗口
          window.close();
          
          // 如果窗口未關閉（通常是主窗口），顯示提示消息
          setTimeout(() => {
            document.getElementById('closeMessage')?.classList.remove('hidden');
          }, 300);
        } catch (error) {
          console.error('關閉窗口失敗', error);
          document.getElementById('closeMessage')?.classList.remove('hidden');
        }
      }, 1000);
    } else {
      // 如果沒有找到付款URL，導回結帳頁面
      router.push('/client/checkout');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
      <h1 className="text-xl font-semibold mb-2">正在前往付款頁面...</h1>
      <p className="text-gray-600">請稍候，系統正在處理您的付款請求</p>
      
      <div id="closeMessage" className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg hidden">
        <p className="text-amber-800">付款頁面已在新視窗開啟</p>
        <p className="text-amber-800">您可以關閉此視窗繼續操作</p>
        <button 
          onClick={() => window.close()}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
        >
          關閉此視窗
        </button>
      </div>
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
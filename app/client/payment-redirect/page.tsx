'use client'

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 從URL參數獲取LINE Pay付款URL
    const paymentUrl = searchParams.get('url');
    
    if (paymentUrl) {
      // 簡短延遲後重定向到付款URL
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 500);
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
    </div>
  );
} 
import { Suspense } from 'react';
import { Metadata } from 'next';
import { OrdersClient } from './components/OrdersClient';

// 設置頁面的 metadata
export const metadata: Metadata = {
  title: '我的訂單 - 晴朗家烘焙',
  description: '查看您在晴朗家烘焙的訂單記錄'
};

// 使用 SSR 來預渲染頁面結構
export const dynamic = 'force-dynamic';

// 伺服器端組件 - 負責頁面結構和 SEO
export default async function OrdersPage() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-amber-100">
        <div className="flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h1 className="text-2xl font-bold text-center">我的訂單紀錄</h1>
        </div>
        
        {/* 客戶端互動組件 - 使用 Suspense 包裝 */}
        <Suspense fallback={<OrdersLoadingSkeleton />}>
          <OrdersClient />
        </Suspense>
      </div>
    </div>
  );
}

// 載入骨架屏元件 - 伺服器端渲染
const OrdersLoadingSkeleton = () => (
  <div className="text-center py-12 bg-amber-50 rounded-lg">
    <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mb-3"></div>
    <p className="text-gray-600 font-medium">正在載入您的資料...</p>
    <p className="text-gray-500 text-sm mt-2">請稍候，我們正在為您準備訂單資訊</p>
  </div>
); 
// 伺服器端組件 - 不需要 'use client' 聲明
import { ProductsClient } from './components/ProductsClient';
import { Suspense } from 'react';
import { BakeryHero } from './components/BakeryHero';
import { BreadCategories } from './components/BreadCategories';
import { getProducts, getCategories } from '@/lib/api';
import LiffInitializer from './components/LiffInitializer';
import { Metadata } from 'next';

// 設置頁面的 metadata
export const metadata: Metadata = {
  title: '晴朗家烘焙 - 新鮮手作麵包',
  description: '晴朗家烘焙提供多種新鮮手作麵包，口味豐富，品質保證'
};

// 禁用靜態重新驗證，使用動態渲染確保最新數據
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// 主頁面 - 伺服器端組件
export default async function BakeryPage() {
  try {
    console.log('開始獲取產品和類別數據...');
    // 從伺服器端獲取產品數據和類別數據
    const [products, categories] = await Promise.all([
      getProducts(),
      getCategories()
    ]);
    
    // 檢查是否成功獲取資料
    const productsSucceeded = products.length > 0;
    const categoriesSucceeded = categories.length > 1; // 應該至少有「全部商品」加上其他類別
    
    console.log('產品資料獲取狀態:', productsSucceeded ? '成功' : '失敗');
    console.log('類別資料獲取狀態:', categoriesSucceeded ? '成功' : '失敗');
    console.log('產品數量:', products.length);
    console.log('第一個產品詳情:', products[0]); // 輸出第一個產品的完整信息
    
    return (
      <div>
        {/* LIFF初始化組件 - 只在客戶端渲染 */}
        <LiffInitializer />
        
        {/* 英雄區塊 - 靜態內容，可在伺服器端渲染 */}
        <div className="mt-12">
          <BakeryHero />
        </div>
        
        {/* 客戶端交互部分 */}
        <div className="mt-12">
          <Suspense fallback={<LoadingSkeleton />}>
            <ProductsClient 
              initialProducts={products} 
              breadCategories={categories} 
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('資料獲取失敗:', error);
    // 錯誤處理...
    return (
      <div>
        {/* LIFF初始化組件 - 只在客戶端渲染 */}
        <LiffInitializer />
        
        {/* 英雄區塊 - 靜態內容，可在伺服器端渲染 */}
        <div className="mt-12">
          <BakeryHero />
        </div>
        
        {/* 客戶端交互部分 */}
        <div className="mt-12">
          <Suspense fallback={<LoadingSkeleton />}>
            <ProductsClient 
              initialProducts={[]} 
              breadCategories={[]} 
            />
          </Suspense>
        </div>
      </div>
    );
  }
}

// 骨架屏元件 - 伺服器端渲染
const LoadingSkeleton = () => (
  <>
    <section className="py-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-amber-200 rounded-lg p-4 text-center shadow-sm animate-pulse">
            <div className="h-10 w-10 bg-amber-100 rounded-full mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </section>
    
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="h-10 bg-gray-200 rounded-full animate-pulse"></div>
    </div>
    
    <section className="mt-8">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </section>
  </>
); 
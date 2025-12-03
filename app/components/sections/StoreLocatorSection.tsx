'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { stores } from '@/app/data/stores';
import { Store } from '@/types';

// 動態導入地圖組件以避免 SSR 問題
const StoreMap = dynamic(() => import('./StoreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-3xl bg-gray-200 flex items-center justify-center shadow-lg">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🗺️</div>
        <p className="text-gray-600 font-semibold">載入地圖中...</p>
      </div>
    </div>
  ),
});

export default function StoreLocatorSection() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const handleStoreClick = (store: Store) => {
    setSelectedStore(store);
    // 可以添加滾動到門市資訊的邏輯
  };

  return (
    <section 
      className="py-20 lg:py-40 relative bg-amber-50 overflow-hidden"
      style={{
        backgroundImage: 'url(https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/Untitled-design-3.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* 半透明覆蓋層，確保內容可讀性 - 與 NewsSection 風格一致 */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/85 via-orange-50/80 to-amber-100/85 backdrop-blur-[0.5px] pointer-events-none"></div>
      
      {/* 頂部漸層過渡層 - 與 NewsSection 底部波浪銜接 */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-amber-100/40 via-amber-50/25 to-transparent pointer-events-none z-10"></div>
      
      {/* 裝飾性背景圖案 - 在覆蓋層下方 */}
      <div className="absolute inset-0 opacity-5 z-[1]">
        {/* 左上角裝飾圓形 */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#F36C21] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        {/* 右下角裝飾圓形 */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFD700] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        {/* 中間裝飾圓形 */}
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#F36C21] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-30"></div>
      </div>

      {/* 烘焙風格裝飾圖案 - 在覆蓋層下方 */}
      <div className="absolute inset-0 opacity-[0.03] z-[1]" style={{
        backgroundImage: `radial-gradient(circle, #F36C21 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}></div>

      {/* 烘焙元素裝飾 - 浮動的麵包圖案 - 在覆蓋層上方 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        <div className="absolute top-20 left-10 text-6xl opacity-10 animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }}>🥐</div>
        <div className="absolute top-40 right-20 text-5xl opacity-10 animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }}>🍞</div>
        <div className="absolute bottom-40 left-1/4 text-4xl opacity-10 animate-float" style={{ animationDelay: '4s', animationDuration: '9s' }}>🥖</div>
        {/* <div className="absolute bottom-20 right-1/3 text-5xl opacity-10 animate-float" style={{ animationDelay: '1s', animationDuration: '11s' }}>🧁</div> */}
        <div className="absolute top-1/3 right-10 text-4xl opacity-10 animate-float" style={{ animationDelay: '3s', animationDuration: '12s' }}>🥨</div>
      </div>

      <div className="container mx-auto px-4 lg:px-32 relative z-20">
        {/* 標題區域 - 烘焙風格 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl animate-bounce" style={{ animationDuration: '2s' }}>🥖</span>
            <h2 className="text-3xl  md:text-5xl font-bold relative inline-block text-amber-900">
          門市據點
          <svg className="absolute -bottom-2 left-0 w-full h-4" viewBox="0 0 200 10" preserveAspectRatio="none">
            <path d="M0,7 Q50,3 100,7 T200,7" stroke="#F59E0B" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round"/>
          </svg>
        </h2>
            <span className="text-5xl animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>🥐</span>
          </div>
          <p className="text-gray-600 text-lg mt-4 flex items-center justify-center gap-2">
            <span>🍰</span>
            <span>尋找離您最近的晴朗家門市，品嚐新鮮出爐的烘焙美味</span>
            <span>🍰</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Map */}
          <div className="relative order-2 md:order-1">
            <StoreMap 
              stores={stores} 
              selectedStoreId={selectedStore?.id}
              onStoreClick={handleStoreClick}
            />
          </div>

          {/* Store Info - 烘焙風格卡片 */}
          <div className="space-y-4 order-1 md:order-2">
            {stores.map((store, index) => (
              <div 
                key={store.id} 
                className={`group p-6 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 relative overflow-hidden ${
                  selectedStore?.id === store.id 
                    ? 'ring-2 ring-[#F36C21] border-[#F36C21] shadow-xl scale-[1.02] bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/30' 
                    : 'border-amber-200/50 hover:border-[#F36C21]/40 hover:bg-gradient-to-br hover:from-amber-50 hover:via-orange-50/30 hover:to-amber-100/20'
                }`}
                onClick={() => setSelectedStore(store)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* 烘焙風格裝飾背景 */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-bl-full opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-200/20 to-amber-200/20 rounded-tr-full opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏪</span>
                      <h3 className="font-bold text-lg text-sunny-dark bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent">
                        {store.name}
                      </h3>
                    </div>
                    {selectedStore?.id === store.id && (
                      <span className="text-[#F36C21] text-2xl animate-bounce">📍</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed flex items-start gap-2">
                    <span className="text-lg mt-0.5">📍</span>
                    <span>{store.address}</span>
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-3 border-t border-amber-200/50">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full backdrop-blur-sm">
                      <span className="text-base">📞</span>
                      <span className="font-medium">{store.phone}</span>
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full backdrop-blur-sm">
                      <span className="text-base">🕐</span>
                      <span className="font-medium">{store.hours}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
    </section>
  );
}


'use client';

import React from 'react';

interface PointsBalanceProps {
  points: number;
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}

export default function PointsBalance({ points, loading, error, onRefresh }: PointsBalanceProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* 信用卡尺寸容器 - 標準信用卡比例 1.586:1 */}
      <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-3xl">
        {/* 信用卡尺寸 - aspect-ratio 保持比例 */}
        <div className="aspect-[1.586/1] p-6 sm:p-8 flex flex-col justify-between relative">
          {/* 背景裝飾圖案 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute bottom-6 left-6 w-16 h-16 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-white rounded-full"></div>
          </div>
          
          {/* 頂部區域 */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-white text-sm sm:text-base font-medium opacity-90 tracking-wide">
                  BAKERY POINTS
                </h2>
                <p className="text-white/70 text-xs sm:text-sm font-light">
                  點數卡
                </p>
              </div>
              
              {/* 卡片芯片圖標 */}
              <div className="w-8 h-6 sm:w-10 sm:h-8 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md shadow-inner flex items-center justify-center">
                <div className="w-4 h-3 sm:w-5 sm:h-4 bg-yellow-600/20 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* 中間點數顯示區域 */}
          <div className="relative z-10 flex-1 flex items-center">
            {loading ? (
              <div className="flex items-center w-full">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-white mr-3"></div>
                <span className="text-white text-lg sm:text-2xl font-light">載入中...</span>
              </div>
            ) : error ? (
              <div className="w-full">
                <p className="text-red-200 text-sm sm:text-base mb-2">{error}</p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="text-white underline text-xs sm:text-sm hover:text-yellow-200 transition-colors"
                  >
                    重新載入
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-end space-x-2">
                  <span className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                    {points.toLocaleString()}
                  </span>
                  <span className="text-white/90 text-lg sm:text-xl font-medium pb-1">
                    點
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-12 sm:w-16 h-0.5 bg-white/40 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* 底部區域 */}
          <div className="relative z-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/80 text-xs sm:text-sm font-light">
                  可用餘額
                </p>
                
              </div>
              
              {/* 品牌 Logo 區域 */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 overflow-hidden">
                  <img 
                    src="/sample/favicon.ico" 
                    alt="Bakery Logo" 
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                </div>
                <div className="text-white/90 text-xs sm:text-sm font-bold tracking-wider">
                  BAKERY
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 卡片光澤效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 opacity-0 hover:opacity-100 transition-opacity duration-700"></div>
      </div>
    </div>
  );
} 
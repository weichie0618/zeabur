'use client';

import React from 'react';
import Link from 'next/link';

interface PointsBalanceProps {
  points: number;
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}

export default function PointsBalance({ points, loading, error, onRefresh }: PointsBalanceProps) {
  return (
    <div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg p-6 text-white shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium opacity-90">我的點數餘額</h2>
          {loading ? (
            <div className="flex items-center mt-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              <span className="text-2xl">載入中...</span>
            </div>
          ) : error ? (
            <div className="mt-2">
              <p className="text-red-200 text-sm">{error}</p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="text-white underline text-sm mt-1"
                >
                  重新載入
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-baseline mt-2">
              <span className="text-3xl font-bold">{points.toLocaleString()}</span>
              <span className="text-lg ml-1 opacity-90">點</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 overflow-hidden">
          <img 
            src="/sample/favicon.ico" 
            alt="Bakery Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm opacity-80">
          <p>點數可用於購物時折抵現金，1點 = 1元</p>
        </div>
        <Link
          href="/client/bakery/points/purchase"
          className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm font-medium transition-colors mr-2"
        >
          購買點數卡
        </Link>
        <Link
          href="/client/bakery/points/transactions"
          className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          交易記錄
        </Link>
      </div>
    </div>
  );
} 
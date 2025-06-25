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
        <div className="text-right">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
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
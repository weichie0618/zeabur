'use client';

import React from 'react';

interface VirtualCard {
  id: number;
  name: string;
  description: string;
  price: number;
  pointsValue: number;
  imageUrl?: string;
  displayOrder?: number;
  status: string;
}

interface VirtualCardListProps {
  cards: VirtualCard[];
  loading: boolean;
  error?: string;
  onPurchase: (card: VirtualCard) => void;
  purchasing?: number | null;
}

export default function VirtualCardList({
  cards,
  loading,
  error,
  onPurchase,
  purchasing
}: VirtualCardListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg mb-2">載入商品失敗</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-600 mb-2">暫無商品</h3>
        <p className="text-gray-500">目前沒有可購買的點數卡商品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          {/* 商品圖片 */}
          <div className="h-32 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-amber-500 mx-auto mb-2"
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
                <span className="text-amber-600 font-medium">{card.pointsValue}點</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* 商品名稱 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.name}</h3>

            {/* 商品描述 */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{card.description}</p>

            {/* 價格與點數 */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  NT$ {card.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  獲得 {card.pointsValue.toLocaleString()} 點
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {card.pointsValue > card.price
                    ? `超值贈 ${card.pointsValue - card.price} 點`
                    : '等值兌換'}
                </div>
              </div>
            </div>

            {/* 購買按鈕 */}
            <button
              onClick={() => onPurchase(card)}
              disabled={purchasing === card.id}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {purchasing === card.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  立即購買
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 
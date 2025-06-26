'use client';

import React from 'react';

interface Purchase {
  id: number;
  virtualCardProduct: {
    name: string;
    pointsValue: number;
  };
  purchasePrice: number;
  pointsRedeemed: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

interface PurchaseHistoryProps {
  purchases: Purchase[];
  loading: boolean;
  error?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return '已完成';
    case 'pending':
      return '處理中';
    case 'failed':
      return '失敗';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function PurchaseHistory({ purchases, loading, error }: PurchaseHistoryProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">購買記錄</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1 w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">購買記錄</h3>
        <div className="text-center py-8">
          <div className="text-red-600 text-lg mb-2">載入記錄失敗</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">購買記錄</h3>
      
      {!purchases || purchases.length === 0 ? (
        <div className="text-center py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h4 className="text-gray-600 font-medium mb-2">暫無購買記錄</h4>
          <p className="text-gray-500 text-sm">您還沒有購買過虛擬點數卡</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium text-gray-900 mr-3">
                      {purchase.virtualCardProduct?.name || '點數卡'}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(purchase.paymentStatus)}`}>
                      {getStatusText(purchase.paymentStatus)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                   
                    <div className="flex items-center space-x-4">
                      <span>金額: NT$ {Math.round(purchase.purchasePrice).toLocaleString()}</span>
                      <span className="text-green-600 font-medium">
                        獲得點數: {purchase.pointsRedeemed?.toLocaleString()} 點
                      </span>
                    </div>
                    <div>
                      購買時間: {formatDate(purchase.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900">
                    NT$ {Math.round(purchase.purchasePrice).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
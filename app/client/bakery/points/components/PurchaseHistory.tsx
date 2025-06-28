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
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          購買記錄
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border-b border-gray-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 sm:w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1 w-1/2 sm:w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 sm:w-1/4"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20 sm:w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          購買記錄
        </h3>
        <div className="text-center py-8">
          <div className="text-red-600 text-base sm:text-lg mb-2 font-semibold">載入記錄失敗</div>
          <p className="text-gray-600 text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        購買記錄
      </h3>
      
      {!purchases || purchases.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="mb-4 sm:mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h4 className="text-gray-700 font-semibold mb-2 text-base sm:text-lg">暫無購買記錄</h4>
          <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto">快去充值點數吧！</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {purchases.filter(purchase => purchase.paymentStatus !== 'failed').map((purchase) => (
            <div key={purchase.id} className="border border-gray-100 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow duration-200 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                      {purchase.virtualCardProduct?.name || '點數卡'}
                    </h4>
                    <span className={`inline-flex items-center text-xs sm:text-sm px-3 py-1 rounded-full font-medium border ${getStatusColor(purchase.paymentStatus)} w-fit`}>
                      {getStatusText(purchase.paymentStatus)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base text-gray-600">
                    <div className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="font-medium">金額: NT$ {Math.round(purchase.purchasePrice).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="font-semibold">獲得點數: {purchase.pointsRedeemed?.toLocaleString()} 點</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>購買時間: {formatDate(purchase.createdAt)}</span>
                  </div>
                </div>
                
                <div className="text-right sm:ml-6">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    NT$ {Math.round(purchase.purchasePrice).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">
                    #{purchase.id}
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
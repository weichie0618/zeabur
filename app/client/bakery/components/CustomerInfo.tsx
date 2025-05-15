'use client';

import React from 'react';
import { useLiff } from '@/lib/LiffProvider';

const CustomerInfo = () => {
  const { customerData, isLoggedIn, isLoading, profile } = useLiff();

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg mb-4">
        <p className="text-center text-gray-500">載入中...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg mb-4">
        <p className="text-center text-gray-500">請先登入LINE</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-4">
      <h2 className="text-lg font-semibold mb-3">客戶資料</h2>
      
      {customerData ? (
        <div className="space-y-2">
          <p><span className="font-medium">姓名:</span> {customerData.name}</p>
          <p><span className="font-medium">電子郵件:</span> {customerData.email}</p>
          <p><span className="font-medium">電話:</span> {customerData.phone}</p>
          <p><span className="font-medium">地址:</span> {customerData.address}</p>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-gray-500">尚未取得客戶資料</p>
          {profile && (
            <p className="text-xs text-gray-400 mt-1">
              LINE ID: {profile.userId ? profile.userId.substring(0, 10) + '...' : '無法獲取'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerInfo; 
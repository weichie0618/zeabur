'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/lib/LiffProvider';
import CustomerInfo from './CustomerInfo';

const LiffInitializer: React.FC = () => {
  const { liff, isLoading, error, isLoggedIn, profile } = useLiff();
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    // 這裡可以處理LIFF初始化後的邏輯
    if (!isLoading && liff) {
      // 如果需要，可以在這裡添加額外的初始化邏輯
      // 減少不必要的 console.log
      
      // 如果已登入，記錄用戶資料
      if (isLoggedIn && profile) {
        // 減少不必要的 console.log
        
        // 這裡可以存儲用戶資料到localStorage或其他地方，以便其他頁面使用
        localStorage.setItem('liffUserProfile', JSON.stringify(profile));
      }
      
      // 在開發環境中，可以透過一個特殊的查詢參數來顯示調試資訊
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        // 更嚴格的調試控制，需要明確的 debug_key 參數匹配
        const debugKey = urlParams.get('debug_key');
        const debugMode = process.env.NODE_ENV === 'development' && 
                          (debugKey === process.env.NEXT_PUBLIC_DEBUG_KEY || debugKey === 'dev_mode');
        
        setShowDebugInfo(debugMode);
      }
    }
  }, [liff, isLoading, isLoggedIn, profile]);

  // 僅在開發模式或顯式要求調試資訊時顯示客戶資料
  if (showDebugInfo) {
    return (
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">LIFF 開發者資訊</h2>
            <button 
              onClick={() => setShowDebugInfo(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              隱藏
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-3">
              <p>錯誤: {error.message}</p>
            </div>
          )}
          
          <div className="mb-3">
            <p><span className="font-medium">LIFF 狀態:</span> {isLoading ? '載入中' : '已載入'}</p>
            <p><span className="font-medium">登入狀態:</span> {isLoggedIn ? '已登入' : '未登入'}</p>
            <p><span className="font-medium">LINE 環境:</span> {liff?.isInClient() ? '在 LINE 應用內' : '外部瀏覽器'}</p>
          </div>
          
          {profile && (
            <div className="mb-3">
              <h3 className="font-medium mb-1">LINE 用戶資料:</h3>
              <p className="text-sm">名稱: {profile.displayName}</p>
              {profile.email && <p className="text-sm">郵箱: {profile.email}</p>}
              <p className="text-sm">用戶ID: {profile.userId?.substring(0, 8)}...</p>
            </div>
          )}
          
          {/* 顯示客戶資料 */}
          <CustomerInfo />
        </div>
      </div>
    );
  }

  // 在生產模式下，此組件不渲染任何內容
  return null;
};

export default LiffInitializer; 
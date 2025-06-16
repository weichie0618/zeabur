'use client';

import React from 'react';
import { useLiff } from '@/lib/LiffProvider';
import LiffInitializer from './components/LiffInitializer';

// 空白的LIFF頁面
export default function ClientPage() {
  const { liff, isLoading, error, isLoggedIn, profile } = useLiff();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* LIFF初始化組件 */}
      <LiffInitializer />
      
      
      
      {/* LIFF 狀態顯示（僅在開發環境顯示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-md w-full">
          <div className="mb-3">
            <p><span className="font-medium">LIFF 狀態:</span> {isLoading ? '載入中' : '已載入'}</p>
            <p><span className="font-medium">登入狀態:</span> {isLoggedIn ? '已登入' : '未登入'}</p>
            {liff && <p><span className="font-medium">LINE 環境:</span> {liff.isInClient() ? '在 LINE 應用內' : '外部瀏覽器'}</p>}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-3">
              <p>錯誤: {error.message}</p>
            </div>
          )}
          
          {isLoggedIn && profile && (
            <div className="mb-3">
              <h3 className="font-medium mb-1">用戶資料:</h3>
              <p className="text-sm">名稱: {profile.displayName}</p>
              {profile.email && <p className="text-sm">郵箱: {profile.email}</p>}
              <p className="text-sm">ID: {profile.userId?.substring(0, 8)}...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

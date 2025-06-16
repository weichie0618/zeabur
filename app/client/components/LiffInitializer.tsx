'use client';

import React, { useEffect } from 'react';
import { useLiff } from '@/lib/LiffProvider';

const LiffInitializer: React.FC = () => {
  const { liff, isLoading, isLoggedIn, profile } = useLiff();

  useEffect(() => {
    // LIFF初始化後的邏輯
    if (!isLoading && liff) {
      // 如果已登入，記錄用戶資料
      if (isLoggedIn && profile) {
        // 存儲用戶資料到localStorage以便其他頁面使用
        localStorage.setItem('liffUserProfile', JSON.stringify(profile));
      }
    }
  }, [liff, isLoading, isLoggedIn, profile]);

  // 此組件不渲染任何內容
  return null;
};

export default LiffInitializer; 
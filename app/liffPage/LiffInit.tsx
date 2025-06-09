'use client';

import { useEffect } from 'react';
import { getLiffObject } from '@/lib/env';

// 這個組件負責預先加載 LIFF SDK
export default function LiffInit() {
  useEffect(() => {
    // 預先加載 LIFF SDK
    async function preloadLiff() {
      try {
        const liffObject = await getLiffObject();
        // 將 liff 對象掛載到 window 上以便快速訪問
        (window as any).liffObject = liffObject;
        console.log('LIFF SDK 預加載成功');
      } catch (error) {
        console.error('LIFF SDK 預加載失敗', error);
      }
    }

    preloadLiff();
  }, []);

  // 這個組件不渲染任何內容，只負責預加載
  return null;
} 
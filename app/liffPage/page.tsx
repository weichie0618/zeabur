// 伺服器組件 - 不使用 'use client'

import { Suspense } from 'react';
import styles from './page.module.css';
import LiffClient from './LiffClient';
import StaticContent from './StaticContent';

// 主頁面作為伺服器組件
export default async function LiffPage() {
  // 在伺服器端預先獲取靜態資料
  const { staticData, hasVisited } = await StaticContent();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>LINE 服務連結</h1>
        
        <Suspense fallback={
          <div className={styles.statusMessage}>
            <p>載入中...</p>
            <div className={styles.loadingSpinner}></div>
          </div>
        }>
          {/* 將靜態資料作為 props 傳遞給客戶端元件 */}
          <LiffClient staticData={staticData} />
        </Suspense>
      </div>
    </div>
  );
} 
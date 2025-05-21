'use client';

import { useEffect, useState } from 'react';
import { useLiff } from '@/lib/LiffProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function LiffPage() {
  const { liff } = useLiff();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    async function processUserData() {
      if (!liff) {
        console.log('LIFF 尚未初始化');
        return;
      }
      
      try {
        // 檢查用戶是否已登入
        if (!liff.isLoggedIn()) {
          console.log('用戶未登入，開始登入流程');
          liff.login();
          return;
        }
        
        // 獲取 LINE 用戶資料
        const profile = await liff.getProfile();
        const lineId = profile.userId;
        
        // 獲取 URL 參數中的服務代碼
        const services = searchParams.get('services') || '';
        
        console.log('用戶 LINE ID:', lineId);
        console.log('服務代碼:', services);
        
        // 發送資料到後端 API
        const response = await fetch('/api/customer/liff/saveUserData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineId,
            services,
          }),
        });
        
        if (!response.ok) {
          throw new Error('儲存資料失敗');
        }
        
        setSuccess(true);
        setLoading(false);
        
        // 等待 1 秒後重定向到 LINE 官方帳號
        setTimeout(() => {
          window.location.href = 'https://line.me/R/ti/p/%40989xhjix';
        }, 1000);
        
      } catch (err) {
        console.error('處理用戶資料時出錯:', err);
        setError('處理資料時發生錯誤');
        setLoading(false);
      }
    }
    
    if (liff) {
      processUserData();
    }
  }, [liff, searchParams]);
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>LINE 服務連結</h1>
        
        {loading && (
          <div className={styles.statusMessage}>
            <p>正在處理您的資料...</p>
            <div className={styles.loadingSpinner}></div>
          </div>
        )}
        
        {error && (
          <div className={styles.statusMessage}>
            <p className={styles.errorText}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              重試
            </button>
          </div>
        )}
        
        {success && (
          <div className={styles.statusMessage}>
            <p className={styles.successText}>資料已成功儲存！</p>
            <p>正在為您跳轉到 LINE 官方帳號...</p>
          </div>
        )}
      </div>
    </div>
  );
} 
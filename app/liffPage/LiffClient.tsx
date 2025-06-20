'use client';

import { useEffect, useState } from 'react';
import { useLiff } from '@/lib/LiffProvider';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

// 定義 props 類型
interface LiffClientProps {
  staticData: {
    initialized?: boolean;
    [key: string]: any;
  }
}

export default function LiffClient({ staticData }: LiffClientProps) {
  const { liff } = useLiff();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  
  // 用於顯示公司名稱
  const [companyName, setCompanyName] = useState<string>('');
  
  // 處理重試
  const handleRetry = () => {
    if (!liff) {
      console.log('重試時 LIFF 尚未初始化');
      window.location.reload();
      return;
    }
    
    console.log('重試：執行 LIFF 登入');
    liff.login();
  };
  
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
        const displayName = profile.displayName;

        // 獲取 URL 參數中的服務代碼
        const services = searchParams?.get('services') || '';
        
        console.log('用戶 LINE ID:', lineId);
        console.log('服務代碼:', services);
        
        // 發送資料到後端 API
        const response = await fetch('/api/customer/liff/saveUserData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName,
            lineId,
            services,
          }),
        });
        
        if (!response.ok) {
          throw new Error('儲存資料失敗');
        }
        
        const data = await response.json();
        // 如果後端返回了公司名稱，則設置它
        if (data.data && data.data.companyName) {
          setCompanyName(data.data.companyName);
        }
        
        setResponseData(data);
        setSuccess(true);
        setLoading(false);
        
        // 資料儲存成功後直接重定向到 LINE 官方帳號，不再等待 1 秒
        window.location.href = 'https://line.me/R/ti/p/%40989xhjix';
        
      } catch (err) {
        console.error('處理用戶資料時出錯:', err);
        setError('處理資料時發生錯誤');
        setLoading(false);
      }
    }
    
    if (liff) {
      processUserData();
    }
  }, [liff, searchParams, staticData]);
  
  return (
    <>
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
            onClick={handleRetry}
          >
            重試
          </button>
        </div>
      )}
      
      {success && responseData && (
        <div className={styles.statusMessage}>
          {/* <p className={styles.successText}>資料已成功儲存！</p> */}
          <h2 className={styles.welcomeText}>
            {companyName ? `歡迎 ${companyName} 的顧客` : '資料已成功儲存！'}
          </h2>
          <p>正在為您跳轉到 LINE 官方帳號...</p>
        </div>
      )}
    </>
  );
} 
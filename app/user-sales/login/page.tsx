'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesperson } from '../context/SalespersonContext';

// 聲明 LIFF 類型
declare global {
  interface Window {
    liff: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useSalesperson();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/city-sales/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.onload = async () => {
          if (window.liff) {
            await window.liff.init({
              liffId: process.env.NEXT_PUBLIC_LINE_SALE_LIFF_ID || '2006372025-O5AZ25zL'
            });
            
            if (window.liff.isLoggedIn()) {
              const profile = await window.liff.getProfile();
              const lineUserId = profile.userId;
              
              const response = await fetch('https://line.cityburger.com.tw/gsa', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: lineUserId
                })
              });

              if (response.ok) {
                const data = await response.json();
                if (data.isValid && data.storeId) {
                  await login(data.storeId);
                  router.push('/city-sales/dashboard');
                }
              }
            } else {
              window.liff.login();
            }
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('LIFF 初始化失敗:', error);
      }
    };

    initializeLiff();
  }, [router, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在進行 LINE 登入...</p>
      </div>
    </div>
  );
} 
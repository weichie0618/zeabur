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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-blue-500/20 border border-white/20 p-8 sm:p-12 max-w-md w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            業務員平台
          </h1>
          
          <p className="text-gray-600 mb-8">
            正在進行 LINE 登入驗證...
          </p>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>連接中</span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              請確保您的 LINE 帳號已完成註冊
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
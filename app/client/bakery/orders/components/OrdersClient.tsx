'use client';

import React, { useEffect, useCallback } from 'react';
import OrderList from './OrderList';
import { useLiff } from '@/lib/LiffProvider';

export const OrdersClient: React.FC = () => {
  const { liff, profile, isLoggedIn, isLoading: liffLoading, customerData } = useLiff();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const [queryInfo, setQueryInfo] = React.useState({ email: '', phone: '' });

  // 優化為使用 useCallback
  const handleSearch = useCallback(async (email: string, phone: string) => {
    // 檢查是否有 LINE 用戶 ID
    if (!(isLoggedIn && profile && profile.userId) && !email && !phone) {
      setError('無法獲取您的聯絡資訊，請更新您的個人資料或聯繫客服。');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/orders/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 優先使用 LINE 用戶 ID 作為主要查詢條件
          lineId: isLoggedIn && profile ? profile.userId : undefined,
          // 保留 email 和 phone 作為備用查詢條件
          customer_email: email || undefined,
          customer_phone: phone || undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '查詢訂單時發生錯誤');
      }

      // 確保 orders 是陣列
      const receivedOrders = Array.isArray(data.orders) ? data.orders : [];
      console.log('Orders received:', receivedOrders); // 添加調試日誌
      
      setOrders(receivedOrders);
      
      if (receivedOrders.length === 0) {
        setError('沒有找到符合條件的訂單');
      }
      
      setSearchPerformed(true);
    } catch (err) {
      console.error('訂單查詢錯誤:', err);
      setError(err instanceof Error ? err.message : '查詢訂單時發生錯誤');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  // 優化從本地存儲中獲取用戶資料的函數
  const getLocalStorageData = useCallback((key: string) => {
    try {
      const savedData = localStorage.getItem(key);
      if (!savedData) return null;
      
      return JSON.parse(savedData);
    } catch (e) {
      const error = e instanceof Error ? e : new Error('未知錯誤');
      console.error(`解析 ${key} 資料失敗: ${error.message}`, e);
      return null;
    }
  }, []);

  // 使用 useEffect 和優化後的函數
  useEffect(() => {
    // 只在LIFF加載完成且用戶已登入時執行
    if (!liffLoading && isLoggedIn) {
      let email = '';
      let phone = '';
      
      // 如果用戶已登入 LINE 且有 userId，直接使用 userId 查詢
      if (profile && profile.userId) {
        setQueryInfo({ email, phone });
        handleSearch(email, phone);
        return;
      }
      
      // 優先使用從 API 獲取的客戶資料
      if (customerData) {
        email = customerData.email || '';
        phone = customerData.phone || '';
        
        // 如果有email或phone，執行查詢
        if (email || phone) {
          setQueryInfo({ email, phone });
          handleSearch(email, phone);
          return;
        }
      } 
      
      // 如果沒有客戶資料，則使用 LINE 資料
      if (profile) {
        // 如果LINE資料中有email，則使用
        if (profile.email) {
          email = profile.email;
        }
        
        // 從本地儲存中獲取用戶資料，使用優化後的函數
        const parsedData = getLocalStorageData('customerData');
        if (parsedData) {
          if (parsedData.email) {
            email = parsedData.email;
          }
          if (parsedData.phone) {
            phone = parsedData.phone;
          }
        }
        
        // 嘗試從 LIFF 用戶資料中獲取，使用優化後的函數
        const parsedProfile = getLocalStorageData('liffUserProfile');
        if (parsedProfile && parsedProfile.phone) {
          phone = parsedProfile.phone;
        }
        
        // 如果有email或phone，執行查詢
        if (email || phone) {
          setQueryInfo({ email, phone });
          handleSearch(email, phone);
        } else {
          setError('無法獲取您的聯絡資訊，請更新您的個人資料或聯繫客服。');
          setLoading(false);
        }
      }
    }
  }, [liffLoading, isLoggedIn, profile, customerData, handleSearch, getLocalStorageData]);

  // 重新查詢按鈕處理函數 - 使用 useCallback 優化
  const handleRetry = useCallback(() => {
    if (queryInfo.email || queryInfo.phone) {
      handleSearch(queryInfo.email, queryInfo.phone);
    }
  }, [queryInfo, handleSearch]);

  return (
    <>
      {liffLoading ? (
        <div className="text-center py-12 bg-amber-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mb-3"></div>
          <p className="text-gray-600 font-medium">正在載入您的資料...</p>
          <p className="text-gray-500 text-sm mt-2">請稍候，我們正在為您準備訂單資訊</p>
        </div>
      ) : !isLoggedIn ? (
        <div className="text-center py-10 bg-amber-50 rounded-lg">
          <div className="text-amber-600 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4m0 0v4m0-4h4m-4 0H9" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-2">請先登入LINE</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">登入後即可自動查詢您的訂單記錄</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 bg-amber-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600 mb-3"></div>
          <p className="text-gray-600 font-medium">正在查詢您的訂單...</p>
          <p className="text-gray-500 text-sm mt-2">我們正在使用您的聯絡資訊查詢相關訂單</p>
        </div>
      ) : error && !searchPerformed ? (
        <div className="text-center py-8 bg-amber-50 rounded-lg">
          <div className="text-amber-600 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">請更新您的個人資料或聯繫客服</p>
          <button 
            onClick={handleRetry}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            重新嘗試
          </button>
        </div>
      ) : !searchPerformed ? (
        <div className="text-center py-8 bg-amber-50 rounded-lg">
          <div className="inline-block animate-pulse rounded-full h-10 w-10 bg-amber-200 mb-3"></div>
          <p className="text-gray-600 font-medium">正在準備您的訂單資訊...</p>
          <p className="text-gray-500 text-sm mt-2">我們正在自動使用您的聯絡資訊查詢訂單</p>
        </div>
      ) : null}

      {searchPerformed && !error && orders.length > 0 && (
        <div className="mb-4 bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
          <p className="text-gray-700">已找到 <span className="font-bold text-amber-600">{orders.length}</span> 筆訂單紀錄</p>
          <p className="text-sm text-gray-500 mt-1">以下是您的訂單詳情</p>
        </div>
      )}

      {searchPerformed && (
        <OrderList orders={orders} loading={loading} />
      )}
      
      {searchPerformed && error && (
        <div className="mt-4 text-center bg-white rounded-lg shadow-md p-6 border border-amber-100">
          <div className="text-amber-600 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">{error}</p>
          <p className="text-gray-600 mb-4">如需協助，請聯繫我們的客服</p>
          <button 
            onClick={handleRetry}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            重新查詢
          </button>
        </div>
      )}
    </>
  );
}; 
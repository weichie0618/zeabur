'use client';

import React, { useEffect, useCallback } from 'react';
import OrderList from './components/OrderList';
import { useLiff } from '@/lib/LiffProvider';
import Link from 'next/link';

export default function OrdersPage() {
  const { liff, profile, isLoggedIn, isLoading: liffLoading, customerData } = useLiff();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isEmptyOrders, setIsEmptyOrders] = React.useState(false);
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
    setIsEmptyOrders(false);
    
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
        // 檢查是否為"找不到訂單"的情況，將其視為正常狀態而非錯誤
        if (data.message && (
          data.message.includes('找不到符合條件的訂單') || 
          data.message.includes('沒有找到符合條件的訂單') ||
          data.message.includes('No orders found')
        )) {
          // 視為無訂單狀態，不是錯誤
          setOrders([]);
          setIsEmptyOrders(true);
          setSearchPerformed(true);
          return;
        }
        throw new Error(data.message || '查詢訂單時發生錯誤');
      }

      // 確保 orders 是陣列
      const receivedOrders = Array.isArray(data.orders) ? data.orders : [];
      console.log('Orders received:', receivedOrders); // 添加調試日誌
      
      setOrders(receivedOrders);
      
      if (receivedOrders.length === 0) {
        setIsEmptyOrders(true);
      }
      
      setSearchPerformed(true);
    } catch (err) {
      console.error('訂單查詢錯誤:', err);
      const errorMessage = err instanceof Error ? err.message : '查詢訂單時發生錯誤';
      
      // 再次檢查錯誤訊息，確保"找不到訂單"的情況被正確處理
      if (errorMessage.includes('找不到符合條件的訂單') || 
          errorMessage.includes('沒有找到符合條件的訂單') ||
          errorMessage.includes('No orders found')) {
        setOrders([]);
        setIsEmptyOrders(true);
        setSearchPerformed(true);
        setError('');
      } else {
        setError(errorMessage);
        setOrders([]);
        setIsEmptyOrders(false);
      }
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
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-amber-100">
        <div className="flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h1 className="text-2xl font-bold text-center">我的訂單紀錄</h1>
        </div>
        
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
      </div>

      {searchPerformed && isEmptyOrders && !error && (
        <div className="text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-8 mb-6 border border-amber-200">
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">還沒有訂單紀錄</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              來探索我們精心製作的美味烘焙商品吧！
            </p>
          </div>
          
         
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/client/bakery" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>開始購物</span>
            </Link>
            
            <Link href="/client/bakery/points" className="bg-white border-2 border-amber-300 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>查看點數</span>
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>💡 購買後即可在此查看所有訂單記錄</p>
          </div>
        </div>
      )}

      {searchPerformed && !error && !isEmptyOrders && orders.length > 0 && (
        <div className="mb-4 bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
          <p className="text-gray-700">已找到 <span className="font-bold text-amber-600">{orders.length}</span> 筆訂單紀錄</p>
          <p className="text-sm text-gray-500 mt-1">以下是您的訂單詳情</p>
        </div>
      )}

      {searchPerformed && !isEmptyOrders && (
        <OrderList orders={orders} loading={loading} />
      )}
      
      {searchPerformed && error && !isEmptyOrders && (
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
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';

export default function SalesHomePage() {
  return (
    <div className="space-y-4 sm:space-y-6 py-6 sm:py-10 px-4 sm:px-6 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-700">業務專區</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link href="/sales/dashboard" 
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 flex items-center justify-center rounded-full mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900">業績儀表板</h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">查看您的銷售統計和表現追蹤</p>
          </div>
        </Link>
        
        <Link href="/sales/orders" 
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 flex items-center justify-center rounded-full mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900">訂單管理</h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">管理您的客戶訂單和訂單狀態</p>
          </div>
        </Link>
        
        <Link href="/sales/customers" 
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 flex items-center justify-center rounded-full mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900">客戶管理</h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">管理客戶資料和交易記錄</p>
          </div>
        </Link>
        
        <Link href="/sales/goals" 
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 flex items-center justify-center rounded-full mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900">業績目標</h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">檢視您的銷售目標和獎勵計算</p>
          </div>
        </Link>
        
        {/* <Link href="/sales/profile" 
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 flex items-center justify-center rounded-full mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900">個人資料</h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">更新您的業務資料和聯絡資訊</p>
          </div>
        </Link>
        
        <Link href="/sales/commissions" 
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 flex items-center justify-center rounded-full mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900">佣金報表</h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">查看您的佣金計算和付款記錄</p>
          </div>
        </Link> */}
      </div>
    </div>
  );
} 
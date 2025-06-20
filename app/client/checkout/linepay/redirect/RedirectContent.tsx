'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function RedirectContent() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // 確保只在瀏覽器環境中執行
    if (typeof window !== 'undefined') {
      // 收集所有URL參數
      const params = new URLSearchParams()
      searchParams?.forEach((value, key) => {
        params.append(key, value)
      })
      
      // 構建LIFF URL，保持所有參數
      const liffUrl = `https://liff.line.me/2006231077-GmRwevra?${params.toString()}`
      
      console.log('重定向到LIFF URL:', liffUrl)
      
      // 使用延遲確保頁面已完全加載
      setTimeout(() => {
        // 執行重定向
        window.location.href = liffUrl
      }, 500)
    }
  }, [searchParams])
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
        <div className="py-8">
          <div className="flex justify-center mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-600"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">正在處理您的付款</h1>
          <p className="text-gray-600 mb-2">系統正在確認您的LinePay交易</p>
          <p className="text-gray-500 text-sm">請稍候，您將自動轉到訂單確認頁面...</p>
          
          <div className="flex justify-center mt-8">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
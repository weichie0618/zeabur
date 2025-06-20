'use client'

import { Suspense } from 'react'
import { RedirectContent } from './RedirectContent'

function LoadingFallback() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
        <div className="py-8">
          <div className="flex justify-center mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-600"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">正在載入頁面</h1>
          <p className="text-gray-600 mb-2">請稍候...</p>
        </div>
      </div>
    </div>
  )
}

export default function LinePayRedirect() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RedirectContent />
    </Suspense>
  )
} 
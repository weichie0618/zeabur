'use client';

import React from 'react';
import Link from 'next/link';
import { LiffLayout } from '../LiffLayout';
import { Metadata } from 'next';

// 因為這是客戶端組件，我們不能直接在這裡使用 metadata 導出
// 所以我們需要在 <head> 中添加標題
export default function BakeryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffLayout>
      <div className="min-h-screen flex flex-col">
        <header className="bg-amber-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/client/bakery" className="text-2xl font-bold">晴朗家烘焙</Link>
              <nav className="space-x-6">
                <Link href="/client/bakery/points" className="hover:underline flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  點數商城
                </Link>
                <Link href="/client/bakery/orders" className="hover:underline">訂單查詢</Link>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        
        <footer className="bg-gray-100 border-t">
          <div className="container mx-auto px-4 py-6 text-center">
            <p>© {new Date().getFullYear()} 屹澧股份有限公司. 版權所有.</p>
          </div>
        </footer>
      </div>
    </LiffLayout>
  );
} 
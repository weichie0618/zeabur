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
                <Link href="/client/bakery/orders" className="hover:underline">訂單查詢</Link>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        
        <footer className="bg-gray-100 border-t">
          <div className="container mx-auto px-4 py-6">
          <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} 屹澧股份有限公司. 版權所有.</p>
        </div>
          </div>
        </footer>
      </div>
    </LiffLayout>
  );
} 
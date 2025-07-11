'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LiffLayout } from '../LiffLayout';
import { Metadata } from 'next';
import HeaderPointsDisplay from './components/HeaderPointsDisplay';

// 因為這是客戶端組件，我們不能直接在這裡使用 metadata 導出
// 所以我們需要在 <head> 中添加標題
export default function BakeryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 手機版選單開關狀態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 切換手機版選單
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 關閉手機版選單（點擊連結時）
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <LiffLayout>
      <div className="min-h-screen flex flex-col">
        <header className="bg-amber-600 text-white shadow-md relative">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              {/* LOGO - 在所有螢幕尺寸下都顯示 */}
              <Link href="/client/bakery" className="text-2xl font-bold">晴朗家烘焙</Link>

              {/* 桌面版導覽選單 - 在 md 以上螢幕顯示 */}
              <div className="hidden md:flex items-center space-x-8">
                <nav className="flex items-center space-x-8">
                  <Link 
                    href="/client/bakery/points" 
                    className="hover:text-amber-100 transition-colors duration-200 flex items-center group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="font-medium">點數商城</span>
                  </Link>
                  <Link 
                    href="/client/bakery/points/purchase" 
                    className="hover:text-amber-100 transition-colors duration-200 flex items-center group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-medium">購買點數卡</span>
                  </Link>
                  <Link 
                    href="/client/bakery/orders" 
                    className="hover:text-amber-100 transition-colors duration-200 flex items-center group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="font-medium">訂單查詢</span>
                  </Link>
                </nav>
                {/* 桌面版點數顯示 */}
                <HeaderPointsDisplay />
              </div>

              {/* 手機版右側區域 - 包含點數顯示和漢堡選單 */}
              <div className="md:hidden flex items-center">
                {/* 手機版點數顯示 */}
                <HeaderPointsDisplay isMobile={true} />
                
                {/* 漢堡選單按鈕 */}
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg hover:bg-amber-700 focus:outline-none transition-colors duration-200 touch-manipulation"
                  aria-label="切換選單"
                >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span 
                    className={`bg-white block h-0.5 w-6 rounded-sm transition-all duration-300 ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
                    }`}
                  ></span>
                  <span 
                    className={`bg-white block h-0.5 w-6 rounded-sm transition-all duration-300 ${
                      isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  ></span>
                  <span 
                    className={`bg-white block h-0.5 w-6 rounded-sm transition-all duration-300 ${
                      isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
                    }`}
                  ></span>
                </div>
              </button>
            </div>
            </div>

            {/* 手機版下拉選單 - 只在 md 以下螢幕顯示 */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <nav className="pt-4 pb-2 border-t border-amber-500 mt-4 relative z-50">
                <div className="flex flex-col space-y-2">
                  <Link 
                    href="/client/bakery/points" 
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-amber-700 transition-colors duration-200 group"
                    onClick={closeMobileMenu}
                  >
                    <div className="bg-amber-500 p-2 rounded-lg mr-3 group-hover:bg-amber-400 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-lg">點數商城</div>
                      <div className="text-amber-200 text-sm">查看點數餘額與記錄</div>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/client/bakery/points/purchase" 
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-amber-700 transition-colors duration-200 group"
                    onClick={closeMobileMenu}
                  >
                    <div className="bg-amber-500 p-1 rounded-lg mr-3 group-hover:bg-amber-400 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-lg">購買點數卡</div>
                      <div className="text-amber-200 text-sm">購買虛擬點數卡商品</div>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/client/bakery/orders" 
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-amber-700 transition-colors duration-200 group"
                    onClick={closeMobileMenu}
                  >
                    <div className="bg-amber-500 p-2 rounded-lg mr-3 group-hover:bg-amber-400 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-lg">訂單查詢</div>
                      <div className="text-amber-200 text-sm">查看購買記錄</div>
                    </div>
                  </Link>
                </div>
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
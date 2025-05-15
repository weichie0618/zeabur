'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="md:hidden flex justify-between items-center w-full">
        <Link href="/" className="site-logo-container">
          <span className="text-white text-xl font-bold">樣品申請網站</span>
        </Link>
        
        <button 
          onClick={toggleMenu} 
          className="text-white focus:outline-none"
          aria-label="開啟選單"
        >
          <svg className="w-6 h-6" viewBox="0 0 18 14" aria-hidden="true">
            <rect y="0.00" width="18" height="1.7" rx="1" fill="currentColor"></rect>
            <rect y="6.15" width="18" height="1.7" rx="1" fill="currentColor"></rect>
            <rect y="12.3" width="18" height="1.7" rx="1" fill="currentColor"></rect>
          </svg>
        </button>
      </div>

      {/* 側邊選單 */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-lg transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">選單</h2>
            <button onClick={toggleMenu} className="focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="block py-2 hover:text-blue-600">首頁</Link>
              </li>
              <li>
                <Link href="/apply" className="block py-2 hover:text-blue-600">申請樣品</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      
      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMenu}
        ></div>
      )}
    </>
  );
} 
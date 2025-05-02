import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '烘焙坊 - 客戶購物區',
  description: '歡迎來到烘焙坊線上購物平台',
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
          <div className="text-center text-gray-600">
            <p>© 2024 烘焙坊. 版權所有.</p>

          </div>
        </div>
      </footer>
    </div>
  );
} 
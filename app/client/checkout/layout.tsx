// 伺服器端組件 - 不需要 'use client' 聲明
import { Metadata } from 'next';

// 設置頁面的 metadata
export const metadata: Metadata = {
  title: '晴朗家烘焙 - 結帳頁面',
  description: '完成您的訂單並選擇付款方式'
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 
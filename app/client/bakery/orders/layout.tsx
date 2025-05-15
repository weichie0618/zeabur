import { Metadata } from 'next';

// 設置訂單頁面的 metadata
export const metadata: Metadata = {
  title: '訂單查詢 | 晴朗家烘焙',
  description: '查詢您在晴朗家烘焙的訂單記錄'
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="orders-container">
      {children}
    </div>
  )
} 
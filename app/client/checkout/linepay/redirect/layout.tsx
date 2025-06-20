import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '付款處理中 | 麵包坊',
  description: '處理您的LinePay付款',
}

export default function LinePayRedirectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-amber-50 min-h-screen">
      {children}
    </div>
  )
} 
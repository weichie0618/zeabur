'use client';

import { LiffProvider } from '@/lib/LiffProvider';
import { Metadata } from 'next';

export default function LiffPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 使用環境變數中的 LIFF ID
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  return (
    <LiffProvider liffId={liffId}>
      {children}
    </LiffProvider>
  );
} 
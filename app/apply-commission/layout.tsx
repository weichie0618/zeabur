'use client';

import React from 'react';
import { SimpleLiffProvider } from './SimpleLiffProvider';

export default function ApplyCommissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 使用指定的LIFF ID
  const liffId = '2006372025-ZoXWrME5';

  return (
    <SimpleLiffProvider liffId={liffId}>
      {children}
    </SimpleLiffProvider>
  );
} 
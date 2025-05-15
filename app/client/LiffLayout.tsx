'use client';

import React, { ReactNode } from 'react';
import { LiffProvider } from '@/lib/LiffProvider';
import { getLiffId } from '@/lib/env';

interface LiffLayoutProps {
  children: ReactNode;
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const liffId = getLiffId();

  return (
    <LiffProvider liffId={liffId}>
      {children}
    </LiffProvider>
  );
} 
'use client';

import React, { ReactNode } from 'react';
import { LiffProvider } from '@/lib/LiffProvider';
import { PointsProvider } from '../contexts/PointsContext';
import { getLiffId } from '@/lib/env';

interface LiffLayoutProps {
  children: ReactNode;
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const liffId = getLiffId();

  return (
    <LiffProvider liffId={liffId}>
      <PointsProvider>
        {children}
      </PointsProvider>
    </LiffProvider>
  );
} 
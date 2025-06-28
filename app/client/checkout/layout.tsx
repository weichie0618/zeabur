'use client';

import React from 'react';
import { LiffLayout } from '../LiffLayout';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffLayout>
      {children}
    </LiffLayout>
  );
} 
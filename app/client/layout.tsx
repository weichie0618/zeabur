'use client';

import React from 'react';
import { LiffLayout } from './LiffLayout';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffLayout>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </LiffLayout>
  );
} 
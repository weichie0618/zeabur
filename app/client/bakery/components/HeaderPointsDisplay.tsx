import React from 'react';
import { useUserPoints } from '../../../contexts/PointsContext';
import { useLiff } from '@/lib/LiffProvider';

interface HeaderPointsDisplayProps {
  isMobile?: boolean;
}

export default function HeaderPointsDisplay({ isMobile = false }: HeaderPointsDisplayProps) {
  const { points, loading, error } = useUserPoints();
  const { isLoggedIn, profile } = useLiff();

  // 如果未登入，不顯示
  if (!isLoggedIn || !profile) {
    return null;
  }

  if (isMobile) {
    // 手機版樣式 - 在漢堡選單旁顯示
    return (
      <div className="md:hidden flex items-center bg-amber-500/20 rounded-lg px-2 py-1 mr-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 text-amber-100 mr-1" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.91-.01-2.2-1.9-2.96-3.65-3.28z"/>
        </svg>
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-100"></div>
          </div>
        ) : error ? (
          <span className="text-amber-100 text-xs">!</span>
        ) : (
          <div className="flex items-baseline">
            <span className="text-white font-semibold text-sm">{points.toLocaleString()}</span>
            <span className="text-amber-100 text-xs ml-0.5">點</span>
          </div>
        )}
      </div>
    );
  }

  // 桌面版樣式 - 在header右側顯示
  return (
    <div className="hidden md:flex items-center bg-amber-500/20 rounded-lg px-3 py-2 mr-4">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-amber-100 mr-2" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.91-.01-2.2-1.9-2.96-3.65-3.28z"/>
      </svg>
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-100 mr-1"></div>
          <span className="text-amber-100 text-sm">載入中</span>
        </div>
      ) : error ? (
        <span className="text-amber-100 text-xs">載入失敗</span>
      ) : (
        <div className="flex items-baseline">
          <span className="text-white font-semibold">{points.toLocaleString()}</span>
          <span className="text-amber-100 text-sm ml-1">點</span>
        </div>
      )}
    </div>
  );
} 
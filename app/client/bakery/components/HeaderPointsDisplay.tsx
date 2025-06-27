import React from 'react';
import { useUserPoints } from '../hooks/useUserPoints';
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
    // 手機版樣式 - 在漢堡選單中顯示
    return (
      <div className="px-4 py-2 bg-amber-500 rounded-lg mb-3 mx-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white mr-2" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-white text-sm font-medium">我的點數</span>
          </div>
          <div className="text-white">
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                <span className="text-sm">載入中</span>
              </div>
            ) : error ? (
              <span className="text-xs text-amber-100">載入失敗</span>
            ) : (
              <div className="flex items-baseline">
                <span className="text-lg font-bold">{points.toLocaleString()}</span>
                <span className="text-xs ml-1">點</span>
              </div>
            )}
          </div>
        </div>
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
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
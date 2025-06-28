'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLiff } from '@/lib/LiffProvider';

interface PointsData {
  lineUserId: string;
  totalEarnedPoints: number;
  totalUsedPoints: number;
  availablePoints: number;
  pendingPoints: number;
  expiredPoints: number;
  lastEarnedAt?: Date;
  lastUsedAt?: Date;
}

interface PointsContextType {
  points: number;
  pointsData: PointsData | null;
  loading: boolean;
  error: string;
  refreshPoints: () => Promise<void>;
  updatePoints: (newPoints: number) => void;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

interface PointsProviderProps {
  children: ReactNode;
}

export function PointsProvider({ children }: PointsProviderProps) {
  const { profile, isLoggedIn } = useLiff();
  const [points, setPoints] = useState<number>(0);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchPoints = useCallback(async (lineId: string) => {
    if (!lineId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/points/balance/${lineId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const pointsInfo = data.data;
        setPoints(pointsInfo.availablePoints || 0);
        setPointsData(pointsInfo);
      } else {
        setPoints(0);
        setPointsData(null);
      }
    } catch (err) {
      console.error('載入點數餘額失敗:', err);
      setError('載入點數失敗');
      setPoints(0);
      setPointsData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 重新載入點數
  const refreshPoints = useCallback(async () => {
    if (profile?.userId) {
      await fetchPoints(profile.userId);
    }
  }, [profile?.userId, fetchPoints]);

  // 手動更新點數（用於結帳後立即更新，避免重新請求）
  const updatePoints = useCallback((newPoints: number) => {
    setPoints(newPoints);
    if (pointsData) {
      setPointsData({
        ...pointsData,
        availablePoints: newPoints
      });
    }
  }, [pointsData]);

  // 當用戶登入且有profile時載入點數
  useEffect(() => {
    if (isLoggedIn && profile?.userId) {
      fetchPoints(profile.userId);
    } else if (!isLoggedIn) {
      // 用戶登出時清空點數
      setPoints(0);
      setPointsData(null);
      setError('');
    }
  }, [isLoggedIn, profile?.userId, fetchPoints]);

  const value: PointsContextType = {
    points,
    pointsData,
    loading,
    error,
    refreshPoints,
    updatePoints
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
}

// 自定義hook來使用PointsContext
export function usePoints(): PointsContextType {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}

// 為了向後兼容，保持useUserPoints的interface
export function useUserPoints() {
  const { points, loading, error, refreshPoints } = usePoints();
  return {
    points,
    loading,
    error,
    refreshPoints
  };
} 
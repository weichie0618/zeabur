import { useState, useEffect, useCallback } from 'react';
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

export function useUserPoints() {
  const { profile, isLoggedIn } = useLiff();
  const [points, setPoints] = useState<number>(0);
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
        setPoints(data.data.availablePoints || 0);
      } else {
        setPoints(0);
      }
    } catch (err) {
      console.error('載入點數餘額失敗:', err);
      setError('載入點數失敗');
      setPoints(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 重新載入點數
  const refreshPoints = useCallback(() => {
    if (profile?.userId) {
      fetchPoints(profile.userId);
    }
  }, [profile?.userId, fetchPoints]);

  // 當用戶登入且有profile時載入點數
  useEffect(() => {
    if (isLoggedIn && profile?.userId) {
      fetchPoints(profile.userId);
    }
  }, [isLoggedIn, profile?.userId, fetchPoints]);

  return {
    points,
    loading,
    error,
    refreshPoints
  };
} 
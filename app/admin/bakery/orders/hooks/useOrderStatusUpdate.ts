/**
 * 訂單狀態更新自訂Hook
 * 🔑 安全改進：使用 HttpOnly Cookie 認證
 */
import { useState } from 'react';
import { updateOrderStatus } from '../api';
import { Order } from '../types';

interface UseOrderStatusUpdateOptions {
  accessToken: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useOrderStatusUpdate = ({
  accessToken,
  onSuccess,
  onError
}: UseOrderStatusUpdateOptions) => {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (order: Order, status: string, note: string = '') => {
    if (!accessToken || !order) {
      onError?.('認證失敗或缺少訂單資訊');
      return null;
    }

    try {
      setLoading(true);
      
      // 🔑 安全改進：使用 HttpOnly Cookie 認證的 API 函數
      await updateOrderStatus(accessToken, order.id, status, note);
      
      onSuccess?.('訂單狀態更新成功');
      
      // 返回更新後的訂單對象
      return {
        ...order,
        status: status
      };
      
    } catch (err: any) {
      const errorMessage = err.message || '更新訂單狀態時出錯';
      onError?.(errorMessage);
      console.error('更新訂單狀態錯誤:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateStatus,
    loading
  };
}; 
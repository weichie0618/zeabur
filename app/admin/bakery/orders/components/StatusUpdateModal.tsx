'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { getAvailableStatusTransitions } from '../status';
import { statusMap } from '../constants';

// 簡化的統一接口
interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus: (status: string, note: string) => Promise<void>;
  loading: boolean;
}

/**
 * 訂單狀態更新模態窗口 - 統一簡化版本
 */
const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  loading
}) => {
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // 當訂單變更時重置狀態
  useEffect(() => {
    if (order) {
      setStatus(order.status || '');
      setNote('');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // 獲取可用的狀態選項
  const availableOptions = getAvailableStatusTransitions(order.status).map(code => ({
    value: code,
    label: statusMap[code] || code
  }));

  const handleSubmit = async () => {
    if (!status) return;
    
    try {
      await onUpdateStatus(status, note);
      onClose();
    } catch (error) {
      // 錯誤處理由父組件負責
      console.error('狀態更新失敗:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">更新訂單狀態</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">訂單編號: {order.order_number}</p>
          <p className="text-sm text-gray-600">客戶: {order.customer_name}</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">訂單狀態</label>
          <select
            className="w-full rounded-md border border-gray-300 p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {availableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">狀態備註</label>
          <textarea
            className="w-full rounded-md border border-gray-300 p-2"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可選填寫狀態變更的原因或備註"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={loading || !status}
          >
            {loading ? '處理中...' : '更新狀態'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal; 
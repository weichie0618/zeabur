'use client';

import React, { useState } from 'react';
import { Order } from '../types';
import { getAvailableStatusTransitions } from '../status';
import { statusMap } from '../constants';

// 基礎配置接口
interface BaseStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 列表頁使用的配置接口
interface OrderStatusUpdateModalProps extends BaseStatusUpdateModalProps {
  order: Order | null;
  onUpdateStatus: (status: string, note: string) => Promise<void>;
  loading: boolean;
  statusOptions?: never;
  currentStatus?: never;
}

// 編輯頁使用的配置接口
interface EditStatusUpdateModalProps extends BaseStatusUpdateModalProps {
  order?: never;
  onUpdateStatus: (status: string) => void;
  loading?: never;
  statusOptions: Array<{value: string, label: string}>;
  currentStatus: string;
}

// 組合類型
type StatusUpdateModalProps = OrderStatusUpdateModalProps | EditStatusUpdateModalProps;

// 檢查是否為編輯模式的類型守衛
const isEditModeCheck = (props: StatusUpdateModalProps): props is EditStatusUpdateModalProps => {
  return 'currentStatus' in props && 'statusOptions' in props;
};

/**
 * 訂單狀態更新模態窗口
 * 可以同時用於訂單列表頁和編輯頁
 */
const StatusUpdateModal: React.FC<StatusUpdateModalProps> = (props) => {
  const { isOpen, onClose } = props;
  
  // 判斷是哪種使用模式
  const isEditMode = isEditModeCheck(props);
  
  // 狀態初始化
  const initialStatus = isEditMode 
    ? props.currentStatus 
    : props.order?.status || '';
    
  const [status, setStatus] = useState<string>(initialStatus || '');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;
  if (!isEditMode && !props.order) return null;

  // 獲取可用的狀態選項
  let availableOptions: Array<{value: string, label: string}>;
  
  if (isEditMode && props.statusOptions) {
    availableOptions = props.statusOptions;
  } else if (!isEditMode && props.order) {
    availableOptions = getAvailableStatusTransitions(props.order.status).map(code => ({
      value: code,
      label: statusMap[code] || code
    }));
  } else {
    // 默認空數組，防止意外情況
    availableOptions = [];
  }

  const handleSubmit = async () => {
    if (!status) return;
    
    if (isEditMode) {
      // 編輯頁模式，直接調用回調函數
      props.onUpdateStatus(status);
      onClose();
    } else if (!isEditMode && props.order) {
      // 列表頁模式，調用異步函數並等待完成
      await props.onUpdateStatus(status, note);
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {!isEditMode && props.order && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">訂單編號: {props.order.order_number}</p>
            <p className="text-sm text-gray-600">客戶: {props.order.customer_name}</p>
          </div>
        )}
        
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
        
        {!isEditMode && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">狀態備註</label>
            <textarea
              className="w-full rounded-md border border-gray-300 p-2"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可選填寫狀態變更的原因或備註"
            ></textarea>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={isEditMode ? false : (props as OrderStatusUpdateModalProps).loading}
          >
            {isEditMode ? '確認' : ((props as OrderStatusUpdateModalProps).loading ? '處理中...' : '更新狀態')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal; 
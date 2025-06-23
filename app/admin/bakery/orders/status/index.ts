/**
 * 訂單狀態處理相關函數
 */
import { statusMap, getStatusDisplay as authServiceGetStatusDisplay, getStatusClass as authServiceGetStatusClass } from '../../utils/authService';

// 重新導出 authService 的狀態處理函數以保持一致性
export const getStatusDisplay = authServiceGetStatusDisplay;
export const getStatusClass = authServiceGetStatusClass;

/**
 * 判斷訂單是否可以取消
 * @param status 訂單狀態代碼
 * @returns 是否可以取消
 */
export const canCancelOrder = (status: string): boolean => {
  if (!status) return false;
  const upperStatus = status.toUpperCase();
  return upperStatus === 'PENDING' || upperStatus === 'PROCESSING';
};

/**
 * 判斷訂單是否可以編輯
 * @param status 訂單狀態代碼
 * @returns 是否可以編輯
 */
export const canEditOrder = (status: string): boolean => {
  if (!status) return false;
  const upperStatus = status.toUpperCase();
  return upperStatus !== 'CANCELLED' && upperStatus !== 'DELIVERED';
};

/**
 * 獲取訂單的可用狀態轉換選項
 * @param currentStatus 當前訂單狀態
 * @returns 可用的狀態轉換選項
 */
export const getAvailableStatusTransitions = (currentStatus: string): string[] => {
  const upperStatus = currentStatus?.toUpperCase() || '';
  
  switch (upperStatus) {
    case 'PENDING':
      return ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    case 'PROCESSING':
      return ['SHIPPED', 'DELIVERED', 'CANCELLED'];
    case 'SHIPPED':
      return ['DELIVERED', 'CANCELLED'];
    case 'DELIVERED':
      return ['DELIVERED'];
    case 'CANCELLED':
      return ['CANCELLED'];
    default:
      return ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  }
};

/**
 * 獲取可用的訂單狀態選項
 * @returns 狀態選項數組，包含value和label
 */
export const getStatusOptions = () => {
  return [
    { value: 'PENDING', label: statusMap['PENDING'] },
    { value: 'PROCESSING', label: statusMap['PROCESSING'] },
    { value: 'SHIPPED', label: statusMap['SHIPPED'] },
    { value: 'DELIVERED', label: statusMap['DELIVERED'] },
    { value: 'CANCELLED', label: statusMap['CANCELLED'] }
  ];
}; 
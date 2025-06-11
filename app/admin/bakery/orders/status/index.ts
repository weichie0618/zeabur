/**
 * 訂單狀態處理相關函數
 */
import { statusMap } from '../constants';

/**
 * 獲取訂單狀態的中文顯示
 * @param status 訂單狀態代碼
 * @returns 狀態的中文顯示文字
 */
export const getStatusDisplay = (status: string): string => {
  if (!status) return '未知';
  
  // 嘗試直接從映射中獲取
  const display = statusMap[status];
  if (display) return display;
  
  // 如果找不到，嘗試轉換為大寫再查找
  const uppercaseDisplay = statusMap[status.toUpperCase()];
  if (uppercaseDisplay) return uppercaseDisplay;
  
  // 如果仍找不到，返回原始狀態
  return status;
};

/**
 * 獲取訂單狀態的樣式類
 * @param status 訂單狀態代碼
 * @returns 對應的 CSS 類名
 */
export const getStatusClass = (status: string): string => {
  const upperStatus = status?.toUpperCase() || '';
  
  let styleClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
  
  switch (upperStatus) {
    case 'DELIVERED':
      return styleClass + 'bg-green-100 text-green-800';
    case 'PENDING':
      return styleClass + 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING':
      return styleClass + 'bg-blue-100 text-blue-800';
    case 'SHIPPED':
      return styleClass + 'bg-indigo-100 text-indigo-800';
    case 'CANCELLED':
      return styleClass + 'bg-red-100 text-red-800';
    default:
      return styleClass + 'bg-gray-100 text-gray-800';
  }
};

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
      return ['PENDING', 'PROCESSING', 'CANCELLED'];
    case 'PROCESSING':
      return ['PROCESSING', 'SHIPPED', 'CANCELLED'];
    case 'SHIPPED':
      return ['SHIPPED', 'DELIVERED', 'CANCELLED'];
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
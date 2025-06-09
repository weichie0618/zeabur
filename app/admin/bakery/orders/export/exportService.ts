/**
 * 匯出訂單服務
 * 用於處理訂單數據的匯出相關功能
 */

import { reverseStatusMap } from '../../utils/authService';

// 構建匯出訂單的查詢參數
export const buildExportQueryParams = (
  filters: {
    searchQuery: string;
    statusFilter: string;
    dateFilter: string;
    companyNameFilter: string;
    startDate: string;
    endDate: string;
  },
  exportAll: boolean
): URLSearchParams => {
  // 如果選擇匯出所有，則不添加過濾條件
  if (exportAll) {
    const params = new URLSearchParams({
      limit: '1000', // 增加匯出數量限制
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    return params;
  }

  // 構建查詢參數
  const params = new URLSearchParams({
    limit: '1000', // 增加匯出數量限制
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // 添加可選過濾條件
  if (filters.statusFilter) {
    params.append('status', reverseStatusMap[filters.statusFilter] || filters.statusFilter);
  }
  
  // 處理搜尋查詢
  if (filters.searchQuery) {
    // 檢查是否為訂單號格式
    if (/^ORD\d+$/.test(filters.searchQuery.trim())) {
      params.append('order_number', filters.searchQuery.trim());
    } else if (filters.searchQuery.includes('@')) {
      // 可能是電子郵件
      params.append('customer_email', filters.searchQuery.trim());
    } else if (/^[0-9-]+$/.test(filters.searchQuery.trim())) {
      // 可能是電話號碼
      params.append('customer_phone', filters.searchQuery.trim());
    } else {
      // 視為客戶名稱
      params.append('customer_name', filters.searchQuery.trim());
    }
  }
  
  // 添加公司名稱篩選
  if (filters.companyNameFilter) {
    params.append('companyName', filters.companyNameFilter);
  }
  
  // 處理日期過濾
  if (filters.dateFilter) {
    if (['today', 'yesterday', 'this_week', 'this_month', 'last_month'].includes(filters.dateFilter)) {
      params.append('date_range', filters.dateFilter);
    } else if (filters.dateFilter === 'custom') {
      // 自定義日期範圍
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
    }
  }
  
  return params;
};

// 獲取匯出所需的訂單數據
export const fetchOrdersForExport = async (
  filters: {
    searchQuery: string;
    statusFilter: string;
    dateFilter: string;
    companyNameFilter: string;
    startDate: string;
    endDate: string;
  },
  exportAll: boolean,
  getAuthHeaders: () => Record<string, string>
): Promise<any[]> => {
  try {
    // 構建查詢參數
    const params = buildExportQueryParams(filters, exportAll);
    
    console.log(`匯出訂單API請求: /api/orders?${params.toString()}`);
    
    // 發送請求獲取訂單數據
    const response = await fetch(`/api/orders?${params.toString()}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    // 處理認證錯誤
    if (response.status === 401) {
      throw new Error('認證失敗，請重新登入系統');
    }
    
    const data = await response.json();
    
    if (response.ok && data.orders) {
      return data.orders;
    } else {
      throw new Error(data.message || '獲取訂單數據失敗');
    }
  } catch (error: any) {
    console.error('匯出訂單錯誤:', error);
    throw new Error(error.message || '匯出訂單時發生錯誤');
  }
}; 
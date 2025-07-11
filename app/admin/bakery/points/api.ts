/**
 * 點數系統 API 服務
 * 🔑 安全改進：使用 HttpOnly Cookie 認證
 */

import { apiService } from '../../../services/api';
import { handleAuthError } from '../utils/authService';
import {
  UserPointsStats,
  PointTransaction,
  VirtualCardProduct,
  VirtualCardPurchase,
  PointSettings,
  PointsSystemStats,
  DailyPointsStats,
  VirtualCardSalesStats,
  PaginatedResponse,
  ApiResponse,
  UsersPointsQuery,
  TransactionsQuery,
  VirtualCardPurchasesQuery,
  EarnPointsRequest,
  DeductPointsRequest,
  CreateVirtualCardProductRequest,
  UpdateVirtualCardProductRequest,
  UpdatePaymentStatusRequest,
  UpdateSettingsRequest,
  ExportDataRequest
} from './types';

import axios from 'axios';

const API_BASE = '/api/points';

// 🔑 安全改進：創建專用的 points API 實例，自動包含 HttpOnly Cookie
const pointsApi_instance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true, // 🔑 關鍵：自動包含 HttpOnly Cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 🔑 安全改進：通用API請求函數 - 使用 HttpOnly Cookie 認證
 */
const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  try {
    const config: any = {
      method,
      url: endpoint,
    };

    if (body && method !== 'GET') {
      config.data = body;
    }

    const response = await pointsApi_instance.request(config);
    return response.data;
  } catch (error: any) {
    console.error(`API 請求錯誤 [${method} ${endpoint}]:`, error);
    
    if (error.response) {
      // 服務器響應了錯誤狀態碼
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('認證失敗，請重新登入');
      }
      throw new Error(`API 請求失敗: ${error.response.status} - ${error.response.data?.message || '未知錯誤'}`);
    } else if (error.request) {
      // 請求已發送但沒有收到響應
      throw new Error('網絡連接問題，請檢查您的網絡連接');
    } else {
      // 其他錯誤
      throw new Error(error.message || 'API 請求時發生未知錯誤');
    }
  }
};

/**
 * 用戶點數管理 API
 */
export const pointsApi = {
  // 取得所有用戶點數統計
  async getUsersPointsStats(query: UsersPointsQuery = {}): Promise<PaginatedResponse<UserPointsStats>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.search) params.set('search', query.search);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const endpoint = `/admin/users/points${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<PaginatedResponse<UserPointsStats>>(endpoint);
  },

  // 手動給予點數
  async earnPoints(request: EarnPointsRequest): Promise<ApiResponse<PointTransaction>> {
    return apiRequest<ApiResponse<PointTransaction>>('/admin/earn', 'POST', request);
  },

  // 手動扣除點數
  async deductPoints(request: DeductPointsRequest): Promise<ApiResponse<PointTransaction>> {
    return apiRequest<ApiResponse<PointTransaction>>('/admin/deduct', 'POST', request);
  },

  // 取得所有交易記錄
  async getTransactions(query: TransactionsQuery = {}): Promise<PaginatedResponse<PointTransaction>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.transactionType) params.set('transactionType', query.transactionType);
    if (query.status) params.set('status', query.status);
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.lineUserId) params.set('lineUserId', query.lineUserId.toString());

    const endpoint = `/admin/transactions${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<PaginatedResponse<PointTransaction>>(endpoint);
  },

  // 取得點數系統統計概覽
  async getPointsSystemStats(startDate?: string, endDate?: string): Promise<ApiResponse<PointsSystemStats>> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const endpoint = `/admin/stats/overview${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<ApiResponse<PointsSystemStats>>(endpoint);
  },

  // 取得每日點數統計
  async getDailyPointsStats(days: number = 30): Promise<ApiResponse<DailyPointsStats[]>> {
    const endpoint = `/admin/stats/daily?days=${days}`;
    return apiRequest<ApiResponse<DailyPointsStats[]>>(endpoint);
  }
};

/**
 * 虛擬點數卡管理 API
 */
export const virtualCardApi = {
  // 取得所有虛擬點數卡商品
  async getProducts(includeInactive: boolean = false): Promise<ApiResponse<VirtualCardProduct[]>> {
    const endpoint = `/admin/virtual-cards/products${includeInactive ? '?includeInactive=true' : ''}`;
    return apiRequest<ApiResponse<VirtualCardProduct[]>>(endpoint);
  },

  // 創建虛擬點數卡商品
  async createProduct(request: CreateVirtualCardProductRequest): Promise<ApiResponse<VirtualCardProduct>> {
    return apiRequest<ApiResponse<VirtualCardProduct>>('/admin/virtual-cards/products', 'POST', request);
  },

  // 更新虛擬點數卡商品
  async updateProduct(productId: number, request: UpdateVirtualCardProductRequest): Promise<ApiResponse<VirtualCardProduct>> {
    return apiRequest<ApiResponse<VirtualCardProduct>>(`/admin/virtual-cards/products/${productId}`, 'PUT', request);
  },

  // 更新商品狀態
  async updateProductStatus(productId: number, status: 'active' | 'inactive'): Promise<ApiResponse<VirtualCardProduct>> {
    return apiRequest<ApiResponse<VirtualCardProduct>>(`/admin/virtual-cards/products/${productId}/status`, 'PATCH', { status });
  },

  // 取得所有虛擬點數卡購買記錄
  async getPurchases(query: VirtualCardPurchasesQuery = {}): Promise<PaginatedResponse<VirtualCardPurchase>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);

    const endpoint = `/admin/virtual-cards/purchases${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<PaginatedResponse<VirtualCardPurchase>>(endpoint);
  },

  // 更新虛擬點數卡支付狀態
  async updatePaymentStatus(purchaseId: number, request: UpdatePaymentStatusRequest): Promise<ApiResponse<VirtualCardPurchase>> {
    return apiRequest<ApiResponse<VirtualCardPurchase>>(`/admin/virtual-cards/purchase/${purchaseId}/payment`, 'PUT', request);
  },

  // 虛擬點數卡銷售統計
  async getSalesStats(): Promise<ApiResponse<VirtualCardSalesStats[]>> {
    return apiRequest<ApiResponse<VirtualCardSalesStats[]>>('/admin/virtual-cards/stats');
  }
};

/**
 * 系統設定管理 API
 */
export const settingsApi = {
  // 取得所有系統設定
  async getSettings(): Promise<ApiResponse<PointSettings[]>> {
    return apiRequest<ApiResponse<PointSettings[]>>('/admin/settings');
  },

  // 更新系統設定
  async updateSettings(request: UpdateSettingsRequest): Promise<ApiResponse<PointSettings[]>> {
    return apiRequest<ApiResponse<PointSettings[]>>('/admin/settings', 'PUT', request);
  }
};

/**
 * 數據導出 API
 */
export const exportApi = {
  // 批量導出數據
  async exportData(request: ExportDataRequest): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/admin/export', 'POST', request);
  }
};

/**
 * 統一錯誤處理工具
 */
export const handleApiError = (
  error: any,
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  setShowAuthWarning?: (show: boolean) => void
) => {
  console.error('API 錯誤:', error);
  
  if (error.message && error.message.includes('認證')) {
    handleAuthError(error.message, setError, setLoading, setShowAuthWarning);
  } else {
    setError(error.message || '發生未知錯誤');
    setLoading(false);
  }
};

/**
 * 格式化日期為 API 所需格式
 */
export const formatDateForApi = (date: Date): string => {
  return date.toISOString();
};

/**
 * 格式化顯示日期
 */
export const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 格式化點數顯示
 */
export const formatPoints = (points: number | null | undefined): string => {
  if (points === null || points === undefined || isNaN(points)) {
    return '0 點';
  }
  return points.toLocaleString() + ' 點';
};

/**
 * 格式化金額顯示
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'NT$ 0';
  }
  return `NT$ ${amount.toLocaleString()}`;
}; 
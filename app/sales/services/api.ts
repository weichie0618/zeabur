// 業務員平台 API 服務
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://line.cityburger.com.tw';
const GSA_API_URL = 'https://line.cityburger.com.tw/gsa';

// GSA API 響應類型
interface GSAResponse {
  userId: string;
  isValid: boolean;
  storeValue: string;
  storeId: string;
}

// 業務員儀表板數據類型
interface SalespersonDashboard {
  salesperson: {
    id: string;
    name: string;
    email: string;
    companyName: string;
  };
  today: {
    total_orders: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    status_breakdown: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    date: string;
  };
  monthly: {
    total_orders: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    status_breakdown: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    month: string;
  };
  commission: {
    calculated: number;
    paid: number;
    total: number;
  };
}

// 業務員訂單類型
interface SalespersonOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  subtotal: number;
  status: string;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  orderItems: Array<{
    id: number;
    product_id: string;
    quantity: number;
    price: number;
    order_item_notes: string | null;
  }>;
}

// 佣金記錄類型
interface CommissionRecord {
  id: number;
  order_id: number;
  order_number: string;
  amount: number;
  rate: number;
  status: 'calculated' | 'paid' | 'cancelled';
  notes: string;
  created_at: string;
}

// 佣金規則類型
interface CommissionRule {
  id: number;
  name: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate: number | null;
  tiered_rules: Array<{
    min_amount: number;
    max_amount: number | null;
    rate: number;
  }> | null;
  description: string;
  effective_date: string;
  expiry_date: string | null;
}

// API 錯誤類型
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SalespersonApiService {
  private storeId: string | null = null;
  
  /**
   * 使用 LIFF 用戶ID 驗證並獲取業務員 storeId
   */
  async authenticateWithGSA(lineUserId: string): Promise<string> {
    try {
      const response = await fetch(GSA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: lineUserId
        })
      });

      if (!response.ok) {
        throw new ApiError(response.status, '驗證失敗');
      }

      const data: GSAResponse = await response.json();
      
      if (!data.isValid) {
        throw new ApiError(401, '用戶驗證無效');
      }

      this.storeId = data.storeId;
      
      // 存儲業務員資訊到 localStorage
      localStorage.setItem('salespersonInfo', JSON.stringify({
        storeId: data.storeId,
        storeValue: data.storeValue,
        userId: data.userId
      }));

      return data.storeId;
    } catch (error) {
      console.error('GSA API 驗證失敗:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, '網路連線錯誤');
    }
  }

  /**
   * 從 localStorage 獲取已儲存的 storeId
   */
  getStoredStoreId(): string | null {
    try {
      const stored = localStorage.getItem('salespersonInfo');
      if (stored) {
        const info = JSON.parse(stored);
        this.storeId = info.storeId;
        return info.storeId;
      }
    } catch (error) {
      console.error('讀取儲存的業務員資訊失敗:', error);
    }
    return null;
  }

  /**
   * 確保有有效的 storeId
   */
  private ensureStoreId(): string {
    const storeId = this.storeId || this.getStoredStoreId();
    if (!storeId) {
      throw new ApiError(401, '未驗證的業務員');
    }
    return storeId;
  }

  /**
   * 建立帶有業務員認證的請求頭
   */
  private getHeaders(): HeadersInit {
    const storeId = this.ensureStoreId();
    return {
      'Content-Type': 'application/json',
      'X-Salesperson-ID': storeId
    };
  }

  /**
   * 通用 API 請求方法
   */
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new ApiError(400, data.message || '請求失敗');
      }

      return data.data;
    } catch (error) {
      console.error(`API 請求失敗 ${endpoint}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, '網路連線錯誤');
    }
  }

  /**
   * 獲取業務員儀表板數據
   */
  async getDashboard(): Promise<SalespersonDashboard> {
    return this.apiRequest<SalespersonDashboard>('/salesperson/dashboard');
  }

  /**
   * 獲取業務員訂單列表
   */
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    orders: SalespersonOrder[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/salesperson/orders${queryString ? `?${queryString}` : ''}`;
    
    return this.apiRequest(endpoint);
  }

  /**
   * 獲取業務員佣金記錄
   */
  async getCommissions(params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    commissions: CommissionRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/salesperson/commissions${queryString ? `?${queryString}` : ''}`;
    
    return this.apiRequest(endpoint);
  }

  /**
   * 獲取業務員佣金規則
   */
  async getCommissionRules(): Promise<{ rules: CommissionRule[] }> {
    return this.apiRequest('/salesperson/commission-rules');
  }

  /**
   * 清除儲存的認證資訊
   */
  clearAuth(): void {
    this.storeId = null;
    localStorage.removeItem('salespersonInfo');
  }
}

// 導出單例實例
export const salespersonApi = new SalespersonApiService();

// 導出類型
export type {
  SalespersonDashboard,
  SalespersonOrder,
  CommissionRecord,
  CommissionRule,
  GSAResponse
};

// 導出 ApiError 類別
export { ApiError }; 
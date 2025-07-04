import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { SalespersonData } from '../context/SalespersonContext';

// API 基礎配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 開發環境標識
const isDev = process.env.NODE_ENV === 'development';

// 定義 API 回應類型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分潤專案類型
export interface CommissionPlan {
  id: number;
  name: string;
  description?: string;
  rule_type: 'fixed' | 'tiered';
  fixed_rate?: number;
  tiered_rules?: Array<{
    min_amount: number;
    max_amount: number | null;
    rate: number;
  }>;
  status: 'active' | 'inactive';
  effective_date?: string;
  expiry_date?: string;
}

// 業務員儀表板數據類型
export interface DashboardData {
  salesperson: {
    id: string;
    name: string;
    email: string;
    companyName: string;
    commission_plan_id?: number;
    contract_start_date?: string;
    contract_end_date?: string;
    commissionPlan?: CommissionPlan;
  };
  today: {
    total_orders: number;
    total_sales_amount: number;
    subtotal_sum: number;
    paid_sales_amount: number;
    pending_sales_amount: number;
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
    total_sales_amount: number;
    subtotal_sum: number;
    paid_sales_amount: number;
    pending_sales_amount: number;
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

// 訂單項目類型
export interface OrderItem {
  id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  order_item_notes: string | null;
}

// 訂單類型
export interface Order {
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
  orderItems: OrderItem[];
}

// 訂單列表回應類型
export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 分潤記錄類型
export interface Commission {
  id: number;
  order_id: number;
  order_number: string;
  amount: number;
  rate: number;
  status: string;
  notes: string;
  created_at: string;
}

// 分潤列表回應類型
export interface CommissionsResponse {
  commissions: Commission[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 分潤規則類型
export interface CommissionRule {
  id: number;
  name: string;
  rule_type: string;
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

// 合約資訊介面
export interface SalespersonContract {
  contract_start_date: string | null;
  contract_end_date: string | null;
}

// API回應介面
export interface CommissionRulesResponse {
  success: boolean;
  data?: {
    salesperson: SalespersonContract;
    rules: CommissionRule[];
  };
  error?: string;
}

// 業務員列表查詢參數
export interface SalespersonListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  hasPlan?: 'all' | 'yes' | 'no';
}

// 業務員列表回應
export interface SalespersonListResponse {
  success: boolean;
  data?: {
    customers: Array<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      companyName: string | null;
      location: string | null;
      status: 'active' | 'inactive';
      notes: string | null;
      commission_plan_id: number | null;
      contract_start_date: string | null;
      contract_end_date: string | null;
      created_at: string;
      updated_at: string;
      commissionPlan: {
        id: number;
        name: string;
        rule_type: string;
        fixed_rate: number;
        description: string;
      } | null;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  error?: string;
}

// API 實例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 攔截器設置
api.interceptors.request.use(
  (config) => {
    const storeId = localStorage.getItem('storeId');
    if (storeId) {
      config.headers['X-Salesperson-ID'] = storeId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (isDev) {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

// 通用的 API 請求包裝函數
async function makeApiRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>
): Promise<T> {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    if (isDev) {
      console.error('API Request failed:', error);
    }
    throw error;
  }
}

// 獲取所有業務員列表
export const getAllSalespersons = async (params: SalespersonListParams = {}): Promise<SalespersonListResponse> => {
  try {
    const response = await api.get('/api/salesperson/all', { params });
    return response.data;
  } catch (error) {
    console.error('獲取業務員列表失敗:', error);
    throw error;
  }
};

// 獲取業務員個人資料
export const getProfile = async (): Promise<ApiResponse<SalespersonData>> => {
  try {
    const response = await api.get('/api/salesperson/profile');
    return response.data;
  } catch (error) {
    console.error('獲取業務員資料失敗:', error);
    throw error;
  }
};

// 業務員 API 服務
export const salespersonApi = {
  // 獲取業務員儀表板數據
  getDashboard: async (storeId: string): Promise<ApiResponse<{ salesperson: DashboardData['salesperson'] }>> => {
    return makeApiRequest(() => 
      api.get(`/api/salesperson/dashboard`, {
        headers: { 'X-Salesperson-ID': storeId }
      })
    );
  },

  // 獲取業務員訂單列表
  getOrders: async (storeId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<OrdersResponse>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    return makeApiRequest(() => 
      api.get(`/api/salesperson/orders?${queryParams.toString()}`, {
        headers: { 'X-Salesperson-ID': storeId }
      })
    );
  },

  // 獲取業務員分潤記錄
  getCommissions: async (storeId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<CommissionsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    return makeApiRequest(() => 
      api.get(`/api/salesperson/commissions?${queryParams.toString()}`, {
        headers: { 'X-Salesperson-ID': storeId }
      })
    );
  },

  // 獲取業務員分潤規則
  getCommissionRules: async (storeId: string): Promise<CommissionRulesResponse> => {
    return makeApiRequest(() => 
      api.get(`/api/salesperson/commission-rules`, {
        headers: { 'X-Salesperson-ID': storeId }
      })
    );
  },

  // 獲取所有業務員列表
  getAllSalespersons: getAllSalespersons,

  // 獲取業務員個人資料
  getProfile: getProfile
};

// 管理後台 API（如果需要的話）
export const adminApi = {
  // 獲取所有業務員及其分潤規則
  getSalespersons: async (): Promise<ApiResponse<{
    salespersons: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      companyName: string;
      created_at: string;
      commission_rules: CommissionRule[];
    }>;
  }>> => {
    return makeApiRequest(() => 
      api.get('/api/admin/commission/salespersons')
    );
  },

  // 創建分潤規則
  createCommissionRule: async (data: {
    salesperson_id: string;
    name: string;
    rule_type: 'fixed' | 'tiered';
    fixed_rate?: number;
    tiered_rules?: Array<{
      min_amount: number;
      max_amount: number | null;
      rate: number;
    }>;
    description?: string;
    effective_date: string;
  }): Promise<ApiResponse<{
    rule: {
      id: number;
      salesperson_id: string;
      name: string;
      rule_type: string;
      status: string;
      created_at: string;
    };
  }>> => {
    return makeApiRequest(() => 
      api.post('/api/admin/commission/rules', data)
    );
  },

  // 計算分潤
  calculateCommissions: async (data: {
    startDate: string;
    endDate: string;
    salesperson_id: string;
  }): Promise<ApiResponse<{
    calculated_commissions: Array<{
      order_id: number;
      order_number: string;
      salesperson_id: string;
      order_amount: number;
      commission_amount: number;
      rate: number;
      commission_id: number;
    }>;
  }>> => {
    return makeApiRequest(() => 
      api.post('/api/admin/commission/calculate', data)
    );
  },

  // 獲取分潤記錄列表
  getCommissionRecords: async (params: {
    page?: number;
    limit?: number;
    salesperson_id?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<CommissionsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.salesperson_id) queryParams.append('salesperson_id', params.salesperson_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    return makeApiRequest(() => 
      api.get(`/api/admin/commission/records?${queryParams.toString()}`)
    );
  },

  // 更新分潤狀態
  updateCommissionStatus: async (id: number, status: string): Promise<ApiResponse<void>> => {
    return makeApiRequest(() => 
      api.put(`/api/admin/commission/records/${id}/status`, { status })
    );
  }
};

// 格式化金額
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// 格式化分潤金額（顯示到小數點後2位）
export const formatCommissionAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 格式化日期時間
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// 訂單狀態對應的中文
export const orderStatusMap: { [key: string]: string } = {
  pending: '待處理',
  processing: '處理中',
  shipped: '已出貨',
  delivered: '已送達',
  cancelled: '已取消',
};

// 付款狀態對應的中文
export const paymentStatusMap: { [key: string]: string } = {
  pending: '待付款',
  paid: '已付款',
  failed: '付款失敗',
  refunded: '已退款',
};

// 分潤狀態對應的中文
export const commissionStatusMap: { [key: string]: string } = {
  calculated: '已計算',
  paid: '已支付',
  cancelled: '已取消'
};

// 分潤規則類型映射
export const commissionRuleTypeMap: { [key: string]: string } = {
  fixed: '固定比例',
  tiered: '階梯式',
};

// 導出獨立的 API 實例供特殊用途使用
export { api }; 
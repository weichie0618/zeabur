/**
 * 訂單系統API服務
 * 🔑 安全改進：使用 HttpOnly Cookie 認證
 */
import { Order, OrdersResponse, EditOrderForm, OrderItem, Product } from '../types';
import { reverseStatusMap } from '../constants';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../utils/authService';

// 獲取訂單列表
export const fetchOrders = async (
  accessToken: string,
  page: number = 1,
  limit: number = 10,
  filters: {
    searchQuery?: string;
    statusFilter?: string;
    dateFilter?: string;
    companyNameFilter?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<OrdersResponse> => {
  try {
    // 構建查詢參數
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
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
      // 使用新的 date_range 參數
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

    console.log(`發送請求: /api/orders?${params.toString()}`);
    
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiGet(`/api/orders?${params.toString()}`);
    return data as OrdersResponse;
  } catch (err: any) {
    console.error('獲取訂單錯誤:', err);
    throw err;
  }
};

// 獲取待處理訂單數量
export const fetchPendingOrdersCount = async (accessToken: string): Promise<number> => {
  try {
    const params = new URLSearchParams({
      status: 'pending',
      page: '1',
      limit: '1000', // 設置較大的limit來獲取所有待處理訂單
    });

    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiGet(`/api/orders?${params.toString()}`);
    return data.orders?.length || 0;
  } catch (err: any) {
    console.error('獲取待處理訂單數量錯誤:', err);
    return 0; // 發生錯誤時返回0，避免影響主要功能
  }
};

// 獲取訂單詳情
export const fetchOrderDetail = async (
  accessToken: string,
  orderNumber: string
): Promise<Order> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiPost('/api/orders/check', { 
      order_number: orderNumber 
    });
    
    // 檢查數據結構 - API可能直接返回訂單對象或包含在order屬性中
    const orderData = data.order || data;
    if (orderData && orderData.id) {
      return formatOrderData(orderData);
    } else {
      throw new Error('獲取的訂單數據格式不正確');
    }
  } catch (err: any) {
    console.error('獲取訂單詳情錯誤:', err);
    throw err;
  }
};

// 更新訂單
export const updateOrder = async (
  accessToken: string,
  orderId: string,
  orderData: EditOrderForm
): Promise<Order> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiPut(`/api/orders/${orderId}`, orderData);
    return data.order || data;
  } catch (err: any) {
    console.error('更新訂單錯誤:', err);
    throw err;
  }
};

// 更新訂單狀態
export const updateOrderStatus = async (
  accessToken: string,
  orderId: string,
  status: string,
  note?: string
): Promise<Order> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiPut(`/api/orders/${orderId}/status`, {
      status,
      note,
    });
    return data.order || data;
  } catch (err: any) {
    console.error('更新訂單狀態錯誤:', err);
    throw err;
  }
};

// 取消訂單
export const cancelOrder = async (
  accessToken: string,
  orderNumber: string
): Promise<any> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiPut('/api/orders/cancel-by-number', {
      order_number: orderNumber
    });
    return data;
  } catch (err: any) {
    console.error('取消訂單錯誤:', err);
    throw err;
  }
};

// 獲取可用商品列表
export const fetchAvailableProducts = async (
  accessToken: string
): Promise<Product[]> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiGet('/api/products?fetchAll=true');
    
    // 過濾出狀態為 active 的商品
    const activeProducts = data.data.filter((product: any) => product.status === 'active');
    
    // 將 API 回應格式轉換為組件使用的格式
    const formattedProducts = activeProducts.map((product: any) => ({
      id: product.id.toString(),
      name: `${product.name} ${product.specification ? `(${product.specification})` : ''} - ${product.category?.name || ''}`,
      price: parseFloat(product.price),
      discount_price: product.discount_price ? parseFloat(product.discount_price) : undefined,
      category: product.category?.name || '',
      specification: product.specification || '',
      status: product.status
    }));
    
    return formattedProducts;
  } catch (err: any) {
    console.error('獲取產品列表錯誤:', err);
    throw err;
  }
};

// 獲取客戶列表
export const fetchCustomers = async (
  accessToken: string,
  limit: number = 100
): Promise<Array<{id: string, companyName: string}>> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sortBy: 'companyName',
      order: 'ASC'
    });

    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiGet(`/api/customers?${params.toString()}`);
    
    if (data.data) {
      // 過濾出有公司名稱的客戶
      const customersWithCompany = data.data.filter((customer: any) => 
        customer.companyName && customer.companyName.trim() !== ''
      );
      
      // 轉換為標準格式
      const formattedCustomers = customersWithCompany.map((customer: any) => ({
        id: customer.id.toString(),
        companyName: customer.companyName
      }));
      
      return formattedCustomers;
    } else {
      return [];
    }
  } catch (err: any) {
    console.error('獲取客戶列表錯誤:', err);
    // 返回空陣列而不拋出錯誤，因為這不是核心功能
    return [];
  }
};

// 格式化訂單數據的輔助函數
const formatOrderData = (orderData: any): Order => {
  // 這個函數處理 API 回傳的數據格式與元件期望格式之間的轉換
  return {
    ...orderData,
    orderItems: orderData.items || orderData.orderItems || []
  };
};

// 更新訂單項目
export const updateOrderItem = async (
  accessToken: string,
  orderId: string,
  items: Array<{
    id?: string;
    product_id: string;
    quantity: number;
    price?: number;
  }>
): Promise<{order: Order}> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiPut(`/api/orders/${orderId}/items`, {
      items: items
    });
    
    return {
      order: formatOrderData(data.order || data)
    };
  } catch (err: any) {
    console.error('更新訂單項目錯誤:', err);
    throw err;
  }
};

// 刪除訂單項目
export const deleteOrderItem = async (
  accessToken: string,
  orderId: string,
  itemId: string
): Promise<{order: Order, message: string}> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiDelete(`/api/orders/${orderId}/items/${itemId}`);
    
    return {
      order: formatOrderData(data.order || data),
      message: data.message || '項目刪除成功'
    };
  } catch (err: any) {
    console.error('刪除訂單項目錯誤:', err);
    throw err;
  }
};

// 新增訂單項目
export const addOrderItem = async (
  accessToken: string,
  orderId: string,
  product_id: string,
  quantity: number,
  price?: number
): Promise<{order: Order}> => {
  try {
    // 🔑 安全改進：使用 HttpOnly Cookie 認證
    const data = await apiPost(`/api/orders/${orderId}/items`, {
      product_id,
      quantity,
      price
    });
    
    return {
      order: formatOrderData(data.order || data)
    };
  } catch (err: any) {
    console.error('新增訂單項目錯誤:', err);
    throw err;
  }
}; 
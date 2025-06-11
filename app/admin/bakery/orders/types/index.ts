/**
 * 訂單系統相關類型定義
 */

// 訂單類型
export interface Order {
  id: string;
  order_number: string;
  salesperson_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  created_at: string;
  updated_at?: string;
  notes?: string | null;
  lineid?: string;
  orderItems?: OrderItem[];
  address?: string | Address;
  line_user?: {
    id: number;
    lineId: string;
    displayName: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  auth_user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  shipping_method?: string;
  salesperson?: {
    id: string;
    companyName: string;
  };
  payment_method?: string;
  payment_status?: string;
  shipping_status?: string;
  shipping_fee?: number;
  carrier?: string;
  taxId?: string;
  
  // 為了支持API響應的兼容性
  items?: OrderItem[];
}

// 訂單項目類型
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit_price?: number;
  product?: Product;
}

// 商品類型
export interface Product {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  category?: string;
  specification?: string;
  status?: string;
}

// 地址類型
export interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  address1: string;
  city: string;
  postal_code: string;
}

// 訂單響應類型
export interface OrdersResponse {
  total: number;
  page: number;
  totalPages: number;
  orders: Order[];
  message?: string;
}

// 編輯訂單表單類型
export interface EditOrderForm {
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    recipientName?: string;
    phone?: string;
    address1?: string;
    city?: string;
    postal_code?: string;
  };
  status?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_method?: string;
  shipping_status?: string;
  notes?: string;
  lineid?: string;
  salesperson_id?: string;
  carrier?: string;
  taxId?: string;
  shipping_fee?: number;
  items?: Array<{
    id?: string;
    product_id: string;
    quantity: number;
    price?: number;
  }>;
}

// 匯出相關的過濾器類型
export interface ExportFilters {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
  companyNameFilter: string;
  startDate: string;
  endDate: string;
} 
// 點數系統相關類型定義

// 用戶點數統計
export interface UserPointsStats {
  lineUserId: number;
  displayName: string;
  name: string;
  email: string;
  phone: string;
  totalEarnedPoints: number;
  totalUsedPoints: number;
  availablePoints: number;
  pendingPoints: number;
  expiredPoints: number;
  lastEarnedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 點數交易記錄
export interface PointTransaction {
  id: number;
  lineUserId: number;
  orderId?: number;
  virtualCardPurchaseId?: number;
  transactionType: TransactionType;
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  description: string;
  status: TransactionStatus;
  createdBy: string;
  createdAt: string;
  referenceData?: any;
  lineUser?: {
    id: number;
    displayName: string;
    name: string;
  };
  order?: {
    id: number;
    orderNumber: string;
  };
}

// 交易類型
export enum TransactionType {
  EARN_PURCHASE = 'earn_purchase',
  USE_PAYMENT = 'use_payment',
  VIRTUAL_CARD_REDEEM = 'virtual_card_redeem',
  ADMIN_ADJUST = 'admin_adjust'

}

// 交易狀態
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 虛擬點數卡商品
export interface VirtualCardProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  pointsValue: number;
  imageUrl?: string;
  status: VirtualCardStatus;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// 虛擬點數卡狀態
export enum VirtualCardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// 虛擬點數卡購買記錄
export interface VirtualCardPurchase {
  id: number;
  lineUserId: number;
  virtualCardProductId: number;
  paymentMethod: VirtualCardPaymentMethod;
  paymentStatus: VirtualCardPaymentStatus;
  pointsRedeemed: number;
  purchasePrice: number;
  transactionId?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  paymentDetails?: any;
  createdAt: string;
  updatedAt: string;
  virtualCardProduct?: VirtualCardProduct;
  lineUser?: {
    id: number;
    displayName: string;
    name: string;
  };
}

// 虛擬點數卡支付方式
export enum VirtualCardPaymentMethod {
  CREDIT_CARD = 'credit_card',
  LINE_PAY = 'line_pay',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash'
}

// 虛擬點數卡支付狀態
export enum VirtualCardPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 系統設定
export interface PointSettings {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 點數系統統計
export interface PointsSystemStats {
  totalTransactions: number;
  totalPointsEarned: number;
  totalPointsUsed: number;
  activeUsers: number;
  totalAvailablePoints: number;
}

// 每日點數統計
export interface DailyPointsStats {
  date: string;
  transactionCount: number;
  pointsEarned: number;
  pointsUsed: number;
  activeUsers: number;
}

// 虛擬點數卡銷售統計
export interface VirtualCardSalesStats {
  name: string;
  purchase_count: string;
  total_revenue: string;
  total_points: string;
}

// API 分頁響應
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API 基本響應
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 查詢參數
export interface UsersPointsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TransactionsQuery {
  page?: number;
  limit?: number;
  transactionType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  lineUserId?: number;
}

export interface VirtualCardPurchasesQuery {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

// 手動調整點數請求
export interface EarnPointsRequest {
  lineUserId: number;
  amount: number;
  description?: string;
  adminNote?: string;
}

export interface DeductPointsRequest {
  lineUserId: number;
  points: number;
  description?: string;
  adminNote?: string;
}

// 虛擬點數卡商品創建/更新請求
export interface CreateVirtualCardProductRequest {
  name: string;
  description: string;
  price: number;
  pointsValue: number;
  imageUrl?: string;
  displayOrder?: number;
}

export interface UpdateVirtualCardProductRequest extends Partial<CreateVirtualCardProductRequest> {
  status?: VirtualCardStatus;
}

// 支付狀態更新請求
export interface UpdatePaymentStatusRequest {
  paymentStatus: VirtualCardPaymentStatus;
  transactionId?: string;
  paymentDetails?: any;
  adminNote?: string;
}

// 系統設定更新請求
export interface UpdateSettingsRequest {
  settings: Array<{
    id: number;
    settingValue: string;
  }>;
}

// 數據導出請求
export interface ExportDataRequest {
  type: 'transactions' | 'user_points' | 'virtual_card_purchases';
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv';
} 
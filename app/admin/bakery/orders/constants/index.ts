/**
 * 訂單系統相關常量定義
 */

// 訂單狀態映射（從英文到中文）
export const statusMap: Record<string, string> = {
  'PENDING': '待處理',
  'PROCESSING': '處理中',
  'SHIPPED': '已出貨',
  'DELIVERED': '已送達',
  'CANCELLED': '已取消',
  'pending': '待處理',
  'processing': '處理中',
  'shipped': '已出貨',
  'delivered': '已送達',
  'cancelled': '已取消'
};

// 訂單狀態反向映射（從中文到英文）
export const reverseStatusMap: Record<string, string> = {
  '待處理': 'PENDING',
  '處理中': 'PROCESSING',
  '已出貨': 'SHIPPED',
  '已送達': 'DELIVERED',
  '已取消': 'CANCELLED'
};

// 付款方式選項
export const paymentMethodOptions = [
  { value: 'cash', label: '現金' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'bank_transfer', label: '銀行轉帳' },
  { value: 'line_pay', label: 'Line Pay' }
];

// 付款狀態選項
export const paymentStatusOptions = [
  { value: 'pending', label: '未付款' },
  { value: 'paid', label: '已付款' },
  { value: 'refunded', label: '已退款' },
  { value: 'failed', label: '付款失敗' }
];

// 配送方式選項
export const shippingMethodOptions = [
  { value: 'takkyubin_payment', label: '黑貓宅急便-匯款' },
  { value: 'takkyubin_cod', label: '黑貓宅急便-貨到付款' },
  { value: 'pickup', label: '自取' }
];

// 配送狀態選項
export const shippingStatusOptions = [
  { value: 'pending', label: '待出貨' },
  { value: 'processing', label: '準備中' },
  { value: 'shipped', label: '已出貨' },
  { value: 'delivered', label: '已送達' },
  { value: 'cancelled', label: '已取消' }
];

// 日期過濾選項
export const dateFilterOptions = [
  { value: '', label: '所有時間' },
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'this_week', label: '本週' },
  { value: 'this_month', label: '本月' },
  { value: 'last_month', label: '上個月' },
  { value: 'custom', label: '自訂日期範圍' }
]; 
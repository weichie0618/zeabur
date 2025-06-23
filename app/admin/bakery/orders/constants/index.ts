/**
 * 訂單系統相關常量定義
 */

// 重新導出 authService 的狀態映射以保持一致性
export { statusMap, reverseStatusMap } from '../../utils/authService';

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
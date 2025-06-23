/**
 * 訂單系統通用工具函數
 */
import { EditOrderForm } from '../types';

// 重新導出 authService 的函數以保持向後兼容性
export { 
  getAuthHeaders, 
  initializeAuth, 
  handleAuthError, 
  setupAuthWarningAutoHide,
  handleRelogin
} from '../../utils/authService';

/**
 * 格式化訂單數據
 * 處理API返回數據中items和orderItems不一致的情況
 * @param order 從API獲取的訂單數據
 * @returns 統一格式化後的訂單數據
 */
export const formatOrderData = (order: any) => {
  if (!order) return null;
  
  // 複製訂單對象，避免修改原始數據
  const formattedOrder = { ...order };
  
  // 處理 items 和 orderItems 不一致的情況
  if (Array.isArray(formattedOrder.items) && (!formattedOrder.orderItems || formattedOrder.orderItems.length === 0)) {
    formattedOrder.orderItems = formattedOrder.items;
  } else if (Array.isArray(formattedOrder.orderItems) && (!formattedOrder.items || formattedOrder.items.length === 0)) {
    formattedOrder.items = formattedOrder.orderItems;
  }
  
  return formattedOrder;
};

/**
 * 格式化貨幣顯示
 * @param amount 金額
 * @param currency 貨幣符號，默認為 NT$
 * @returns 格式化後的貨幣字符串
 */
export const formatCurrency = (amount: number | string | undefined, currency: string = 'NT$'): string => {
  if (amount === undefined || amount === null) return `${currency}0`;
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return `${currency}0`;
  
  return `${currency}${numericAmount.toLocaleString('zh-TW')}`;
};

/**
 * 格式化日期顯示
 * @param dateStr 日期字符串
 * @param includeTime 是否包含時間，默認為 true
 * @returns 格式化後的日期字符串
 */
export const formatDate = (dateStr: string | undefined, includeTime: boolean = true): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    if (includeTime) {
      return date.toLocaleString('zh-TW');
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  } catch (err) {
    console.error('日期格式化錯誤:', err);
    return dateStr;
  }
};

/**
 * 驗證訂單表單
 * @param form 訂單表單數據
 * @returns 驗證結果，包含是否有效和錯誤信息
 */
export const validateOrderForm = (form: EditOrderForm): { 
  isValid: boolean; 
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  // 驗證客戶信息
  if (form.customer_info) {
    if (!form.customer_info.name || form.customer_info.name.trim() === '') {
      errors['customer_name'] = '客戶姓名為必填項';
    }
    
    if (form.customer_info.email && !/^\S+@\S+\.\S+$/.test(form.customer_info.email)) {
      errors['customer_email'] = '請輸入有效的電子郵件格式';
    }
    
    if (form.customer_info.phone && !/^[0-9-+() ]{8,15}$/.test(form.customer_info.phone)) {
      errors['customer_phone'] = '請輸入有效的電話號碼';
    }
  }
  
  // 驗證配送地址 (如果不是自取)
  if (form.shipping_address && form.shipping_address.address1 !== '自取') {
    if (!form.shipping_address.recipientName || form.shipping_address.recipientName.trim() === '') {
      errors['recipient_name'] = '收件人姓名為必填項';
    }
    
    if (!form.shipping_address.phone || form.shipping_address.phone.trim() === '') {
      errors['shipping_phone'] = '收件人電話為必填項';
    }
    
    if (!form.shipping_address.address1 || form.shipping_address.address1.trim() === '') {
      errors['shipping_address'] = '配送地址為必填項';
    }
  }
  
  // 驗證訂單項目
  if (!form.items || form.items.length === 0) {
    errors['items'] = '訂單必須包含至少一個商品';
  } else {
    form.items.forEach((item, index) => {
      if (!item.product_id) {
        errors[`item_${index}_product`] = '商品為必選項';
      }
      
      if (item.quantity <= 0) {
        errors[`item_${index}_quantity`] = '數量必須大於0';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 
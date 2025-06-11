/**
 * 訂單系統通用工具函數
 */
import { EditOrderForm } from '../types';

/**
 * 獲取認證標頭
 * @param accessToken 訪問令牌
 * @returns 包含授權標頭的對象
 */
export const getAuthHeaders = (accessToken: string) => {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
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

/**
 * 自動隱藏認證警告
 * @param error 錯誤信息
 * @param setShowAuthWarning 設置顯示認證警告的函數
 * @returns 清理函數
 */
export const setupAuthWarningAutoHide = (
  error: string | null,
  setShowAuthWarning: React.Dispatch<React.SetStateAction<boolean>>
): (() => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  if (error && error.includes('認證')) {
    setShowAuthWarning(true);
    
    // 10秒後自動隱藏警告
    timeoutId = setTimeout(() => {
      setShowAuthWarning(false);
    }, 10000);
  }
  
  // 返回清理函數
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};

/**
 * 初始化認證
 * @param setAccessToken 設置訪問令牌的函數
 * @param setError 設置錯誤信息的函數
 * @param setLoading 設置加載狀態的函數
 * @param setShowAuthWarning 設置顯示認證警告的函數
 */
export const initializeAuth = (
  setAccessToken: React.Dispatch<React.SetStateAction<string>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setShowAuthWarning: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  // 從cookies中讀取accessToken
  const getCookieValue = (name: string) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      console.log(`找到 ${name} cookie`);
      return decodeURIComponent(match[2]);
    } else {
      console.warn(`未找到 ${name} cookie`);
      return '';
    }
  };
  
  // 獲取令牌的函數
  const getToken = () => {
    // 先檢查 localStorage 是否有令牌
    let token = localStorage.getItem('accessToken');
    if (token) {
      console.log('從 localStorage 獲取令牌成功');
      return token;
    }
    
    // 如果 localStorage 沒有，再嘗試從 cookie 獲取
    token = getCookieValue('accessToken');
    if (token) {
      console.log('從 cookie 獲取令牌成功');
      // 將token也保存到localStorage，確保一致性
      localStorage.setItem('accessToken', token);
      return token;
    }
    
    console.error('無法獲取認證令牌');
    return '';
  };
  
  // 嘗試獲取令牌
  const token = getToken();
  
  if (token) {
    console.log('成功獲取令牌，長度:', token.length);
    setAccessToken(token);
  } else {
    setError('未獲取到認證令牌，請確認您已登入系統');
    setShowAuthWarning(true);
    setLoading(false);
  }
  
  // 添加重試機制
  let retryCount = 0;
  const maxRetries = 3;
  
  const retryFetchToken = () => {
    if (retryCount >= maxRetries) return;
    
    console.log(`嘗試重新獲取令牌 (第 ${retryCount + 1} 次)`);
    const newToken = getToken();
    
    if (newToken) {
      console.log('重試獲取令牌成功');
      setAccessToken(newToken);
    } else {
      retryCount++;
      // 延遲重試
      setTimeout(retryFetchToken, 1000);
    }
  };
  
  // 如果沒有token，嘗試重新獲取
  if (!token) {
    setTimeout(retryFetchToken, 1000);
  }
};

/**
 * 處理認證錯誤
 * @param errorMessage 錯誤信息
 * @param setError 設置錯誤信息的函數
 * @param setLoading 設置加載狀態的函數
 * @param setShowAuthWarning 設置顯示認證警告的函數
 */
export const handleAuthError = (
  errorMessage: string,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setShowAuthWarning: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  console.error('認證錯誤:', errorMessage);
  setError(`認證失敗: ${errorMessage}。請重新登入系統。`);
  setShowAuthWarning(true);
  setLoading(false);
};

/**
 * 重新登入
 */
export const handleRelogin = (): void => {
  // 清除舊的令牌
  localStorage.removeItem('accessToken');
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // 跳轉到登錄頁面，並帶上當前頁面的URL作為重定向地址
  window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
};

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
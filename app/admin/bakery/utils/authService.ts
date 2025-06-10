/**
 * 認證服務模組
 * 提供獲取認證令牌、處理認證錯誤、狀態映射等通用功能
 */

// 訂單狀態映射 - 確保全部使用大寫鍵
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

// 反向狀態映射 (用於API請求)
export const reverseStatusMap: Record<string, string> = {
  '待處理': 'PENDING',
  '處理中': 'PROCESSING',
  '已出貨': 'SHIPPED',
  '已送達': 'DELIVERED',
  '已取消': 'CANCELLED'
};

/**
 * 從 localStorage 或 cookie 獲取認證令牌
 * @returns 認證令牌或空字串
 */
export const getToken = (): string => {
  // 從cookies中讀取accessToken
  const getCookieValue = (name: string): string => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      console.log(`找到 ${name} cookie`);
      return decodeURIComponent(match[2]);
    } else {
      console.warn(`未找到 ${name} cookie`);
      return '';
    }
  };

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

/**
 * 創建帶有認證標頭的請求頭
 * @param accessToken 認證令牌
 * @returns 包含認證信息的請求頭
 */
export const getAuthHeaders = (accessToken: string): Record<string, string> => {
  if (!accessToken) {
    console.warn('getAuthHeaders: accessToken 為空');
  } else {
    console.log('getAuthHeaders: 使用令牌', accessToken.substring(0, 10) + '...');
  }
  
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

/**
 * 執行重新登入
 * @param returnUrl 登入後返回的URL (可選)
 */
export const handleRelogin = (returnUrl?: string): void => {
  console.log('執行重新登入流程');
  
  // 清除當前令牌
  localStorage.removeItem('accessToken');
  
  // 刪除 cookie (透過設置過期時間為過去)
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // 記錄當前URL，以便登錄後返回
  const redirectUrl = returnUrl || encodeURIComponent(window.location.pathname);
  alert("已超過使用期間，請重新登入");
  // 跳轉到登入頁面
  window.location.href = `/login`;
};

/**
 * 初始化獲取認證令牌並設置重試機制
 * @param setAccessToken 設置令牌的狀態更新函數
 * @param setError 設置錯誤訊息的狀態更新函數
 * @param setLoading 設置載入狀態的狀態更新函數
 * @param setShowAuthWarning 設置是否顯示認證警告的狀態更新函數
 * @param redirectOnFailure 認證失敗是否自動重定向 (默認true)
 */
export const initializeAuth = (
  setAccessToken: (token: string) => void,
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  setShowAuthWarning?: (show: boolean) => void,
  redirectOnFailure: boolean = true
): void => {
  // 嘗試獲取令牌
  const token = getToken();
  
  if (token) {
    console.log('成功獲取令牌，長度:', token.length);
    setAccessToken(token);
  } else {
    setError('未獲取到認證令牌，請確認您已登入系統。請嘗試重新登入後再訪問此頁面。');
    if (setShowAuthWarning) {
      setShowAuthWarning(true);
    }
    
    // 直接重定向到登入頁面
    if (redirectOnFailure) {
      handleRelogin();
    }
    setLoading(false);
    return;
  }
  
  // 添加重試機制
  let retryCount = 0;
  const maxRetries = 3;
  
  const retryFetchToken = () => {
    if (retryCount >= maxRetries) {
      // 重試失敗，直接重定向到登入頁面
      if (redirectOnFailure) {
        handleRelogin();
      }
      return;
    }
    
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
 * @param errorMessage 錯誤訊息
 * @param setError 設置錯誤的狀態更新函數
 * @param setLoading 設置載入狀態的狀態更新函數
 * @param setShowAuthWarning 設置是否顯示認證警告的狀態更新函數
 */
export const handleAuthError = (
  errorMessage: string,
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  setShowAuthWarning?: (show: boolean) => void
): void => {
  console.error(errorMessage);
  // 先檢查localStorage和cookie，確認令牌是否已丟失
  const hasLocalStorageToken = !!localStorage.getItem('accessToken');
  const hasCookieToken = document.cookie.includes('accessToken=');
  
  if (!hasLocalStorageToken && !hasCookieToken) {
    setError('認證令牌已丟失，請重新登入系統。您的登入可能已過期。');
  } else {
    // 令牌存在但可能已過期或無效
    setError('認證失敗，您的登入可能已過期或令牌無效。請嘗試重新登入系統。');
  }
  setLoading(false);
  
  // 自動重新登入，不顯示警告
  if (setShowAuthWarning) {
    setShowAuthWarning(false);
  }
  
  // 短暫延遲後直接跳轉到登入頁面
  setTimeout(() => {
    handleRelogin();
  }, 100);
};

/**
 * 獲取訂單狀態的中文顯示
 * @param status 訂單狀態
 * @returns 中文狀態顯示
 */
export const getStatusDisplay = (status: string): string => {
  if (!status) return '未知';
  
  // 嘗試直接從映射中獲取
  const display = statusMap[status];
  if (display) return display;
  
  // 如果找不到，嘗試轉換為大寫再查找
  const uppercaseDisplay = statusMap[status.toUpperCase()];
  if (uppercaseDisplay) return uppercaseDisplay;
  
  // 如果仍找不到，返回原始狀態
  return status;
};

/**
 * 獲取訂單狀態的樣式類
 * @param status 訂單狀態
 * @returns CSS類名
 */
export const getStatusClass = (status: string): string => {
  const upperStatus = status?.toUpperCase() || '';
  
  let styleClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
  
  switch (upperStatus) {
    case 'DELIVERED':
      return styleClass + 'bg-green-100 text-green-800';
    case 'PENDING':
      return styleClass + 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING':
      return styleClass + 'bg-blue-100 text-blue-800';
    case 'SHIPPED':
      return styleClass + 'bg-indigo-100 text-indigo-800';
    case 'CANCELLED':
      return styleClass + 'bg-red-100 text-red-800';
    default:
      return styleClass + 'bg-gray-100 text-gray-800';
  }
};

/**
 * 自動監聽錯誤並顯示認證警告
 * @param error 錯誤訊息
 * @param setShowAuthWarning 設置是否顯示認證警告的狀態更新函數
 * @returns 清理函數
 */
export const setupAuthWarningAutoHide = (
  error: string | null,
  setShowAuthWarning: (show: boolean) => void
): (() => void) => {
  if (error && error.includes('認證')) {
    setShowAuthWarning(true);
    
    // 5秒後自動隱藏頂部警告條，但保留錯誤訊息
    const timer = setTimeout(() => {
      setShowAuthWarning(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }
  
  return () => {};
}; 
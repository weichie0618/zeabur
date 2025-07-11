/**
 * 認證服務模組
 * 提供獲取認證令牌、處理認證錯誤、狀態映射等通用功能
 */

import axios from 'axios';

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
 * 🔑 安全改進：檢查認證狀態（不再直接獲取 token）
 * HttpOnly Cookie 無法被 JavaScript 讀取，這是安全設計
 * @returns 總是返回空字串，實際認證由 Cookie 自動處理
 */
export const getToken = (): string => {
  // 🔑 重要：HttpOnly Cookie 無法被 JavaScript 讀取
  // 這是安全特性，防止 XSS 攻擊
  console.warn('getToken 已棄用：HttpOnly Cookie 無法被 JavaScript 讀取');
  console.info('認證狀態由 HttpOnly Cookie 自動管理，請檢查網絡請求是否包含 Cookie');
  
  return ''; // 總是返回空字串
};

/**
 * 🔑 安全改進：創建基本請求頭（不再包含 Authorization）
 * HttpOnly Cookie 會自動包含在請求中
 * @param accessToken 已棄用參數，保留為兼容性
 * @returns 基本請求頭（不含 Authorization）
 */
export const getAuthHeaders = (accessToken?: string): Record<string, string> => {
  if (accessToken) {
    console.warn('getAuthHeaders: accessToken 參數已棄用，HttpOnly Cookie 會自動處理認證');
  }
  
  return {
    'Content-Type': 'application/json',
    // 🔑 移除：'Authorization': `Bearer ${accessToken}`
    // HttpOnly Cookie 會自動包含在請求中
  };
};

/**
 * 🔑 安全改進：執行重新登入（不再清除 localStorage）
 * @param returnUrl 登入後返回的URL (可選)
 */
export const handleRelogin = (returnUrl?: string): void => {
  console.log('執行重新登入流程');
  
  // 🔑 安全改進：不再清除 localStorage（因為沒有存儲 tokens）
  // HttpOnly Cookie 會由瀏覽器自動管理或由後端清除
  
  // 記錄當前URL，以便登錄後返回
  const redirectUrl = returnUrl || window.location.pathname;
  alert("已超過使用期間，請重新登入");
  // 跳轉到登入頁面，並帶上重定向參數
  window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
};

/**
 * 🔑 安全改進：初始化認證狀態檢查（不再依賴 token 獲取）
 * @param setAccessToken 已棄用，保留為兼容性
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
  // 🔑 安全改進：不再嘗試獲取 token，改為檢查認證狀態
  console.log('初始化認證檢查：使用 HttpOnly Cookie 模式');
  
  // 模擬認證檢查
  const mockToken = 'cookie-auth-mode'; // 標記值，表示使用 Cookie 認證
  setAccessToken(mockToken);
  
  console.log('認證狀態：依賴 HttpOnly Cookie 自動驗證');
  console.info('如果出現認證錯誤，瀏覽器會自動重定向到登入頁面');
  
  setLoading(false);
};

/**
 * 🔑 安全改進：處理認證錯誤（不再檢查 localStorage）
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
  
  // 🔑 安全改進：不再檢查 localStorage 或嘗試讀取 Cookie
  // HttpOnly Cookie 無法被 JavaScript 讀取，這是安全設計
  setError('認證失敗，您的登入可能已過期。請重新登入系統。');
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
 * 🔑 安全改進：創建配置了 HttpOnly Cookie 的 API 請求實例
 */
const createApiInstance = () => {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 15000,
    withCredentials: true, // 🔑 關鍵：自動包含 HttpOnly Cookie
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * 🔑 安全改進：統一的 API 請求工具函數 - 使用 HttpOnly Cookie 認證
 * @param endpoint API 端點
 * @param method HTTP 方法
 * @param data 請求數據
 * @returns Promise<any>
 */
export const createApiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any
): Promise<any> => {
  try {
    const apiInstance = createApiInstance();
    
    const config: any = {
      method,
      url: endpoint,
    };

    if (data && method !== 'GET') {
      config.data = data;
    }

    const response = await apiInstance.request(config);
    return response.data;
  } catch (error: any) {
    console.error(`API 請求錯誤 [${method} ${endpoint}]:`, error);
    
    if (error.response) {
      // 服務器響應了錯誤狀態碼
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('認證失敗，請重新登入');
      }
      throw new Error(`API 請求失敗: ${error.response.status} - ${error.response.data?.message || '未知錯誤'}`);
    } else if (error.request) {
      // 請求已發送但沒有收到響應
      throw new Error('網絡連接問題，請檢查您的網絡連接');
    } else {
      // 其他錯誤
      throw new Error(error.message || 'API 請求時發生未知錯誤');
    }
  }
};

/**
 * 🔑 安全改進：GET 請求的簡化函數
 * @param endpoint API 端點
 * @returns Promise<any>
 */
export const apiGet = (endpoint: string): Promise<any> => {
  return createApiRequest(endpoint, 'GET');
};

/**
 * 🔑 安全改進：POST 請求的簡化函數
 * @param endpoint API 端點
 * @param data 請求數據
 * @returns Promise<any>
 */
export const apiPost = (endpoint: string, data?: any): Promise<any> => {
  return createApiRequest(endpoint, 'POST', data);
};

/**
 * 🔑 安全改進：PUT 請求的簡化函數
 * @param endpoint API 端點
 * @param data 請求數據
 * @returns Promise<any>
 */
export const apiPut = (endpoint: string, data?: any): Promise<any> => {
  return createApiRequest(endpoint, 'PUT', data);
};

/**
 * 🔑 安全改進：PATCH 請求的簡化函數
 * @param endpoint API 端點
 * @param data 請求數據
 * @returns Promise<any>
 */
export const apiPatch = (endpoint: string, data?: any): Promise<any> => {
  return createApiRequest(endpoint, 'PATCH', data);
};

/**
 * 🔑 安全改進：DELETE 請求的簡化函數
 * @param endpoint API 端點
 * @returns Promise<any>
 */
export const apiDelete = (endpoint: string): Promise<any> => {
  return createApiRequest(endpoint, 'DELETE');
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
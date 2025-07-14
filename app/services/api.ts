import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import authDebugger from '../utils/authDebugger';

// 設置環境變數
const isDev = process.env.NODE_ENV === 'development';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 檢查API基礎URL是否已設置 - 僅在開發環境顯示警告
if (isDev && !API_BASE_URL) {
  console.warn('警告: NEXT_PUBLIC_API_URL 環境變數未設置，API請求可能會失敗');
}

// 🔑 跨域檢查函數
const isCrossDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const currentOrigin = window.location.origin;
  const apiOrigin = API_BASE_URL;
  
  // 如果 API_BASE_URL 是相對路徑，則不是跨域
  if (!apiOrigin.startsWith('http')) return false;
  
  return currentOrigin !== apiOrigin;
};

// 🔑 安全改進：移除 Token 接口，不再在前端管理 tokens
// interface AuthTokens {
//   accessToken: string;
//   refreshToken: string;
// }

interface RefreshResponse {
  success: boolean;
  data?: {
    user: any;
  };
  message?: string;
}

// 🔑 跨域 Cookie 支持：創建 Axios 實例，強化跨域配置
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 🔑 關鍵：自動包含 HttpOnly Cookie，支持跨域
  headers: {
    'Content-Type': 'application/json',
    // 🔑 跨域支持：添加必要的 headers
    'Accept': 'application/json',
  },
});

// 在開發環境中輸出跨域配置信息
if (isDev) {
  const crossDomain = isCrossDomain();
  console.log('API 跨域配置檢查:', {
    API_BASE_URL: API_BASE_URL || '(相對路徑)',
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
    isCrossDomain: crossDomain,
    withCredentials: true,
    note: crossDomain ? '跨域模式：Cookie 需要 SameSite=none, Secure=true' : '同域模式：Cookie 可使用 SameSite=lax'
  });
  
  // 檢查API_URL是否使用localhost，提供警告和建議
  if (API_BASE_URL.includes('localhost')) {
    console.log('注意: API設置為使用localhost，這在某些網絡環境下可能不穩定');
    console.log('如出現ERR_CONNECTION_REFUSED錯誤，系統將自動嘗試使用127.0.0.1');
    console.log('建議: 考慮直接在.env文件中使用127.0.0.1替代localhost');
  }
}

// 🔑 安全改進：移除所有 localStorage token 管理函數
// 現在完全依賴 HttpOnly Cookie，無需前端管理 tokens

// 清除功能保留，但僅用於清理殘留數據
const clearLegacyTokens = (): void => {
  // 清除可能殘留的 localStorage tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  authDebugger.log('auth_check', '已清除legacy localStorage tokens', 'apiService');
};

// 🔑 安全改進：移除前端 token 刷新邏輯
// 現在 token 刷新完全由後端和瀏覽器自動處理（HttpOnly Cookie）

// 🔑 修復循環調用問題：創建獨立的 refresh API 實例，不使用攔截器
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 🔑 關鍵：refresh 請求也需要包含 Cookie
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 🔑 添加 refresh token 重試限制
let refreshTokenRetryCount = 0;
const MAX_REFRESH_RETRIES = 2;
const REFRESH_RETRY_COOLDOWN = 60000; // 1分鐘冷卻期

// 重置重試計數器
const resetRefreshRetryCount = () => {
  refreshTokenRetryCount = 0;
};

// 保留刷新端點調用，但使用獨立的API實例避免攔截器循環
const refreshAuthToken = async (): Promise<boolean> => {
  // 🔑 檢查重試次數限制
  if (refreshTokenRetryCount >= MAX_REFRESH_RETRIES) {
    authDebugger.log('token_refresh', `已達到最大重試次數 (${MAX_REFRESH_RETRIES})，跳過刷新`, 'apiService');
    return false;
  }
  
  refreshTokenRetryCount++;
  
  try {
    authDebugger.log('token_refresh', `嘗試刷新accessToken（Cookie模式）- 重試次數: ${refreshTokenRetryCount}`, 'apiService');
    
    // 🔑 使用獨立的 refresh API 實例，避免觸發攔截器
    const response = await refreshApi.post<RefreshResponse>('/api/auth/refresh-token');
    
    if (response.data.success) {
      authDebugger.log('token_refresh', '刷新accessToken成功', 'apiService');
      // 成功後重置重試計數
      resetRefreshRetryCount();
      return true;
    }
    
    authDebugger.log('token_refresh', '刷新accessToken失敗：服務器響應無效', 'apiService');
    return false;
  } catch (error) {
    authDebugger.log('token_refresh', `刷新accessToken失敗：${error}`, 'apiService');
    if (isDev) console.error('刷新令牌失敗:', error);
    clearLegacyTokens(); // 清理殘留的 localStorage
    return false;
  }
};

// 定期重置重試計數器
setInterval(() => {
  if (refreshTokenRetryCount > 0) {
    authDebugger.log('token_refresh', '定期重置refresh token重試計數器', 'apiService');
    resetRefreshRetryCount();
  }
}, REFRESH_RETRY_COOLDOWN);

// 🔑 安全改進：移除手動添加 Authorization 頭
// HttpOnly Cookie 會自動包含在請求中，無需手動處理
api.interceptors.request.use((config) => {
  // 🔑 跨域支持：記錄請求信息，便於調試
  if (config.url) {
    const crossDomain = isCrossDomain();
    authDebugger.log('api_request', `${config.method?.toUpperCase()} ${config.url} [跨域: ${crossDomain}]`, 'axios.request');
    
    // 在開發環境中輸出跨域請求詳情
    if (isDev && crossDomain) {
      console.log('跨域請求詳情:', {
        url: config.url,
        method: config.method,
        withCredentials: config.withCredentials,
        headers: config.headers,
        note: 'Cookie 應該自動包含在跨域請求中'
      });
    }
  }
  return config;
});

// 管理是否顯示通知的狀態，防止多次通知
let isRedirectingToLogin = false;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 10000; // 增加到10秒內不重複重定向

// 檢查當前頁面是否是登入頁面
const isLoginPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/login';
};

// 記錄重定向歷史，用於偵測循環
const redirectHistory: string[] = [];
const MAX_HISTORY_SIZE = 5; // 減少歷史記錄大小
let redirectCount = 0;
const MAX_REDIRECTS = 3; // 最大重定向次數

// 檢測是否存在循環重定向 - 增強檢測邏輯
const isRedirectLoop = (destination: string): boolean => {
  // 增加重定向計數
  redirectCount++;
  
  // 如果短時間內重定向次數過多，判定為循環
  if (redirectCount >= MAX_REDIRECTS) {
    authDebugger.log('redirect', `檢測到重定向循環：短時間內重定向 ${redirectCount} 次`, 'apiService');
    console.warn(`檢測到重定向循環：短時間內重定向 ${redirectCount} 次`);
    return true;
  }
  
  // 添加到歷史
  redirectHistory.push(destination);
  
  // 保持歷史記錄在固定大小
  if (redirectHistory.length > MAX_HISTORY_SIZE) {
    redirectHistory.shift();
  }
  
  // 計算登入頁面在歷史中出現的次數
  const loginPageCount = redirectHistory.filter(url => url.includes('/login')).length;
  
  // 如果登入頁面出現次數過多，判定為循環重定向
  if (loginPageCount >= 3) {
    authDebugger.log('redirect', `檢測到登入頁面循環：登入頁面在歷史中出現 ${loginPageCount} 次`, 'apiService');
    console.warn(`檢測到登入頁面循環：登入頁面在歷史中出現 ${loginPageCount} 次`);
    return true;
  }
  
  return false;
};

// 重置重定向計數器 - 定期重置
setInterval(() => {
  if (redirectCount > 0) {
    redirectCount = Math.max(0, redirectCount - 1);
  }
}, 5000);

// 🔑 跨域支持：增強的回應攔截器 - 處理token過期和跨域錯誤
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // 🔑 防止對 refresh-token 端點的循環調用
    if (originalRequest.url?.includes('/api/auth/refresh-token')) {
      authDebugger.log('auth_check', '跳過對refresh-token端點的攔截器處理', 'axios.interceptor');
      return Promise.reject(error);
    }
    
    // 🔑 跨域支持：特殊處理跨域相關錯誤
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const crossDomain = isCrossDomain();
      authDebugger.log('auth_check', `收到401錯誤，原始請求: ${originalRequest.url} [跨域: ${crossDomain}]`, 'axios.interceptor');
      
      // 在開發環境中輸出跨域調試信息
      if (isDev && crossDomain) {
        console.log('跨域401錯誤調試:', {
          url: originalRequest.url,
          cookies: document.cookie,
          note: '檢查後端是否正確設置了 SameSite=none 和 Secure=true'
        });
      }
      
      try {
        // 嘗試刷新token
        const refreshSuccess = await refreshAuthToken();
        
        if (refreshSuccess) {
          // 🔑 安全改進：重試原始請求，Cookie 會自動包含新的 token
          authDebugger.log('auth_check', `Token刷新成功，重試請求: ${originalRequest.url}`, 'axios.interceptor');
          return axios(originalRequest);
        }
      } catch (refreshError) {
        authDebugger.log('auth_check', `Token刷新錯誤: ${refreshError}`, 'axios.interceptor');
        if (isDev) console.error('刷新令牌時出錯:', refreshError);
      }
      
      // 檢查當前是否在登入頁面，避免在登入頁面時重新整理
      if (typeof window !== 'undefined') {
        const isOnLoginPage = isLoginPage();
        
        // 如果是登入頁面，不進行頁面重新整理，而是簡單返回錯誤，讓登入組件處理
        if (isOnLoginPage) {
          authDebugger.log('redirect', '在登入頁面，不重新導向', 'axios.interceptor');
          if (isDev) console.log('API攔截器：在登入頁面，不重新導向');
          return Promise.reject(error);
        }
        
        // 檢查是否應該重定向 (防止短時間內多次重定向)
        const now = Date.now();
        if (isRedirectingToLogin || (now - lastRedirectTime < REDIRECT_COOLDOWN)) {
          authDebugger.log('redirect', '已在重定向過程中或冷卻期間，跳過重定向', 'axios.interceptor');
          if (isDev) console.log('API攔截器：已在重定向過程中或冷卻期間，跳過重定向');
          return Promise.reject(error);
        }
        
        // 檢測重定向循環
        const currentPath = window.location.pathname;
        const loginPath = '/login';
        
        if (isRedirectLoop(loginPath)) {
          authDebugger.log('redirect', '偵測到重定向循環，停止重定向', 'axios.interceptor');
          console.error('API攔截器：偵測到重定向循環，停止重定向');
          // 清除循環標記
          redirectHistory.length = 0;
          redirectCount = 0;
          isRedirectingToLogin = false;
          
          // 不再重定向，只清除殘留的 localStorage token
          clearLegacyTokens();
          return Promise.reject(error);
        }
        
        // 設置重定向狀態
        isRedirectingToLogin = true;
        lastRedirectTime = now;
        
        // 清除殘留的 localStorage token
        clearLegacyTokens();
        
        authDebugger.log('redirect', `準備重定向到登入頁面，當前路徑: ${currentPath}`, 'axios.interceptor');
        if (isDev) console.log('API攔截器：非登入頁面，準備導向到登入頁面');
        
        // 使用客戶端導航，帶上過期參數和當前路徑
        const redirectUrl = `${loginPath}?reason=expired&redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = redirectUrl;
        
        // 重新設置狀態重置時間
        setTimeout(() => {
          isRedirectingToLogin = false;
        }, REDIRECT_COOLDOWN);
      }
    }
    
    return Promise.reject(error);
  }
);

// 🔑 安全改進：創建備用API實例，使用Cookie認證
const createAlternativeApiInstance = () => {
  if (isDev) console.log('連接到localhost失敗，嘗試使用127.0.0.1...');
  
  // 建立一個臨時API實例，用127.0.0.1替代localhost
  const alternativeApi = axios.create({
    baseURL: API_BASE_URL.replace('localhost', '127.0.0.1'),
    timeout: 10000,
    withCredentials: true, // 🔑 Cookie會自動包含
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  
  if (isDev) console.log('嘗試備用URL:', API_BASE_URL.replace('localhost', '127.0.0.1'));
  
  return alternativeApi;
};

// 添加一個包裝API請求的輔助函數，處理連接錯誤
const handleApiRequest = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> => {
  try {
    return await requestFn();
  } catch (error: any) {
    // 檢查是否為連接被拒絕錯誤
    if (error.message && error.message.includes('ERR_CONNECTION_REFUSED') && API_BASE_URL.includes('localhost')) {
      // 使用錯誤回退機制 - 切換到127.0.0.1
      const alternativeApi = createAlternativeApiInstance();
      
      // 創建一個新的請求函數，使用備用API實例
      const alternativeRequestFn = () => {
        // 獲取原始請求的URL和方法
        const originalConfig = (error.config as AxiosRequestConfig);
        
        // 使用備用API實例發送請求
        if (originalConfig.method && originalConfig.url) {
          const method = originalConfig.method.toLowerCase();
          const url = originalConfig.url;
          const data = originalConfig.data;
          const params = originalConfig.params;
          
          switch (method) {
            case 'get':
              return alternativeApi.get(url, { params });
            case 'post':
              return alternativeApi.post(url, data, { params });
            case 'put':
              return alternativeApi.put(url, data, { params });
            case 'delete':
              return alternativeApi.delete(url, { params });
            default:
              throw new Error(`不支持的HTTP方法: ${method}`);
          }
        }
        
        throw new Error('無法重新創建原始請求');
      };
      
      return alternativeRequestFn();
    }
    
    // 如果不是連接錯誤，直接拋出原始錯誤
    throw error;
  }
};

// 定義用戶數據接口，取代any類型
interface UserData {
  id?: number;
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  [key: string]: any; // 允許其他未指定的屬性
}

// 🔑 跨域支持：API調用方法 - 使用通用的錯誤處理函數
export const apiService = {
  login: async (email: string, password: string) => {
    authDebugger.log('login', `發送登入請求: ${email}`, 'apiService.login');
    if (isDev) {
      console.log(`發送登入請求: ${email}`);
      console.log('跨域登入配置:', {
        withCredentials: true,
        crossDomain: isCrossDomain(),
        note: '登入成功後，HttpOnly Cookie 將自動設置'
      });
    }
    
    try {
      const response = await handleApiRequest(() => 
        api.post('/api/auth/login', { email, password }, {
          withCredentials: true, // 🔑 關鍵：包含cookies，等同於 credentials: 'include'
          timeout: 15000 // 15秒超時，比默認的10秒稍長
        })
      );
      
      const result = response.data;

      if (result.success && result.data) {
        // 🔑 安全改進：登入成功，tokens 由後端設置為 HttpOnly Cookie
        // 清除任何殘留的 localStorage tokens
        clearLegacyTokens();
        
        // 登入成功後重置重定向計數
        redirectCount = 0;
        redirectHistory.length = 0;
        authDebugger.log('login', '登入成功，已重置重定向計數', 'apiService.login');
        
        // 🔑 跨域支持：在開發環境中輸出 Cookie 狀態
        if (isDev) {
          console.log('登入成功，Cookie 狀態:', {
            documentCookie: document.cookie,
            note: 'HttpOnly Cookie 不會出現在 document.cookie 中（這是正常的）'
          });
        }
      }

      return result;
    } catch (error: any) {
      authDebugger.log('login', `登入發生錯誤: ${error}`, 'apiService.login');
      if (isDev) console.error('登入時發生錯誤:', error);
      
      // 更詳細的錯誤處理
      if (error.response) {
        // 服務器響應了錯誤狀態碼
        const errorData = error.response.data || {};
        throw new Error(errorData.message || `登入失敗: ${error.response.status}`);
      } else if (error.request) {
        // 請求已發送但沒有收到響應
        throw new Error('網絡連接問題，請檢查您的網絡連接');
      } else {
        // 其他錯誤
        throw new Error(error.message || '登入時發生未知錯誤');
      }
    }
  },

  logout: async () => {
    authDebugger.log('logout', '發送登出請求', 'apiService.logout');
    
    try {
      const response = await handleApiRequest(() => 
        api.post('/api/auth/logout', {}, {
          withCredentials: true, // 🔑 關鍵：包含cookies
          timeout: 10000 // 10秒超時
        })
      );
      
      const result = response.data;

      // 🔑 安全改進：清除殘留的 localStorage，Cookie 由後端清除
      clearLegacyTokens();
      
      // 登出時重置重定向狀態
      redirectCount = 0;
      redirectHistory.length = 0;
      isRedirectingToLogin = false;
      authDebugger.log('logout', '登出成功，已重置所有狀態', 'apiService.logout');
      
      return result;
    } catch (error: any) {
      if (isDev) console.error('登出時發生錯誤:', error);
      clearLegacyTokens();
      
      // 即使登出失敗也重置重定向狀態
      redirectCount = 0;
      redirectHistory.length = 0;
      isRedirectingToLogin = false;
      authDebugger.log('logout', `登出發生錯誤但已重置狀態: ${error}`, 'apiService.logout');
      
      // 對於登出，即使失敗也不拋出錯誤，因為本地狀態已清除
      return { success: false, message: error.message || '登出時發生錯誤' };
    }
  },
  
  getCurrentUser: async () => {
    authDebugger.log('api_request', 'getCurrentUser -> /api/auth/me', 'apiService.getCurrentUser');
    return handleApiRequest(() => 
      api.get('/api/auth/me', { withCredentials: true })
    );
  },
  
  // 用戶管理API - 🔑 所有請求自動包含 Cookie（全局設置）
  getUsers: async () => {
    return handleApiRequest(() => 
      api.get('/api/users')
    );
  },
  
  getUserById: async (id: number) => {
    return handleApiRequest(() => 
      api.get(`/api/users/${id}`)
    );
  },
  
  createUser: async (userData: UserData) => {
    return handleApiRequest(() => 
      api.post('/api/users', userData)
    );
  },
  
  updateUser: async (id: number, userData: UserData) => {
    return handleApiRequest(() => 
      api.put(`/api/users/${id}`, userData)
    );
  },
  
  deleteUser: async (id: number) => {
    return handleApiRequest(() => 
      api.delete(`/api/users/${id}`)
    );
  },
};

export default api; 
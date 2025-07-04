import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import authDebugger from '../utils/authDebugger';

// 設置環境變數
const isDev = process.env.NODE_ENV === 'development';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 檢查API基礎URL是否已設置 - 僅在開發環境顯示警告
if (isDev && !API_BASE_URL) {
  console.warn('警告: NEXT_PUBLIC_API_URL 環境變數未設置，API請求可能會失敗');
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: any;
  };
  message?: string;
}

// 創建Axios實例 - 確保baseURL設置正確
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 移除生產環境中的調試日誌
if (isDev) {
  console.log('API基礎URL設置為:', API_BASE_URL || '(空)');
  console.log('當API路徑以斜線開頭時，會基於當前主機名處理');
  
  // 檢查API_URL是否使用localhost，提供警告和建議
  if (API_BASE_URL.includes('localhost')) {
    console.log('注意: API設置為使用localhost，這在某些網絡環境下可能不穩定');
    console.log('如出現ERR_CONNECTION_REFUSED錯誤，系統將自動嘗試使用127.0.0.1');
    console.log('建議: 考慮直接在.env文件中使用127.0.0.1替代localhost');
  }
}

// 從localStorage中獲取token
const getTokens = (): AuthTokens | null => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) return null;
  
  return { accessToken, refreshToken };
};

// 存儲token到localStorage
const storeTokens = (tokens: AuthTokens): void => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

// 清除token
const clearTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  authDebugger.log('auth_check', '已清除localStorage中的tokens', 'apiService');
};

// 刷新token - 確保路徑格式正確
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const tokens = getTokens();
    if (!tokens) {
      authDebugger.log('token_refresh', '無可用的refreshToken', 'apiService');
      return false;
    }
    
    authDebugger.log('token_refresh', '嘗試刷新accessToken', 'apiService');
    
    // 使用現有的api實例而不是原始axios
    const response = await api.post<RefreshResponse>('/api/auth/refresh-token', {
      refreshToken: tokens.refreshToken,
    });
    
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      storeTokens({ accessToken, refreshToken });
      authDebugger.log('token_refresh', '刷新accessToken成功', 'apiService');
      return true;
    }
    
    authDebugger.log('token_refresh', '刷新accessToken失敗：服務器響應無效', 'apiService');
    return false;
  } catch (error) {
    authDebugger.log('token_refresh', `刷新accessToken失敗：${error}`, 'apiService');
    if (isDev) console.error('刷新令牌失敗:', error);
    clearTokens();
    return false;
  }
};

// 請求攔截器 - 添加授權頭
api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    // 記錄API請求
    if (config.url) {
      authDebugger.log('api_request', `${config.method?.toUpperCase()} ${config.url}`, 'axios.request');
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

// 回應攔截器 - 處理token過期
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // 如果是401錯誤且未嘗試過重新整理token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      authDebugger.log('auth_check', `收到401錯誤，原始請求: ${originalRequest.url}`, 'axios.interceptor');
      
      try {
        // 嘗試刷新token
        const refreshSuccess = await refreshAuthToken();
        
        if (refreshSuccess) {
          // 重試原始請求
          const tokens = getTokens();
          if (tokens && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
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
          
          // 不再重定向，只清除token
          clearTokens();
          return Promise.reject(error);
        }
        
        // 設置重定向狀態
        isRedirectingToLogin = true;
        lastRedirectTime = now;
        
        // 清除令牌
        clearTokens();
        
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

// 創建一個備用API實例處理函數 - 用於處理連接到localhost失敗的情況
const createAlternativeApiInstance = () => {
  if (isDev) console.log('連接到localhost失敗，嘗試使用127.0.0.1...');
  
  // 建立一個臨時API實例，用127.0.0.1替代localhost
  const alternativeApi = axios.create({
    baseURL: API_BASE_URL.replace('localhost', '127.0.0.1'),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // 添加授權頭
  const tokens = getTokens();
  if (tokens) {
    alternativeApi.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;
  }
  
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

// API調用方法 - 使用通用的錯誤處理函數
export const apiService = {
  login: async (email: string, password: string) => {
    authDebugger.log('login', `發送登入請求: ${email}`, 'apiService.login');
    if (isDev) {
      console.log(`發送登入請求: ${email}`);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // 包含cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `登入失敗: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.tokens) {
        const { accessToken, refreshToken } = result.data.tokens;
        storeTokens({ accessToken, refreshToken });
        
        // 登入成功後重置重定向計數
        redirectCount = 0;
        redirectHistory.length = 0;
        authDebugger.log('login', '登入成功，已重置重定向計數', 'apiService.login');
      }

      return result;
    } catch (error) {
      authDebugger.log('login', `登入發生錯誤: ${error}`, 'apiService.login');
      if (isDev) console.error('登入時發生錯誤:', error);
      throw error;
    }
  },

  logout: async () => {
    authDebugger.log('logout', '發送登出請求', 'apiService.logout');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 包含cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `登出失敗: ${response.status}`);
      }

      const result = await response.json().catch(() => ({ success: true }));

      clearTokens();
      
      // 登出時重置重定向狀態
      redirectCount = 0;
      redirectHistory.length = 0;
      isRedirectingToLogin = false;
      authDebugger.log('logout', '登出成功，已重置所有狀態', 'apiService.logout');
      
      return result;
    } catch (error) {
      if (isDev) console.error('登出時發生錯誤:', error);
      clearTokens();
      
      // 即使登出失敗也重置重定向狀態
      redirectCount = 0;
      redirectHistory.length = 0;
      isRedirectingToLogin = false;
      authDebugger.log('logout', `登出發生錯誤但已重置狀態: ${error}`, 'apiService.logout');
      
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    authDebugger.log('api_request', 'getCurrentUser -> /api/auth/me', 'apiService.getCurrentUser');
    return handleApiRequest(() => 
      api.get('/api/auth/me')
    );
  },
  
  // 用戶管理API
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
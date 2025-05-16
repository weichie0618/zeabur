import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 設置環境變數
const isDev = process.env.NODE_ENV === 'development';

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
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 記錄環境變數和API配置信息到控制台（僅開發環境）
if (isDev) {
  console.log('API基礎URL設置為:', process.env.NEXT_PUBLIC_API_URL || '(空)');
  console.log('當API路徑以斜線開頭時，會基於當前主機名處理');
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
};

// 刷新token - 確保路徑格式正確
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const tokens = getTokens();
    if (!tokens) return false;
    
    // 確保路徑以斜線開頭
    const response = await axios.post<RefreshResponse>('/api/auth/refresh-token', {
      refreshToken: tokens.refreshToken,
    });
    
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      storeTokens({ accessToken, refreshToken });
      return true;
    }
    
    return false;
  } catch (error) {
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
  }
  return config;
});

// 管理是否顯示通知的狀態，防止多次通知
let isRedirectingToLogin = false;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 5000; // 5秒內不重複重定向

// 檢查當前頁面是否是登入頁面
const isLoginPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/login';
};

// 記錄重定向歷史，用於偵測循環
const redirectHistory: string[] = [];
const MAX_HISTORY_SIZE = 10;

// 檢測是否存在循環重定向
const isRedirectLoop = (destination: string): boolean => {
  // 添加到歷史
  redirectHistory.push(destination);
  
  // 保持歷史記錄在固定大小
  if (redirectHistory.length > MAX_HISTORY_SIZE) {
    redirectHistory.shift();
  }
  
  // 計算登入頁面在歷史中出現的次數
  const loginPageCount = redirectHistory.filter(url => url.includes('/login')).length;
  
  // 如果登入頁面出現次數過多，判定為循環重定向
  return loginPageCount >= 3;
};

// 回應攔截器 - 處理token過期
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // 如果是401錯誤且未嘗試過重新整理token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 嘗試刷新token
        const refreshSuccess = await refreshAuthToken();
        
        if (refreshSuccess) {
          // 重試原始請求
          const tokens = getTokens();
          if (tokens && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
          return axios(originalRequest);
        }
      } catch (refreshError) {
        if (isDev) console.error('刷新令牌時出錯:', refreshError);
      }
      
      // 檢查當前是否在登入頁面，避免在登入頁面時重新整理
      if (typeof window !== 'undefined') {
        const isOnLoginPage = isLoginPage();
        
        // 如果是登入頁面，不進行頁面重新整理，而是簡單返回錯誤，讓登入組件處理
        if (isOnLoginPage) {
          if (isDev) console.log('在登入頁面，不重新導向');
          return Promise.reject(error);
        }
        
        // 檢查是否應該重定向 (防止短時間內多次重定向)
        const now = Date.now();
        if (isRedirectingToLogin || (now - lastRedirectTime < REDIRECT_COOLDOWN)) {
          if (isDev) console.log('已在重定向過程中或冷卻期間，跳過重定向');
          return Promise.reject(error);
        }
        
        // 檢測重定向循環
        const currentPath = window.location.pathname;
        const loginPath = '/login?expired=true&redirect=' + encodeURIComponent(currentPath);
        
        if (isRedirectLoop(loginPath)) {
          console.error('偵測到重定向循環，不再重定向到登入頁面');
          // 清除循環標記
          redirectHistory.length = 0;
          
          // 處理循環重定向 - 重定向到未授權頁面而不是登入頁面
          window.location.href = '/unauthorized?reason=auth-error';
          return Promise.reject(error);
        }
        
        // 設置重定向狀態
        isRedirectingToLogin = true;
        lastRedirectTime = now;
        
        // 清除令牌
        clearTokens();
        
        if (isDev) console.log('非登入頁面，準備導向到登入頁面');
        
        // 使用客戶端導航 - 帶參數以防止頁面重新整理循環
        window.location.href = loginPath;
        
        // 5秒後重置狀態，以便下次可以再次重定向
        setTimeout(() => {
          isRedirectingToLogin = false;
        }, REDIRECT_COOLDOWN);
      }
    }
    
    return Promise.reject(error);
  }
);

// API調用方法 - 確保所有路徑都以斜線開頭
export const apiService = {
  login: async (email: string, password: string) => {
    // 在開發環境中記錄請求信息
    if (isDev) {
      console.log(`發送登入請求: ${email}`);
    }
    return api.post('/api/auth/login', { email, password });
  },
  
  logout: async () => {
    const result = await api.post('/api/auth/logout');
    clearTokens();
    return result;
  },
  
  getCurrentUser: async () => {
    return api.get('/api/auth/me');
  },
  
  // 用戶管理API
  getUsers: async () => {
    return api.get('/api/users');
  },
  
  getUserById: async (id: number) => {
    return api.get(`/api/users/${id}`);
  },
  
  createUser: async (userData: any) => {
    return api.post('/api/users', userData);
  },
  
  updateUser: async (id: number, userData: any) => {
    return api.put(`/api/users/${id}`, userData);
  },
  
  deleteUser: async (id: number) => {
    return api.delete(`/api/users/${id}`);
  },
};

export default api; 
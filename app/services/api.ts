import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 設置環境變數
const isDev = process.env.NODE_ENV === 'development';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 檢查API基礎URL是否已設置
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

// 記錄環境變數和API配置信息到控制台（僅開發環境）
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
};

// 刷新token - 確保路徑格式正確
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const tokens = getTokens();
    if (!tokens) return false;
    
    // 使用現有的api實例而不是原始axios
    const response = await api.post<RefreshResponse>('/api/auth/refresh-token', {
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
    if (isDev) {
      console.log(`發送登入請求: ${email}`);
    }
    return handleApiRequest(() => 
      api.post('/api/auth/login', { email, password })
    );
  },
  
  logout: async () => {
    const result = await handleApiRequest(() => 
      api.post('/api/auth/logout')
    );
    clearTokens();
    return result;
  },
  
  getCurrentUser: async () => {
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
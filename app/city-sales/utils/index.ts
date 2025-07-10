// City Sales 工具函數集合

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// 路由路徑常數
export const ROUTES = {
  LOGIN: '/city-sales/login',
  DASHBOARD: '/city-sales/dashboard',
  ORDERS: '/city-sales/orders',
  COMMISSIONS: '/city-sales/commissions',
  PROFILE: '/city-sales/profile',
  QRCODE: '/city-sales/qrcode',
  COMMISSION_NOT_ACTIVATED: '/city-sales/commission-not-activated',
  LOGIN_FAILED: '/city-sales/login-failed',
  APPLY_COMMISSION: '/apply-commission'
} as const;

// 錯誤類型
export enum NavigationErrorType {
  AUTH_FAILED = 'AUTH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LIFF_ERROR = 'LIFF_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// 導航工具類
export class NavigationUtils {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  /**
   * 安全跳轉到指定路由
   * @param path 目標路徑
   * @param options 跳轉選項
   */
  safePush(path: string, options?: { 
    replace?: boolean; 
    scroll?: boolean;
    params?: Record<string, string>;
  }) {
    try {
      let targetPath = path;
      
      // 添加查詢參數
      if (options?.params) {
        const searchParams = new URLSearchParams(options.params);
        targetPath = `${path}?${searchParams.toString()}`;
      }

      if (options?.replace) {
        this.router.replace(targetPath);
      } else {
        this.router.push(targetPath);
      }
    } catch (error) {
      console.error('導航失敗:', error);
      // 回退到直接跳轉
      window.location.href = path;
    }
  }

  /**
   * 跳轉到登入頁面
   * @param errorType 錯誤類型
   * @param retryCount 重試次數
   */
  goToLogin(errorType?: NavigationErrorType, retryCount?: number) {
    const params: Record<string, string> = {};
    
    if (errorType) {
      params.error = errorType;
    }
    
    if (retryCount !== undefined) {
      params.retryCount = retryCount.toString();
    }

    this.safePush(ROUTES.LOGIN, { params });
  }

  /**
   * 跳轉到儀表板
   */
  goToDashboard() {
    this.safePush(ROUTES.DASHBOARD);
  }

  /**
   * 跳轉到分潤計畫未開通頁面
   * @param errorType 錯誤類型
   * @param retryCount 重試次數
   */
  goToCommissionNotActivated(errorType?: NavigationErrorType, retryCount?: number) {
    const params: Record<string, string> = {};
    
    if (errorType) {
      params.error = errorType;
    }
    
    if (retryCount !== undefined) {
      params.retryCount = retryCount.toString();
    }

    this.safePush(ROUTES.COMMISSION_NOT_ACTIVATED, { params });
  }

  /**
   * 跳轉到登入失敗頁面
   * @param errorType 錯誤類型
   * @param message 錯誤訊息
   */
  goToLoginFailed(errorType?: NavigationErrorType, message?: string) {
    const params: Record<string, string> = {};
    
    if (errorType) {
      params.error = errorType;
    }
    
    if (message) {
      params.message = encodeURIComponent(message);
    }

    this.safePush(ROUTES.LOGIN_FAILED, { params });
  }

  /**
   * 根據錯誤類型進行智能導航
   * @param error 錯誤對象
   * @param retryCount 重試次數
   */
  handleError(error: any, retryCount: number = 0) {
    console.error('處理導航錯誤:', error);
    
    // 網路錯誤
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      this.goToCommissionNotActivated(NavigationErrorType.NETWORK_ERROR, retryCount);
      return;
    }
    
    // 認證失敗
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      this.goToCommissionNotActivated(NavigationErrorType.AUTH_FAILED, retryCount);
      return;
    }
    
    // 店家未找到
    if (error?.type === 'STORE_NOT_FOUND') {
      this.goToCommissionNotActivated(NavigationErrorType.STORE_NOT_FOUND, retryCount);
      return;
    }
    
    // LIFF 錯誤
    if (error?.type === 'LIFF_ERROR' || error?.message?.includes('liff')) {
      this.goToCommissionNotActivated(NavigationErrorType.LIFF_ERROR, retryCount);
      return;
    }
    
    // 預設錯誤處理
    this.goToCommissionNotActivated(NavigationErrorType.UNKNOWN, retryCount);
  }

  /**
   * 檢查當前路徑是否需要認證
   * @param pathname 當前路徑
   * @returns 是否需要認證
   */
  requiresAuth(pathname: string): boolean {
    const publicPaths = [
      ROUTES.LOGIN,
      ROUTES.LOGIN_FAILED,
      ROUTES.COMMISSION_NOT_ACTIVATED,
      ROUTES.APPLY_COMMISSION
    ];
    
    return !publicPaths.some(path => pathname.startsWith(path));
  }

  /**
   * 獲取重定向路徑（登入成功後）
   * @param pathname 當前路徑
   * @returns 重定向路徑
   */
  getRedirectPath(pathname: string): string {
    // 如果是公共頁面，重定向到儀表板
    if (!this.requiresAuth(pathname)) {
      return ROUTES.DASHBOARD;
    }
    
    // 如果是受保護頁面，保持原路徑
    return pathname;
  }
}

// 錯誤處理工具
export class ErrorUtils {
  /**
   * 格式化錯誤訊息
   * @param error 錯誤對象
   * @returns 格式化後的錯誤訊息
   */
  static formatError(error: any): string {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return '發生未知錯誤';
  }

  /**
   * 判斷錯誤是否可重試
   * @param error 錯誤對象
   * @returns 是否可重試
   */
  static isRetryableError(error: any): boolean {
    // 網路錯誤可重試
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return true;
    }
    
    // 5xx 伺服器錯誤可重試
    if (error?.response?.status >= 500) {
      return true;
    }
    
    // LIFF 錯誤可重試
    if (error?.type === 'LIFF_ERROR') {
      return true;
    }
    
    return false;
  }

  /**
   * 獲取錯誤類型
   * @param error 錯誤對象
   * @returns 錯誤類型
   */
  static getErrorType(error: any): NavigationErrorType {
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return NavigationErrorType.NETWORK_ERROR;
    }
    
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return NavigationErrorType.AUTH_FAILED;
    }
    
    if (error?.type === 'STORE_NOT_FOUND') {
      return NavigationErrorType.STORE_NOT_FOUND;
    }
    
    if (error?.type === 'LIFF_ERROR' || error?.message?.includes('liff')) {
      return NavigationErrorType.LIFF_ERROR;
    }
    
    return NavigationErrorType.UNKNOWN;
  }
}

// Storage 工具
export class StorageUtils {
  /**
   * 安全設置 localStorage
   * @param key 鍵名
   * @param value 值
   */
  static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('儲存到 localStorage 失敗:', error);
    }
  }

  /**
   * 安全獲取 localStorage
   * @param key 鍵名
   * @returns 值或 null
   */
  static getItem<T = any>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('從 localStorage 讀取失敗:', error);
      return null;
    }
  }

  /**
   * 安全移除 localStorage
   * @param key 鍵名
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('從 localStorage 移除失敗:', error);
    }
  }

  /**
   * 清除所有 city-sales 相關的 storage
   */
  static clearCitySalesData(): void {
    const keysToRemove = ['salesperson', 'salesperson_auth'];
    keysToRemove.forEach(key => this.removeItem(key));
  }
}

// 驗證工具
export class ValidationUtils {
  /**
   * 驗證店家 ID
   * @param storeId 店家 ID
   * @returns 是否有效
   */
  static isValidStoreId(storeId: string): boolean {
    return typeof storeId === 'string' && storeId.trim().length > 0;
  }

  /**
   * 驗證 LIFF 環境
   * @returns 是否在 LIFF 環境中
   */
  static isLiffEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).liff;
  }

  /**
   * 驗證是否為行動裝置
   * @returns 是否為行動裝置
   */
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}

// 導出便捷函數
export const createNavigationUtils = (router: AppRouterInstance) => new NavigationUtils(router); 
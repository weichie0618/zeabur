/**
 * 認證調試工具
 * 用於監控和記錄認證相關的請求和狀態變化，幫助排查重複請求問題
 */

interface AuthEvent {
  timestamp: number;
  type: 'api_request' | 'auth_check' | 'token_refresh' | 'redirect' | 'login' | 'logout';
  details: string;
  source: string;
}

class AuthDebugger {
  private events: AuthEvent[] = [];
  private readonly MAX_EVENTS = 50;
  private readonly isDev = process.env.NODE_ENV === 'development';

  /**
   * 記錄認證事件
   */
  log(type: AuthEvent['type'], details: string, source: string = 'unknown') {
    if (!this.isDev) return;

    const event: AuthEvent = {
      timestamp: Date.now(),
      type,
      details,
      source
    };

    this.events.push(event);

    // 保持事件數組在最大限制內
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // 即時輸出到控制台
    const timeStr = new Date(event.timestamp).toLocaleTimeString();
    console.log(`[AuthDebug ${timeStr}] ${type.toUpperCase()} from ${source}: ${details}`);

    // 檢查是否有重複請求
    this.checkForDuplicateRequests();
  }

  /**
   * 檢查重複請求
   */
  private checkForDuplicateRequests() {
    const now = Date.now();
    const recentEvents = this.events.filter(e => 
      now - e.timestamp < 3000 && // 減少到3秒內
      e.type === 'api_request' && 
      e.details.includes('/api/auth/me')
    );

    // 🔑 優化：減少警告閾值，正常情況下初始認證檢查只需要1次
    if (recentEvents.length >= 2) {
      console.warn('⚠️ 檢測到 /api/auth/me 重複請求:', recentEvents.length, '次');
      console.warn('📋 重複請求來源:', recentEvents.map(e => e.source));
      console.warn('💡 提示：這可能是由於 React StrictMode 或組件重新渲染導致');
      
      // 只在重複請求超過2次時才顯示詳細事件
      if (recentEvents.length > 2) {
        this.printRecentEvents();
      }
    }
  }

  /**
   * 打印最近的事件
   */
  printRecentEvents(count: number = 10) {
    if (!this.isDev) return;

    console.group('📊 最近的認證事件:');
    this.events
      .slice(-count)
      .forEach(event => {
        const timeStr = new Date(event.timestamp).toLocaleTimeString();
        console.log(`${timeStr} [${event.type}] ${event.source}: ${event.details}`);
      });
    console.groupEnd();
  }

  /**
   * 檢查認證狀態
   */
  checkAuthState() {
    if (!this.isDev) return;

    const hasLocalToken = !!localStorage.getItem('accessToken');
    const hasCookieToken = document.cookie.includes('accessToken=');

    this.log('auth_check', `localStorage: ${hasLocalToken}, cookie: ${hasCookieToken}`, 'authDebugger');
  }

  /**
   * 清除所有事件記錄
   */
  clear() {
    this.events = [];
    console.log('🧹 AuthDebugger: 已清除所有事件記錄');
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    if (!this.isDev) return null;

    const stats = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.events.length,
      eventTypes: stats,
      recentApiRequests: this.events.filter(e => 
        e.type === 'api_request' && 
        Date.now() - e.timestamp < 60000 // 最近1分鐘
      ).length
    };
  }
}

// 創建全局實例
const authDebugger = new AuthDebugger();

// 全局暴露調試函數
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authDebug = {
    log: authDebugger.log.bind(authDebugger),
    printRecent: authDebugger.printRecentEvents.bind(authDebugger),
    checkState: authDebugger.checkAuthState.bind(authDebugger),
    clear: authDebugger.clear.bind(authDebugger),
    stats: authDebugger.getStats.bind(authDebugger)
  };
}

export default authDebugger; 
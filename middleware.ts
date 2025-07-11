import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 定義用戶數據類型
interface UserData {
  id: number;
  email: string;
  role: string;
  name: string;
  status: string;
  // 其他用戶屬性...
}

// 設置環境變數
const isDev = process.env.NODE_ENV === 'development';

// 從客戶端存儲中提取令牌 (使用cookie)
const getTokenFromRequest = (request: NextRequest): string | null => {
  // 開發環境URL參數中取得token，該功能只適用開發模式 
  if (isDev) {
    const url = request.nextUrl.clone();
    const tokenFromUrl = url.searchParams.get('debug_token');
    if (tokenFromUrl) {
      console.log('從URL參數獲取到開發模式的測試token');
      return tokenFromUrl;
    }
  }

  // 從授權頭獲取token
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (isDev) console.log('從授權頭獲取到token');
    return token;
  }
  
  // 從cookie中獲取accessToken - 優先檢查 HttpOnly Cookie
  if (isDev) {
    // 詳細檢查所有 Cookie
    const allCookies = request.cookies.getAll();
    console.log('所有可用的 Cookie:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length })));
  }
  
  const accessToken = request.cookies.get('accessToken')?.value;
  
  if (accessToken) {
    if (isDev) console.log('從HttpOnly Cookie成功獲取到accessToken，長度:', accessToken.length);
    return accessToken;
  } else {
    if (isDev) console.log('在Cookie中找不到accessToken');
    
    // 檢查是否有其他的認證標誌（比如 refreshToken）
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      if (isDev) console.log('找到refreshToken但沒有accessToken，長度:', refreshToken.length);
      // 暫時允許通過，讓應用層處理token刷新
      return 'refresh_needed';
    }
    
    if (isDev) console.log('無法從Cookie獲取任何認證令牌');
    return null;
  }
};

// 添加一個幫助函數來偵測登入頁循環重定向
const detectLoginLoop = (request: NextRequest): boolean => {
  // 檢查請求的 Referer 是否來自登入頁面
  const referer = request.headers.get('referer');
  const url = request.nextUrl.clone();
  
  // 如果當前是登入頁面，並且 referer 也是登入頁面，可能是重定向循環
  if (url.pathname === '/login' && referer && referer.includes('/login')) {
    console.warn('偵測到可能的登入頁循環重定向，中斷重定向鏈');
    return true;
  }
  
  return false;
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isDev) console.log(`\n\n============\n檢查路徑: ${path}\n============`);
  
  // 檢測並防止循環重定向
  if (detectLoginLoop(request)) {
    return NextResponse.next();
  }
  
  // 登入頁面不需要驗證
  if (path === '/login') {
    if (isDev) console.log('登入頁面不需要驗證');
    return NextResponse.next();
  }
  
  // 忽略靜態資源和API路由
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.')
  ) {
    if (isDev) console.log('忽略靜態資源和API路由');
    return NextResponse.next();
  }
  
  // 僅對/admin路徑進行權限驗證
  if (path.startsWith('/admin')) {
    if (isDev) console.log('偵測到管理員頁面請求，進行權限驗證');
    
    // 獲取令牌 - 只檢查存在性，不驗證真偽
    const token = getTokenFromRequest(request);
    
    if (!token) {
      if (isDev) console.log('訪問管理員頁面但無token，重定向到登入頁面');
      
      // 創建一個基於原始請求URL的新URL對象，然後設置路徑為'/login'
      const url = new URL('/login', request.url);
      // 添加重定向參數，保存原始路徑
      url.searchParams.set('redirect', path);
      url.searchParams.set('reason', 'not-authenticated');
      return NextResponse.redirect(url);
    }
    
    // 如果token是 'refresh_needed'，允許通過但讓應用層處理
    if (token === 'refresh_needed') {
      if (isDev) console.log('需要刷新token，允許通過讓應用層處理');
      return NextResponse.next();
    }
    
    if (isDev) console.log('找到有效token，允許訪問管理頁面（由後端驗證真偽）');
    return NextResponse.next();
  }
  
  // 對於所有其他頁面，直接允許訪問，不需要權限驗證
  if (isDev) console.log('非管理員頁面，無需權限驗證，允許請求繼續');
  return NextResponse.next();
}

// 設定哪些路徑會觸發中間件
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
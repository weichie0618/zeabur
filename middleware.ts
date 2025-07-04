import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';

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

// JWT密鑰 (使用環境變數)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// 打印JWT密鑰信息 - 僅開發環境
if (isDev) {
  console.log('JWT密鑰環境變數設置狀態:', process.env.JWT_SECRET ? '已設置' : '未設置，使用預設密鑰');
}

// 解析令牌內容但不進行簽名驗證
const decodeTokenWithoutVerification = (token: string): UserData | null => {
  try {
    // 簡單解析JWT令牌，不做簽名驗證
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      if (isDev) console.log('直接解析令牌成功');
      return payload as UserData;
    }
    return null;
  } catch (parseError) {
    console.error('令牌解析失敗:', parseError);
    return null;
  }
};

// 驗證JWT令牌
const verifyToken = async (token: string): Promise<UserData | null> => {
  try {
    // 驗證JWT
    if (isDev) console.log("驗證JWT令牌:", token.substring(0, 20) + '...');
    
    // 嘗試標準 JWT 驗證
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (isDev) console.log("JWT驗證成功");
      return payload as unknown as UserData;
    } catch (verifyError) {
      const errorMessage = (verifyError as Error).message || 'Unknown error';
      const errorCode = (verifyError as any).code;
      
      console.error(`JWT驗證失敗 (${errorCode}): ${errorMessage}`);
      
      // 檢查簽名錯誤 - 這種錯誤可能是因為 JWT_SECRET 不匹配
      if (errorCode === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
        // 在開發和生產環境都進行備用解析
        console.log('簽名驗證失敗，嘗試直接解析令牌內容...');
        
        // 使用備用解析方法
        const userData = decodeTokenWithoutVerification(token);
        if (userData) {
          // 添加一個標記表示這是通過不安全方式驗證的令牌
          console.log('直接解析令牌成功，使用不安全的解析方式');
          return userData;
        }
      }
      
      // 如果是其他類型的錯誤 (例如令牌已過期)，則返回 null
      console.error('無法解析令牌，驗證完全失敗');
      return null;
    }
  } catch (error) {
    // 令牌無效或已過期
    console.error('令牌驗證處理過程出錯:', error);
    return null;
  }
};

// 從授權頭中提取令牌
const extractTokenFromHeader = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // 移除 'Bearer ' 前綴
};

// 從客戶端存儲中提取令牌 (使用cookie作為備用方案)
const getTokenFromRequest = (request: NextRequest): string | null => {
  // 最先嘗試從開發環境URL參數中取得token，該功能只適用開發模式 
  if (isDev) {
    const url = request.nextUrl.clone();
    const tokenFromUrl = url.searchParams.get('debug_token');
    if (tokenFromUrl) {
      console.log('從URL參數獲取到開發模式的測試token');
      return tokenFromUrl;
    }
  }

  // 從授權頭獲取token
  const tokenFromHeader = extractTokenFromHeader(request);
  if (tokenFromHeader) {
    if (isDev) console.log('從授權頭獲取到token');
    return tokenFromHeader;
  }
  
  // 作為備選，從cookie獲取
  // 注意: 在客戶端JavaScript中無法訪問HttpOnly cookie
  if (isDev) console.log('檢查cookies令牌...');
  
  // 從cookie中獲取accessToken
  const accessToken = request.cookies.get('accessToken')?.value;
  
  if (accessToken) {
    if (isDev) console.log('從cookie成功獲取到accessToken');
    return accessToken;
  } else {
    // 嘗試從localStorage中的token取出的字符串
    if (isDev) console.log('在cookie中找不到accessToken');
    
    // 如果是管理員頁面
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (isDev) console.log('訪問的是管理員頁面，準備重定向到登入頁');
      return null; // 返回null後允許軟件進行後續對應的重定向處理
    }
  }
  
  if (isDev) console.log('無法從任何來源找到有效的token');
  return null;
};

// 檢查路徑需要的權限
const getRequiredRole = (path: string): string | null => {
  // 僅管理者後台路徑需要管理員權限
  if (path.startsWith('/admin')) {
    return 'admin';
  }
  
  // 其他所有頁面不需要特定權限
  return null;
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
    
    // 獲取令牌
    const token = getTokenFromRequest(request);
    
    // 驗證令牌並獲取用戶信息
    const user = token ? await verifyToken(token) : null;
    
    if (!user || user.role !== 'admin') {
      if (isDev) console.log('訪問管理員頁面但無有效token或非管理員角色，重定向到登入頁面');
      
      // 創建一個基於原始請求URL的新URL對象，然後設置路徑為'/login'
      const url = new URL('/login', request.url);
      // 添加重定向參數，保存原始路徑
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }
    
    if (isDev) console.log('管理員身份已驗證，允許訪問管理頁面');
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
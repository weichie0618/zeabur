import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 定義用戶數據類型
interface UserData {
  role: string;
  name: string;
  id: string;
}

// 定義用戶數據庫類型
interface UsersDatabase {
  [email: string]: UserData;
}

// 模擬用戶角色數據庫
const USERS_DB: UsersDatabase = {
  'admin@example.com': {
    role: 'admin',
    name: '系統管理員',
    id: 'admin-001',
   
  },
  'sales1@example.com': {
    role: 'sales',
    name: '王小明',
    id: 'S-023'
  },
  'sales2@example.com': {
    role: 'sales',
    name: '李小華',
    id: 'S-015'
  }
};

// 模擬獲取當前用戶數據 (實際應用中應從JWT或session中獲取)
const getCurrentUser = (request: NextRequest): UserData | null => {
  // 在實際項目中，這部分邏輯會與您的身份驗證系統整合
  // 這裡簡化為從cookie中獲取用戶信息
  const userEmail = request.cookies.get('user_email')?.value;
  
  if (!userEmail || !USERS_DB[userEmail]) {
    return null;
  }
  
  return USERS_DB[userEmail];
};

// 檢查路徑需要的權限
const getRequiredRole = (path: string): string | null => {
  // 管理者後台路徑需要管理員權限
  if (path.startsWith('/admin')) {
    return 'admin';
  }
  
  // 業務後台路徑需要業務權限
  if (path.startsWith('/sales')) {
    return 'sales';
  }
  
  // 公共頁面不需要特定權限
  return null;
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 登入頁面不需要驗證
  if (path === '/login') {
    return NextResponse.next();
  }
  
  // 忽略靜態資源和API路由
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // 獲取用戶信息
  const user = getCurrentUser(request);
  const requiredRole = getRequiredRole(path);
  
  // 如果頁面需要特定權限但用戶未登入，重定向到登入頁面
  if (requiredRole && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 如果用戶沒有訪問該區域的權限，根據用戶角色重定向到適當的頁面
  if (requiredRole && user && user.role !== requiredRole) {
    // 管理員可以訪問所有區域
    if (user.role === 'admin') {
      return NextResponse.next();
    }
    
    // 業務人員嘗試訪問管理員區域，重定向到業務儀表板
    if (user.role === 'sales' && requiredRole === 'admin') {
      return NextResponse.redirect(new URL('/sales/dashboard', request.url));
    }
    
    // 其他情況重定向到首頁
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 通過所有檢查，允許請求繼續
  return NextResponse.next();
}

// 設定哪些路徑會觸發中間件
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
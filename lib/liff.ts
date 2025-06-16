import { getLiffId, getLiffObject } from '@/lib/env';

// 初始化LIFF應用
export async function initializeLiff(liffId?: string): Promise<any> {
  try {
    // 首先檢查是否有預加載的 LIFF 對象
    if ((window as any).liffObject) {
      console.log('使用預加載的 LIFF 對象 (in initializeLiff)');
      const liffObject = (window as any).liffObject;
      
      // 如果沒有提供liffId，則使用默認值
      const targetLiffId = liffId || getLiffId();
      
      if (!targetLiffId) {
        throw new Error('LIFF ID is required');
      }

      // 使用預加載的LIFF對象進行初始化
      if (!liffObject.isReady) {
        await liffObject.init({
          liffId: targetLiffId,
          withLoginOnExternalBrowser: true,
        });
      }
      
      return liffObject;
    }
    
    // 如果沒有預加載對象，進行正常初始化
    const liffObject = await getLiffObject();
    
    // 如果沒有提供liffId，則使用默認值
    let targetLiffId = liffId || getLiffId();
    
    if (!targetLiffId) {
      throw new Error('LIFF ID is required');
    }
    
    // 修正：確保LIFF ID不包含路徑部分
    // 如果LIFF ID包含斜杠，只取斜杠前的部分
    if (targetLiffId.includes('/')) {
      console.log('檢測到LIFF ID包含路徑，進行修正');
      targetLiffId = targetLiffId.split('/')[0];
      console.log('修正後的LIFF ID:', targetLiffId);
    }

    // 初始化LIFF
    console.log('開始初始化LIFF，使用ID:', targetLiffId);
    await liffObject.init({
      liffId: targetLiffId,
      withLoginOnExternalBrowser: true,
    });
    console.log('LIFF初始化成功');
    
    return liffObject;
  } catch (error) {
    console.error('Failed to initialize LIFF', error);
    throw error;
  }
}

// 獲取LIFF用戶資料
export async function getLiffUserProfile(liff: any) {
  if (!liff.isLoggedIn()) {
    // 如果用戶未登入，則進行登入
    liff.login();
    return null;
  }

  try {
    const profile = await liff.getProfile();
    return profile;
  } catch (error) {
    console.error('Failed to get user profile', error);
    return null;
  }
}

// 判斷是否在LINE環境中
export function isInLiffBrowser(liff: any): boolean {
  return liff.isInClient();
}

// 登出LIFF
export function liffLogout(liff: any): void {
  if (liff.isLoggedIn()) {
    liff.logout();
  }
}

// 分享訊息（僅在LINE App內有效）
export function shareLiffMessage(liff: any, message: any): Promise<void> {
  if (!liff.isInClient()) {
    console.error('This method is only available in LINE App');
    return Promise.reject(new Error('Not in LINE client'));
  }

  return liff.sendMessages(message);
}

// 關閉LIFF視窗（僅在LINE App內有效）
export function closeLiff(liff: any): void {
  if (liff.isInClient()) {
    liff.closeWindow();
  }
} 
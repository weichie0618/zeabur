/**
 * LINE 服務功能模組
 * 處理 LINE 相關的功能，包括消息發送、用戶資料處理等
 */

/**
 * 使用 LIFF SDK 發送 Flex 消息
 * @param liff LIFF 物件
 * @param messages 要發送的消息數組
 * @returns 發送結果 Promise
 */
export async function sendLineMessages(liff: any, messages: any[]) {
  if (!liff) {
    throw new Error("LIFF 對象未初始化");
  }

  if (!liff.isInClient()) {
    throw new Error("此功能僅在 LINE App 內可用");
  }

  try {
    // 使用 LIFF SDK 的 sendMessages 方法發送消息
    await liff.sendMessages(messages);
    return {
      success: true,
      message: "消息發送成功"
    };
  } catch (error) {
    console.error("發送 LINE 消息失敗:", error);
    return {
      success: false,
      message: "消息發送失敗",
      error
    };
  }
}

/**
 * 獲取當前 LINE 用戶資料
 * @param liff LIFF 物件
 * @returns 用戶資料
 */
export async function getLineUserProfile(liff: any) {
  if (!liff) {
    throw new Error("LIFF 對象未初始化");
  }
  
  if (!liff.isLoggedIn()) {
    throw new Error("用戶未登入");
  }
  
  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage
    };
  } catch (error) {
    console.error("獲取 LINE 用戶資料失敗:", error);
    throw error;
  }
}

/**
 * 取得服務到期日 (模擬，實際應從資料庫獲取)
 * @returns 到期日字串 (YYYY/MM/DD)
 */
export function getServiceExpiryDate() {
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setFullYear(today.getFullYear() + 1); // 一年有效期
  
  return `${expiryDate.getFullYear()}/${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getDate()).padStart(2, '0')}`;
}

export default {
  sendLineMessages,
  getLineUserProfile,
  getServiceExpiryDate
}; 
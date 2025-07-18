// 獲取LIFF ID
export function getLiffId(): string {
  // 🔧 優先使用指定的LIFF ID，如果環境變數未設定則使用預設值
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2006372025-ZoXWrME5';
  
  // 確保LIFF ID不包含路徑部分
  // 如果包含斜杠，只取斜杠前的部分
  if (liffId && liffId.includes('/')) {
    console.log('環境變數中的LIFF ID包含路徑，進行修正');
    const cleanLiffId = liffId.split('/')[0];
    console.log('修正後的LIFF ID:', cleanLiffId);
    return cleanLiffId;
  }
  
  return liffId;
}

// 動態導入LIFF SDK
export async function getLiffObject(): Promise<any> {
  try {
    // 動態導入LIFF SDK
    const liffModule = await import('@line/liff');
    const liff = liffModule.default;
    return liff;
  } catch (error) {
    console.error('Failed to load LIFF SDK', error);
    throw error;
  }
} 
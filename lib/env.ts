// 獲取LIFF ID
export function getLiffId(): string {
  // 從環境變數中獲取LIFF ID
  // 這裡可以根據需要設置不同環境的LIFF ID
  return process.env.NEXT_PUBLIC_LIFF_ID || '';
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
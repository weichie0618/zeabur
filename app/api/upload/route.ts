import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';

// 設定常數
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const OUTPUT_QUALITY = 85;
const MAX_PIXEL_COUNT = 20000 * 20000; // 降低最大像素限制以避免內存問題

// 簡單的資料夾和檔名安全檢查
const isSafePath = (folderPath: string): boolean => {
  // 不允許路徑遊走 (path traversal)
  if (folderPath.includes('..')) return false;
  
  // 只允許合法的資料夾路徑格式 (英文、數字、部分標點符號)
  const safePathRegex = /^[a-zA-Z0-9_\-\/]+$/;
  return safePathRegex.test(folderPath);
};

// 產生安全的唯一檔名
const generateSafeFileName = (originalName: string): string => {
  // 產生隨機ID並加入時間戳來確保唯一性
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  
  // 取得副檔名並確保為允許的類型
  let ext = path.extname(originalName).toLowerCase().replace('.', '');
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    // 預設為 jpg
    ext = 'jpg';
  }
  
  return `${timestamp}_${randomId}.${ext}`;
};

// 簡單檢查伺服器是否已啟動
console.log('API 路由已載入：/api/upload');

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常，防止程序崩潰:', error);
});

// 設置處理超時以避免連接重置
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '20mb',
    externalResolver: true,
  },
};

// 安全處理圖片的函數
async function safeProcessImage(
  buffer: Buffer, 
  filePath: string
): Promise<boolean> {
  // 直接保存原始文件作為備份（以防sharp處理失敗）
  const tempPath = `${filePath}.temp`;
  await writeFile(tempPath, buffer);
  
  try {
    // 獲取基本圖片資訊
    const metadata = await sharp(buffer, { 
      failOnError: false,
      limitInputPixels: MAX_PIXEL_COUNT
    }).metadata();
    
    // 設置安全的目標寬度和高度
    let targetWidth = 1200;
    let targetHeight = undefined;
    
    if (metadata.width && metadata.height) {
      // 如果原圖特別大，進行更激進的壓縮
      if (metadata.width * metadata.height > 8000000) { // 例如大於800萬像素
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio > 1) {
          targetWidth = 1000;
          targetHeight = Math.round(1000 / aspectRatio);
        } else {
          targetHeight = 1000;
          targetWidth = Math.round(1000 * aspectRatio);
        }
      }
    }
    
    // 增加記憶體使用監控
    const memBefore = process.memoryUsage();
    console.log('處理前記憶體使用:', {
      rss: Math.round(memBefore.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memBefore.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memBefore.heapUsed / 1024 / 1024) + 'MB'
    });
    
    // 使用較低資源的配置處理圖片
    await sharp(buffer, {
      failOnError: false,
      limitInputPixels: MAX_PIXEL_COUNT,
    })
      .rotate() // 自動旋轉 (基於EXIF資料)
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: OUTPUT_QUALITY,
        progressive: true,
        force: true // 強制轉換為 JPEG，不保留其他格式
      })
      .toFile(filePath);
    
    const memAfter = process.memoryUsage();
    console.log('處理後記憶體使用:', {
      rss: Math.round(memAfter.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memAfter.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memAfter.heapUsed / 1024 / 1024) + 'MB'
    });
    
    // 處理成功，刪除臨時文件
    await unlink(tempPath).catch(() => {});
    return true;
  } catch (error) {
    console.error('圖片處理失敗，使用原始檔案:', error);
    
    try {
      // 重命名臨時文件為最終文件
      await writeFile(filePath, await require('fs/promises').readFile(tempPath));
      await unlink(tempPath).catch(() => {});
      return true;
    } catch (backupError) {
      console.error('使用備份圖片也失敗:', backupError);
      return false;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: '未找到檔案' },
        { status: 400 }
      );
    }

    // 檢查檔案類型，只允許JPG
    if (file.type !== 'image/jpeg') {
      return NextResponse.json(
        { success: false, message: '僅支援JPG圖片格式' },
        { status: 400 }
      );
    }
    
    // 獲取目標目錄
    const destination = formData.get('destination') as string || 'public/bakery';
    
    // 確保目錄存在
    const uploadDir = path.join(process.cwd(), destination);
    try {
      await fs.access(uploadDir);
    } catch (error) {
      // 如果目錄不存在，創建它
      await mkdir(uploadDir, { recursive: true });
    }
    
    // 讀取檔案數據
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 獲取檔案名稱
    const fileName = file.name;
    const filePath = path.join(uploadDir, fileName);
    
    // 寫入檔案
    await fs.writeFile(filePath, buffer);
    
    return NextResponse.json({
      success: true,
      message: '檔案上傳成功',
      filePath: `/${destination.replace('public/', '')}/${fileName}`
    });
  } catch (error) {
    console.error('檔案上傳失敗:', error);
    return NextResponse.json(
      { success: false, message: '檔案上傳失敗' },
      { status: 500 }
    );
  }
} 
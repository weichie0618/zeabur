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

    // 🔧 根據目標目錄調整檔案類型檢查
    const targetDestination = formData.get('destination') as string || 'uploads/bakery';
    
    if (targetDestination.includes('contracts')) {
      // 合約圖片：允許更多格式 (JPEG, PNG)
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        return NextResponse.json(
          { success: false, message: '合約圖片僅支援JPG或PNG格式' },
          { status: 400 }
        );
      }
    } else {
      // 產品圖片：僅允許JPG
      if (file.type !== 'image/jpeg') {
        return NextResponse.json(
          { success: false, message: '產品圖片僅支援JPG格式' },
          { status: 400 }
        );
      }
    }
    
    // 獲取目標目錄 - 從 public/bakery 改為 uploads/bakery
    const destination = targetDestination;
    
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
    
    console.log(`📤 接收到檔案上傳請求:`, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      bufferSize: buffer.length,
      destination: destination
    });
    
    // 驗證檔案內容不為空
    if (buffer.length === 0) {
      throw new Error('上傳的檔案內容為空');
    }
    
    // 獲取檔案名稱
    const fileName = file.name;
    const filePath = path.join(uploadDir, fileName);
    
    console.log(`📝 準備寫入檔案: ${filePath}`);
    
    // 寫入檔案 - 使用同步方式確保完整寫入
    try {
      await fs.writeFile(filePath, buffer, { 
        mode: 0o644, // 設定檔案權限
        flag: 'w'    // 完全覆寫模式
      });
      
      console.log(`✍️ 檔案寫入完成，開始驗證...`);
      
      // 立即驗證文件是否正確寫入
      const stats = await fs.stat(filePath);
      console.log(`📊 檔案狀態檢查:`, {
        exists: true,
        size: stats.size,
        expectedSize: buffer.length,
        isFile: stats.isFile(),
        mode: stats.mode.toString(8)
      });
      
      if (stats.size === 0) {
        throw new Error('檔案寫入後大小為0');
      }
      
      if (stats.size !== buffer.length) {
        console.warn(`⚠️ 檔案大小不匹配: 期望 ${buffer.length}, 實際 ${stats.size}`);
        // 不要立即失敗，可能是檔案系統的緩衝問題
      }
      
      // 嘗試讀取檔案驗證內容完整性
      const readBuffer = await fs.readFile(filePath);
      if (readBuffer.length === 0) {
        throw new Error('檔案讀取結果為空');
      }
      
      if (readBuffer.length !== buffer.length) {
        console.warn(`⚠️ 讀取檔案大小不匹配: 原始 ${buffer.length}, 讀取 ${readBuffer.length}`);
      }
      
      // 延遲確保檔案系統同步
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`✅ 檔案上傳並驗證完成: ${fileName} (${stats.size} bytes)`);
      
    } catch (writeError) {
      console.error('❌ 檔案寫入失敗:', writeError);
      
      // 清理可能的部分寫入檔案
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error('清理失敗檔案時出錯:', cleanupError);
      }
      
      throw new Error(`檔案寫入失敗: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
    }
    
    // 🔧 修改返回的路徑，根據destination動態生成正確的API路徑
    let apiPath = '';
    if (destination.includes('contracts')) {
      // 合約圖片使用 /api/images/contracts/ 路徑
      apiPath = `/api/images/contracts/${fileName}`;
    } else {
      // 烘焙產品圖片使用 /api/images/bakery/ 路徑
      apiPath = `/api/images/bakery/${fileName}`;
    }
    
    return NextResponse.json({
      success: true,
      message: '檔案上傳成功',
      filePath: apiPath,
      url: apiPath, // 🔧 添加url字段保持向後兼容
      fileSize: buffer.length, // 🔧 添加文件大小信息用於調試
      timestamp: new Date().toISOString() // 🔧 添加時間戳用於調試
    });
  } catch (error) {
    console.error('檔案上傳失敗:', error);
    return NextResponse.json(
      { success: false, message: '檔案上傳失敗' },
      { status: 500 }
    );
  }
} 
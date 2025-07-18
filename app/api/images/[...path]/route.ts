import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// 配置緩存控制
export const dynamic = 'force-dynamic'; // 根據需要調整為'force-static'
export const revalidate = 3600; // 1小時後重新驗證

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 取得請求的圖片路徑
    const resolvedParams = await params;
    const imagePath = resolvedParams.path.join('/');
    
    console.log(`🖼️ 圖片請求: ${imagePath}`);
    
    // 構建完整的文件系統路徑（從uploads目錄）
    const filePath = path.join(process.cwd(), 'uploads', imagePath);
    
    console.log(`📂 檔案系統路徑: ${filePath}`);
    
    // 檢查文件是否存在
    if (!existsSync(filePath)) {
      console.warn(`❌ 檔案不存在: ${filePath}`);
      return new NextResponse('找不到圖片', { status: 404 });
    }
    
    // 檢查檔案狀態
    const stats = await fs.stat(filePath);
    console.log(`📊 檔案狀態:`, {
      size: stats.size,
      isFile: stats.isFile(),
      mtime: stats.mtime,
      mode: stats.mode.toString(8)
    });
    
    if (stats.size === 0) {
      console.error(`❌ 檔案大小為0: ${filePath}`);
      return new NextResponse('圖片檔案為空', { status: 404 });
    }
    
    // 讀取圖片文件
    const fileBuffer = await fs.readFile(filePath);
    
    console.log(`📖 檔案讀取完成: ${fileBuffer.length} bytes`);
    
    if (fileBuffer.length === 0) {
      console.error(`❌ 讀取的檔案內容為空: ${filePath}`);
      return new NextResponse('圖片內容為空', { status: 500 });
    }
    
    // 根據文件擴展名決定MIME類型
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }
    
    console.log(`📤 返回圖片: ${contentType}, ${fileBuffer.length} bytes`);
    
    // 設置緩存控制頭
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1年的緩存
    
    // 返回圖片
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('❌ 圖片讀取失敗:', error);
    return new NextResponse('讀取圖片時出錯', { status: 500 });
  }
} 
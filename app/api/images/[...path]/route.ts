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
    
    // 構建完整的文件系統路徑（從uploads目錄）
    const filePath = path.join(process.cwd(), 'uploads', imagePath);
    
    // 檢查文件是否存在
    if (!existsSync(filePath)) {
      return new NextResponse('找不到圖片', { status: 404 });
    }
    
    // 讀取圖片文件
    const fileBuffer = await fs.readFile(filePath);
    
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
    
    // 設置緩存控制頭
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1年的緩存
    
    // 返回圖片
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('圖片讀取失敗:', error);
    return new NextResponse('讀取圖片時出錯', { status: 500 });
  }
} 
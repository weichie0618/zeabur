import { NextResponse } from 'next/server';
// 導入內部的郵件發送模塊
// @ts-ignore - 忽略TypeScript對JavaScript模塊的類型檢查
import { handleSampleRequestEmails } from './mailer';

export async function POST(request: Request) {
  try {
    // 獲取前端提交的表單數據
    const data = await request.json();
    
    // 基本資料驗證
    if (!data.name || !data.email || !data.companyName || !data.selectedProducts || data.selectedProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: '提交的資料不完整，請確保填寫所有必要欄位'
      }, { status: 400 });
    }
    
    console.log(`正在處理樣品申請: ${data.name} (${data.email})`);
    
    // 首先記錄申請數據到資料庫或其他存儲系統（這裡省略實際實現）
    // TODO: 將資料存入資料庫
    
    // 處理電子郵件發送
    const emailResult = await handleSampleRequestEmails(data);
    
    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: '樣品申請已成功提交，確認郵件已發送',
        emailIds: {
          user: emailResult.userEmail,
          company: emailResult.companyEmail
        }
      });
    } else {
      // 如果郵件發送失敗，但申請資料有成功處理，仍返回成功狀態但帶有警告
      return NextResponse.json({
        success: true,
        warning: '申請已處理，但確認郵件發送失敗，我們將稍後重試',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('處理樣品申請錯誤:', error);
    
    return NextResponse.json({
      success: false,
      error: '處理樣品申請時發生錯誤',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
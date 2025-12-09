import { NextRequest, NextResponse } from 'next/server';

// LINE Messaging API 配置
// 如果環境變數存在，優先使用環境變數；否則使用預設值
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '2PWC3zVToyPDVHNpSGfwyc9I7Xl2B+Uv+isB0kUkZ7YuyUb/OMLgzC2wCkmuolsWLELIcMNClC1ceeIzQ5RGGvBpW4W0Ue98ygmaVqxvAGyPnWQShN1m+v06WYOeTehMBGGfErGMHvfgYvBvck9VyAdB04t89/1O/w1cDnyilFU=';
const GROUP_ID = process.env.LINE_GROUP_ID || 'C5a5878f6c7f579f0373b33d23f1b8a2c';

interface InquiryFormData {
  type?: string;
  name: string;
  phone: string;
  lineId?: string;
  email: string;
  age?: string;
  subject?: string;
  city?: string;
  budget?: string;
  contactTime?: string;
  location?: string;
  experience?: string;
  investment?: string;
  message?: string;
  company?: string;
  quantity?: string;
}

// 格式化訊息內容
function formatLineMessage(data: InquiryFormData): string {
  const timestamp = new Date().toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // 根據類型決定標題
  const inquiryType = data.type === 'franchise' 
    ? '加盟諮詢' 
    : data.subject?.includes('企業採購') 
    ? '企業採購詢價' 
    : 'OEM代工詢價';

  let message = `晴朗家烘焙官網有新的${inquiryType}表單\n\n提交時間：${timestamp}\n\n`;

  // 加盟申請格式
  if (data.type === 'franchise') {
    message += `姓名：${data.name}\n`;
    message += `聯絡電話：${data.phone}\n`;
    if (data.lineId) message += `LINE ID：${data.lineId}\n`;
    message += `電子郵件：${data.email}\n`;
    
    // 新增欄位
    if (data.subject) message += `有興趣的品牌：${data.subject}\n`;
    if (data.city) message += `預計開店城市：${data.city}\n`;
    if (data.budget) message += `創業準備金：${data.budget}\n`;
    
    // 保留舊欄位以向後兼容
    if (data.age) message += `您的年齡：${data.age}\n`;
    if (data.contactTime) message += `方便連絡時段：${data.contactTime}\n`;
    if (data.location && !data.city) message += `想創業的地點：${data.location}\n`;
    if (data.investment && !data.budget) message += `創業準備金：${data.investment}\n`;
    
    if (data.message) {
      message += `\n其他補充說明：\n${data.message}\n`;
    }
  } else {
    // OEM/企業採購格式
    message += `姓名：${data.name}\n`;
    if (data.company) message += `公司名稱：${data.company}\n`;
    message += `聯絡電話：${data.phone}\n`;
    message += `電子郵件：${data.email}\n`;
    if (data.quantity) message += `預計數量：${data.quantity}\n`;
    if (data.subject) message += `主題：${data.subject}\n`;
    if (data.message) {
      message += `\n需求說明：\n${data.message}\n`;
    }
  }

  message += '\n---\n';

  return message;
}

// 發送 LINE 訊息
async function sendLineMessage(message: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_TOKEN}`
      },
      body: JSON.stringify({
        to: GROUP_ID,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API 錯誤:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('發送 LINE 訊息失敗:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: InquiryFormData = await request.json();

    // 基本驗證
    if (!data.name || !data.phone || !data.email) {
      return NextResponse.json(
        { error: '必填欄位未填寫完整' },
        { status: 400 }
      );
    }

    // 加盟申請的額外驗證
    if (data.type === 'franchise') {
      if (!data.subject || !data.city || !data.budget || !data.contactTime) {
        return NextResponse.json(
          { error: '必填欄位未填寫完整（品牌、城市、準備金、聯絡時段）' },
          { status: 400 }
        );
      }
    }

    // 電子郵件格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: '電子郵件格式不正確' },
        { status: 400 }
      );
    }

    // 格式化訊息
    const lineMessage = formatLineMessage(data);

    // 發送到 LINE
    const success = await sendLineMessage(lineMessage);

    if (!success) {
      return NextResponse.json(
        { error: '發送訊息失敗，請稍後再試' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: '表單已成功提交' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}


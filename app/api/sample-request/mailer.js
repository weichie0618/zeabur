'use strict';

// 此文件專門放在 API 路由目錄中，僅用於服務器端
// Next.js 不會嘗試在客戶端打包 API 路由目錄中的文件

const nodemailer = require('nodemailer');
const xlsx = require('xlsx'); // 添加 xlsx 庫

// 配置郵件傳輸器
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// 發送樣品申請確認郵件給用戶
async function sendUserConfirmationEmail(data) {
  try {
    const { name, email, companyName, selectedProducts } = data;
    
    // 獲取產品詳細信息
    const products = getProductDetails(selectedProducts);
    
    // 配置郵件傳輸器
    const transporter = getTransporter();
    
    // 創建產品列表 HTML
    const productsListHtml = products.map(product => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${product.imageUrl}" alt="${product.name}" style="width: 60px; height: auto; border-radius: 4px;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${product.name.split('｜')[1] || product.name}
        </td>
      </tr>`
    ).join('');
    
    // 創建美觀的HTML郵件內容
    const mailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>樣品申請確認</title>
      <style>
        body {
          font-family: 'Microsoft JhengHei', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #f0f0f0;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 20px 0;
        }
        .info-box {
          background-color: #f5f5f5;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-box td {
          padding: 8px 0;
        }
        .info-box td:first-child {
          font-weight: bold;
          width: 100px;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
          color: #888;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white !important;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-weight: bold;
        }
        .social-icons {
          margin-top: 15px;
        }
        .social-icons a {
          display: inline-block;
          margin: 0 5px;
          color: #3b82f6;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #3b82f6; margin: 0;">樣品申請確認</h1>
        </div>
        <div class="content">
          <p>親愛的 ${name} 您好,</p>
          <p>感謝您申請晴朗家烘焙的麵包樣品，我們已收到您的申請。</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">申請資訊</h3>
            <table>
              <tr>
                <td>申請人:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td>公司名稱:</td>
                <td>${companyName}</td>
              </tr>
              <tr>
                <td>申請日期:</td>
                <td>${new Date().toLocaleDateString('zh-TW')}</td>
              </tr>
            </table>
          </div>
          
          <h3>您所申請的樣品：</h3>
          <table class="product-table">
            ${productsListHtml}
          </table>
          
          <p>我們將盡快處理您的申請，並在 3-5 個工作日內寄出樣品。</p>
         
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.qinglang.com.tw" class="button">瀏覽更多產品</a>
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} 晴朗家烘焙 版權所有</p>
          <p>本郵件是系統自動發送，請勿直接回覆</p>
          
        </div>
      </div>
    </body>
    </html>
    `;
    
    // 發送郵件
    const info = await transporter.sendMail({
      from: `"晴朗家烘焙" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '【晴朗家烘焙】樣品申請確認',
      html: mailHtml,
    });
    
    console.log(`發送給用戶的樣品申請確認郵件 ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('發送用戶確認郵件錯誤:', error);
    return { success: false, error: error.message };
  }
}

// 創建客戶資料的Excel檔案
function createCustomerExcel(data) {
  try {
    const { 
      name, 
      phone, 
      companyName, 
      companyId, 
      industry, 
      email, 
      address, 
      selectedProducts 
    } = data;
    
    // 獲取產品詳細信息
    const products = getProductDetails(selectedProducts);
    
    // 按照客戶.xls的格式創建標題行（第一列：欄位名稱）
    const headers = [
      "客户代號", "客户簡稱", "客户全名", "客户別", "課稅別", "發票類別", 
      "統一編號", "部門代號", "業務人員代號", "客户負責人", "客户電話", 
      "客户傳真", "客户EMail", "公司地址", "發票地址", "送貨地址", 
      "聯絡人姓名", "聯絡人電話", "聯絡人EMail", "折扣率", "列印紙本電子發票", 
      "電子發票通知方式", "結帳方式", "結帳終止日", "結帳後幾月/週對帳", 
      "結帳後幾日對帳", "對帳後幾月/週收款", "對帳後幾日收款", "收款後幾日兌現", 
      "收款方式", "付款銀行", "付款帳號", "付款帳號名稱", "身份證字號", 
      "備註", "信用額度"
    ];
    
    // 第二列：欄位代碼
    const headerCodes = [
      "Cust001", "Cust003", "Cust004", "Cust200", "Cust066", "Cust067",
      "Cust010", "Cust015", "Cust017", "Cust008", "Cust020", 
      "Cust022", "Cust054", "Cust043", "Cust041", "Cust044", 
      "Cust049", "Cust051", "Cust053", "Custa05irat", "Cust201", 
      "Cust202", "Cust072", "Cust073", "Cust075", 
      "Cust076", "Cust077", "Cust078", "Cust080", 
      "Cust035", "Cust069", "Cust070", "Cust071", "Cust531", 
      "Cust059", "Cust501"
    ];
    
    // 創建一個客戶記錄行
    // 填充我們擁有的資料，其他欄位留空或設置默認值
    const customerRecord = Array(headers.length).fill("");
    
    // 設置已知的欄位值（根據表單收集的數據映射到適當的位置）
    // 客戶代號 - 使用臨時代號（可以後續由系統生成正式代號）
    customerRecord[0] = `WEB-${Date.now().toString().substring(8)}`;
    // 客戶簡稱
    customerRecord[1] = companyName;
    // 客戶全名
    customerRecord[2] = companyName;
    // 客戶別
    customerRecord[3] = "2";
    // 課稅別
    customerRecord[4] = "1";
    // 發票類別
    customerRecord[5] = "7";
    // 統一編號
    customerRecord[6] = companyId || "";
    // 部門代號
    customerRecord[7] = "";
    // 業務人員代號
    customerRecord[8] = "";
    // 客戶負責人
    customerRecord[9] = "";
    // 客戶電話
    customerRecord[10] =  "";
    // 客戶傳真
    customerRecord[11] = "";
    // 客戶Email
    customerRecord[12] = email;
    // 公司地址
    customerRecord[13] = address;
    // 送貨地址
    customerRecord[15] = address;
    // 聯絡人姓名
    customerRecord[16] = name;
    // 聯絡人電話
    customerRecord[17] = phone || "";
    // 聯絡人Email
    customerRecord[18] = email;
    // 折扣率
    customerRecord[19] = "100";
    // 列印紙本電子發票
    customerRecord[20] = "1";
    // 電子發票通知方式
    customerRecord[21] = "D";   
    // 結帳方式
    customerRecord[22] = "0";
    // 結帳終止日
    customerRecord[23] = "0";
    // 結帳後幾月/週對帳
    customerRecord[24] = "0";
    // 結帳後幾日對帳
    customerRecord[25] = "1";
    // 對帳後幾月/週收款
    customerRecord[26] = "0";
    // 對帳後幾日收款
    customerRecord[27] = "1";
    // 收款後幾日兌現
    customerRecord[28] = "0";
    // 收款方式
    customerRecord[29] = "";
    // 付款銀行
    customerRecord[30] = "";
    // 付款帳號
    customerRecord[31] = "";
    // 付款帳號名稱
    customerRecord[32] = "";
    // 身份證字號
    customerRecord[33] = "";
    
    // 備註 - 添加行業別和樣品申請資訊
    customerRecord[34] = `行業別: ${industry}; 樣品申請日期: ${new Date().toLocaleDateString('zh-TW')}; 申請樣品數: ${products.length}`;
    // 信用額度
    customerRecord[35] = "0";

    // 創建工作簿和工作表
    const workbook = xlsx.utils.book_new();
    
    // 創建工作表數據，包含兩列標題
    const worksheetData = [
      headers,
      headerCodes,
      customerRecord
    ];
    
    // 生成工作表
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    
    // 設置列寬
    const colWidths = headers.map(() => ({ wch: 15 }));
    // 為某些欄位設置更寬的寬度
    colWidths[2] = { wch: 30 }; // 客戶全名
    colWidths[12] = { wch: 30 }; // 客戶Email
    colWidths[13] = { wch: 40 }; // 公司地址
    colWidths[15] = { wch: 40 }; // 送貨地址
    colWidths[34] = { wch: 60 }; // 備註
    
    worksheet['!cols'] = colWidths;
    
    // 將工作表添加到工作簿
    xlsx.utils.book_append_sheet(workbook, worksheet, '客戶資料');
    
    // 創建另一個工作表來存儲樣品申請明細
    const productSheetData = [
      ['樣品申請明細'],
      ['申請日期', new Date().toLocaleDateString('zh-TW')],
      ['申請人', name],
      ['公司名稱', companyName],
      [''],
      ['商品編號', '商品名稱', '價格']
    ];
    
    // 添加產品明細行
    products.forEach(product => {
      const productName = product.name.split('｜')[1] || product.name;
      productSheetData.push([product.id, productName, `NT$ ${product.price}`]);
    });
    
    // 創建樣品申請明細工作表
    const productSheet = xlsx.utils.aoa_to_sheet(productSheetData);
    
    // 設置樣品明細工作表的列寬
    const productColWidths = [
      { wch: 15 }, // A
      { wch: 60 }, // B
      { wch: 15 }  // C
    ];
    productSheet['!cols'] = productColWidths;
    
    // 將樣品明細工作表添加到工作簿
    xlsx.utils.book_append_sheet(workbook, productSheet, '樣品申請明細');
    
    // 將工作簿轉換為二進制數據
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return excelBuffer;
  } catch (error) {
    console.error('創建Excel檔案錯誤:', error);
    throw error;
  }
}

// 發送樣品申請通知給公司內部人員
async function sendCompanyNotificationEmail(data) {
  try {
    const { 
      name, 
      phone, 
      companyName, 
      companyId, 
      industry, 
      email, 
      address, 
      selectedProducts 
    } = data;
    
    // 獲取產品詳細信息
    const products = getProductDetails(selectedProducts);
    
    // 配置郵件傳輸器
    const transporter = getTransporter();
    
    // 創建產品列表 HTML
    const productsListHtml = products.map(product => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${product.imageUrl}" alt="${product.name}" style="width: 60px; height: auto; border-radius: 4px;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${product.name.split('｜')[1] || product.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${product.id}
        </td>
      </tr>`
    ).join('');
    
    // 創建美觀的HTML郵件內容
    const mailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>新樣品申請通知</title>
      <style>
        body {
          font-family: 'Microsoft JhengHei', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #f0f0f0;
        }
        .content {
          padding: 20px 0;
        }
        .info-box {
          background-color: #f5f5f5;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-box td {
          padding: 8px 0;
        }
        .info-box td:first-child {
          font-weight: bold;
          width: 120px;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .product-table th {
          text-align: left;
          padding: 10px;
          background-color: #f5f5f5;
          border-bottom: 2px solid #eee;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
          color: #888;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white !important;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-weight: bold;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #3b82f6; margin: 0;">新樣品申請通知</h1>
        </div>
        <div class="content">
          <p><strong>通知</strong>：系統收到新的樣品申請，詳細信息如下：</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">申請人資訊</h3>
            <table>
              <tr>
                <td>申請人:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td>聯絡電話:</td>
                <td>${phone}</td>
              </tr>
              <tr>
                <td>電子郵件:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td>收件地址:</td>
                <td>${address}</td>
              </tr>
            </table>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">公司資訊</h3>
            <table>
              <tr>
                <td>公司名稱:</td>
                <td>${companyName}</td>
              </tr>
              <tr>
                <td>統一編號:</td>
                <td>${companyId}</td>
              </tr>
              <tr>
                <td>行業別:</td>
                <td>${industry}</td>
              </tr>
            </table>
          </div>
          
          <h3>申請樣品 (共 ${products.length} 項)：</h3>
          <table class="product-table">
            <thead>
              <tr>
                <th>商品圖片</th>
                <th>商品名稱</th>
                <th>商品編號</th>
              </tr>
            </thead>
            <tbody>
              ${productsListHtml}
            </tbody>
          </table>
          
          <p>申請日期: ${new Date().toLocaleString('zh-TW')}</p>
          <p>※ 客戶資料已匯出為Excel檔案，請見附件</p>
          
         
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} 晴朗家烘焙 系統自動發送</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // 創建客戶Excel檔案
    const excelBuffer = createCustomerExcel(data);
    const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${companyName}_樣品申請_${currentDate}.xlsx`;
    
    // 發送郵件（附帶Excel檔案）
    const info = await transporter.sendMail({
      from: `"晴朗家烘焙系統" <${process.env.EMAIL_USER}>`,
      to: process.env.COMPANY_EMAIL || 'service@qinglang.com',
      subject: '【系統通知】新樣品申請',
      html: mailHtml,
      attachments: [
        {
          filename: fileName,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    });
    
    console.log(`發送給公司的樣品申請通知郵件 ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('發送公司通知郵件錯誤:', error);
    return { success: false, error: error.message };
  }
}

// 處理兩封郵件發送
async function handleSampleRequestEmails(data) {
  try {
    // 發送給用戶的確認郵件
    const userEmailResult = await sendUserConfirmationEmail(data);
    
    // 發送給公司的通知郵件
    const companyEmailResult = await sendCompanyNotificationEmail(data);
    
    if (userEmailResult.success && companyEmailResult.success) {
      return { 
        success: true, 
        userEmail: userEmailResult.messageId,
        companyEmail: companyEmailResult.messageId
      };
    } else {
      const errors = [];
      if (!userEmailResult.success) errors.push('用戶確認郵件發送失敗');
      if (!companyEmailResult.success) errors.push('公司通知郵件發送失敗');
      
      return { 
        success: false, 
        error: errors.join('; ')
      };
    }
  } catch (error) {
    console.error('郵件處理錯誤:', error);
    return { success: false, error: error.message };
  }
}

// 獲取產品詳細信息的輔助函數
function getProductDetails(selectedProductIds) {
  // 從頁面中的產品數據獲取詳細信息
  const products = [
    {
      id: "ZZXTN113006",
      name: "[晴朗家烘焙]｜香芋肉鬆小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜鹹甜芋頭與肉鬆的經典組合",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasj-m66gms6pxzme37_tn.webp",
      price: 60
    },
    {
      id: "ZZXGJ113007",
      name: "[晴朗家烘焙]｜荔枝堅果沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜荔枝蜜餞與堅果的香甜搭配",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasg-m66huu730exk9d_tn.webp",
      price: 80
    },
    {
      id: "ZZXGJ113013",
      name: "[晴朗家烘焙]｜咖啡奶酥（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜純咖啡粉與香濃奶酥交織的迷人風味",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasb-m66iafllgryw0b_tn.webp",
      price: 60
    },
    {
      id: "ZZXGJ113003",
      name: "[晴朗家烘焙]｜巧克力沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜雙重巧克力餡濃郁爆餡，香氣四溢",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasj-m66htvtbd57c91_tn.webp",
      price: 75
    },
    {
      id: "ZZXYX113009",
      name: "[晴朗家烘焙]｜雜糧乳酪（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜鹹香乳酪塊融合多種穀物麵包體",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasf-m66icg7b7x5k8c_tn.webp",
      price: 75
    },
    {
      id: "ZZXGJ113011",
      name: "[晴朗家烘焙]｜雷神巧克力（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜核桃香脆搭配濃郁黑可可，甜而不膩",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasi-m66i1rnrznr5f5_tn.webp",
      price: 75
    },
    {
      id: "ZZXTN113003",
      name: "[晴朗家烘焙]｜地瓜麻糬小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜台灣地瓜與黑糖麻糬，甘甜有嚼勁",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras9-m66g6wvxz0k82d_tn.webp",
      price: 60
    },
    {
      id: "ZZXBA113002",
      name: "[晴朗家烘焙]｜奶酥伯爵紅茶（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜伯爵茶香融合奶酥與核桃葡萄的高雅滋味",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasd-m66hzajqcu8198_tn.webp",
      price: 75
    },
    {
      id: "ZZXBA113013",
      name: "[晴朗家烘焙]｜莓果卡士達（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜蔓越莓與香濃卡士達交織的甜點級享受",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras9-m66i6x1mntpy65_tn.webp",
      price: 75
    },
    {
      id: "ZZXGJ113010",
      name: "[晴朗家烘焙]｜蔓越莓沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜酸甜果乾與紅麴色澤，果香清爽",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasi-m66hptqt2vcmeb_tn.webp",
      price: 75
    },
    {
      id: "ZZXYX113008",
      name: "[晴朗家烘焙]｜雜糧地瓜（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜雜糧與地瓜塊交織的營養美味",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras9-m66ifp95xf2uce_tn.webp",
      price: 70
    },
    {
      id: "ZZXGJ113001",
      name: "[晴朗家烘焙]｜抹茶蔓越莓沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜濃郁抹茶與蔓越莓果乾清爽平衡",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rask-m66hx5d7avpd9e_tn.webp",
      price: 75
    },
    {
      id: "ZZXGJ113008",
      name: "[晴朗家烘焙]｜葡萄軟歐沙瓦豆（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜葡萄乾與紫薯粉交織的自然果香",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasc-m66hfdsn8ja06a_tn.webp",
      price: 75
    },
    {
      id: "ZZXTN113004",
      name: "[晴朗家烘焙]｜抹茶紅豆小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜雙品牌抹茶搭配紅豆麻糬，香濃耐嚼",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rash-m66hch3agj2w03_tn.webp",
      price: 60
    },
    {
      id: "ZZXTN113001",
      name: "[晴朗家烘焙]｜巧克力奶油芝士小吐司（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜黑炭可可與奶油芝士滑順融合",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasf-m66bafk5apau88_tn.webp",
      price: 60
    },
    {
      id: "ZZXBA113007",
      name: "[晴朗家烘焙]｜玫瑰凡爾賽（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜玫瑰花瓣搭配蔓越莓與核桃，層次豐富",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rasb-m66i45iqazdi08_tn.webp",
      price: 75
    },
    {
      id: "ZZXYX113011",
      name: "[晴朗家烘焙]｜雜糧核桃（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜香氣濃郁的核桃與雜糧麵包完美融合",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7rash-m66ijnn1kcn5da_tn.webp",
      price: 70
    },
    {
      id: "ZZXYX113010",
      name: "[晴朗家烘焙]｜雜糧芋頭（熟凍麵包）｜鮮烤麵包｜冷凍宅配｜綿密芋頭搭配多穀雜糧，口感扎實",
      imageUrl: "https://down-tw.img.susercontent.com/file/tw-11134207-7ras8-m66ihf2fgzsm17_tn.webp",
      price: 70
    }
  ];
  
  return selectedProductIds.map(id => 
    products.find(product => product.id === id) || 
    { id, name: '未知商品', imageUrl: '' }
  );
}

module.exports = {
  handleSampleRequestEmails,
  sendUserConfirmationEmail,
  sendCompanyNotificationEmail
}; 
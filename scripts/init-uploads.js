const fs = require('fs');
const path = require('path');

// 定義要創建的目錄
const directoriesToCreate = [
  'uploads',
  'uploads/bakery'
];

// 創建目錄函數
function createDirectoryIfNotExists(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (!fs.existsSync(fullPath)) {
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ 成功創建目錄: ${dirPath}`);
    } catch (error) {
      console.error(`❌ 創建目錄失敗: ${dirPath}`, error);
    }
  } else {
    console.log(`ℹ️ 目錄已存在: ${dirPath}`);
  }
}

// 創建所有需要的目錄
console.log('開始初始化上傳目錄...');
directoriesToCreate.forEach(createDirectoryIfNotExists);
console.log('上傳目錄初始化完成!');

// 嘗試設置適當的權限 (僅在類Unix系統有效)
try {
  if (process.platform !== 'win32') {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    fs.chmodSync(uploadsPath, 0o755);
    console.log('✅ 設置目錄權限為 755');
  }
} catch (error) {
  console.error('❌ 設置目錄權限失敗:', error);
} 
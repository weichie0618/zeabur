   // debug-env.js
   const fs = require('fs');
   console.log('檔案存在:', fs.existsSync('.env.local'));
   
   if (fs.existsSync('.env.local')) {
     const content = fs.readFileSync('.env.local', 'utf8');
     console.log('檔案內容:', content);
     
     // 手動解析環境變數
     const lines = content.split('\n');
     for (const line of lines) {
       if (line.trim() && !line.startsWith('#')) {
         const [key, ...valueParts] = line.split('=');
         const value = valueParts.join('=');
         if (key === 'NEXT_PUBLIC_API_URL') {
           console.log('手動解析環境變數:', key, '=', value);
         }
       }
     }
   }
   
   require('dotenv').config({ path: '.env.local' });
   console.log('dotenv 讀取結果:', process.env.NEXT_PUBLIC_API_URL || '未設置');
# 價格顯示問題修復報告

## 問題描述
在訂單詳情頁面 (`zeabur_bakery5/app/admin/bakery/orders/[id]/page.tsx`) 中發現商品價格未正確顯示的問題。

## 根本原因
API 回應中的 `price` 字段為字符串格式（如 `"65.00"`），但前端代碼中的類型定義和處理邏輯假設它是數字格式，導致價格顯示為 0。

## API 回應範例
```json
{
  "orderItems": [
    {
      "id": 159,
      "product_id": 50203403,
      "product_name": "地瓜麻糬小吐司",
      "quantity": 1,
      "price": "65.00",  // 字符串格式
      "subtotal": 65     // 數字格式
    }
  ]
}
```

## 修復內容

### 1. 更新類型定義
**文件**: `zeabur_bakery5/app/admin/bakery/orders/types/index.ts`
- 將 `OrderItem.price` 從 `number` 更新為 `number | string`
- 添加了 `subtotal` 和其他 API 回應字段的支持

### 2. 修復價格處理邏輯
**文件**: `zeabur_bakery5/app/admin/bakery/orders/components/OrderItemsTable.tsx`
- 添加了字符串格式價格的正確解析邏輯
- 優先使用 API 回應的 `subtotal` 字段
- 改進了商品顯示，包含規格信息

### 3. 修復編輯表單邏輯
**文件**: `zeabur_bakery5/app/admin/bakery/orders/[id]/page.tsx`
- 修復了 `handleOpenEditItem` 函數中的價格處理
- 確保編輯表單能正確處理字符串格式的價格

### 4. 修復導出功能
**文件**: `zeabur_bakery5/app/admin/bakery/export/page.tsx`
- 更新了 `OrderItem` 類型定義
- 修復了 `createExportRow` 函數中的價格處理邏輯

## 修復後的價格處理邏輯
```typescript
// 支持字符串和數字格式的價格處理
let price = 0;
if (typeof item.price === 'string' && item.price !== '') {
  price = parseFloat(item.price);
} else if (typeof item.price === 'number') {
  price = item.price;
}

// 優先使用 API 回應的 subtotal
let subtotal = 0;
if (item.subtotal !== undefined) {
  if (typeof item.subtotal === 'string' && item.subtotal !== '') {
    subtotal = parseFloat(item.subtotal);
  } else if (typeof item.subtotal === 'number') {
    subtotal = item.subtotal;
  }
} else {
  subtotal = quantity * price;
}
```

## 測試確認
修復後應該能夠：
1. ✅ 正確顯示商品價格（包括負數價格，如點數折抵）
2. ✅ 正確計算小計金額
3. ✅ 編輯商品時價格預填正確
4. ✅ 導出功能中價格格式正確
5. ✅ 支援所有 API 回應格式（向後兼容）

## 影響範圍
- 管理後台訂單詳情頁面
- 管理後台訂單導出功能
- 訂單商品編輯功能
- 客戶端訂單列表（已有正確處理，無需修改）

## 相關文件
- `zeabur_bakery5/app/admin/bakery/orders/types/index.ts`
- `zeabur_bakery5/app/admin/bakery/orders/components/OrderItemsTable.tsx`
- `zeabur_bakery5/app/admin/bakery/orders/[id]/page.tsx`
- `zeabur_bakery5/app/admin/bakery/export/page.tsx` 
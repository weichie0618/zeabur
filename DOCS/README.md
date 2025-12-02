# 🌞 晴朗家烘焙官網 | Sunny Haus Bakery

> 使用 Next.js 15 + shadcn/ui + Tailwind CSS 打造的現代化官方網站

---

## 🚀 快速開始

### 1. 清理舊專案

```bash
cd sunnybakery2

# 移除舊依賴
rm -rf node_modules .next package-lock.json

# 清理舊組件 (如果有)
rm -rf app/components
```

### 2. 重新安裝依賴

```bash
npm install
```

### 3. 初始化 shadcn/ui

```bash
npx shadcn@latest init
```

**選擇以下選項:**
- TypeScript: **Yes**
- Style: **Default**
- Base color: **Orange**
- Global CSS: **app/globals.css**
- CSS variables: **Yes**
- Tailwind prefix: **No**
- tailwind.config.js: **tailwind.config.js**
- Components alias: **@/components**
- Utils alias: **@/lib/utils**

### 4. 安裝 UI 組件

```bash
# 基礎組件
npx shadcn@latest add button card input textarea select checkbox radio-group label separator badge

# 導航組件
npx shadcn@latest add navigation-menu sheet dropdown-menu

# 表單組件
npx shadcn@latest add form

# 其他組件
npx shadcn@latest add accordion toast
```

### 5. 安裝額外依賴

```bash
# 圖標庫
npm install react-icons

# 表單驗證
npm install react-hook-form zod @hookform/resolvers
```

### 6. 啟動開發

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000)

---

## 📁 專案結構

```
sunnybakery2/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首頁
│   ├── globals.css         # 全局樣式
│   └── sunnyhaus/          # 頁面路由
│
├── components/             # 組件
│   ├── ui/                 # shadcn/ui 組件
│   ├── layout/             # 布局組件
│   └── forms/              # 表單組件
│
├── lib/                    # 工具函數
├── data/                   # 靜態數據
├── types/                  # TypeScript 類型
├── public/                 # 靜態資源
│
├── DOCS/                   # 文件
│   ├── DEVELOPMENT_PLAN_發展計劃.md
│   ├── INDEX_文件索引.md
│   ├── PROGRESS_進展說明.md
│   └── README.md (本文件)
│
└── package.json
```

---

## 🎨 品牌色彩

| 名稱 | 色碼 | 預覽 |
|------|------|------|
| Sunny Orange | `#F36C21` | 🟠 主品牌色 |
| Sunny Gold | `#FFD700` | 🟡 輔助色 |
| Sunny Cream | `#FFF8F0` | 🟤 背景色 |
| Sunny Dark | `#333333` | ⚫ 主文字 |
| Sunny Gray | `#666666` | 🔘 次要文字 |

---

## 🛠️ 技術棧

### 核心
- **Next.js 15** - React 全棧框架
- **React 18** - UI 庫
- **TypeScript** - 類型安全

### UI
- **shadcn/ui** - 組件庫 (基於 Radix UI)
- **Tailwind CSS** - 工具優先 CSS
- **React Icons** - 圖標庫

### 表單
- **React Hook Form** - 表單管理
- **Zod** - Schema 驗證

---

## 📋 頁面列表

| 頁面 | 路由 | 狀態 |
|------|------|------|
| 首頁 | `/` | ⬜ |
| 最新消息 | `/sunnyhaus/get-news` | ⬜ |
| 新聞詳情 | `/sunnyhaus/get-news/[slug]` | ⬜ |
| 產品介紹 | `/sunnyhaus/bakery-items` | ⬜ |
| 關於我們 | `/sunnyhaus/about-us` | ⬜ |
| 門市據點 | `/sunnyhaus/about-us/storemap` | ⬜ |
| 商業合作 | `/sunnyhaus/business-cooperation` | ⬜ |
| 代工烘培 | `/sunnyhaus/business-cooperation/oembaking` | ⬜ |
| 企業採購 | `/sunnyhaus/business-cooperation/corporate-procurement` | ⬜ |
| 加盟表單 | `/sunnyhaus/get-join` | ⬜ |

---

## 📝 開發命令

```bash
# 開發
npm run dev          # 啟動開發伺服器

# 構建
npm run build        # 構建生產版本
npm run start        # 啟動生產伺服器

# 檢查
npm run lint         # ESLint 檢查

# shadcn/ui
npx shadcn@latest add [component]  # 添加組件
```

---

## 📚 相關文件

- [發展計劃](./DEVELOPMENT_PLAN_發展計劃.md) - 詳細開發計劃
- [文件索引](./INDEX_文件索引.md) - 專案結構說明
- [進度說明](./PROGRESS_進展說明.md) - 開發進度追蹤

---

## 🔗 外部資源

- [Next.js 文檔](https://nextjs.org/docs)
- [shadcn/ui 文檔](https://ui.shadcn.com)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

---

## 📄 授權

© 2025 晴朗家烘焙. All rights reserved.

---

**版本**: v3.0.0  
**最後更新**: 2025-12-01

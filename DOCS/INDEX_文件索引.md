# 📚 晴朗家烘焙官網 - 文件索引

> 專案文件導航與快速參考

---

## 📁 文件結構

```
sunnybakery2/
├── 📄 DOCS/                          # 文件目錄
│   ├── DEVELOPMENT_PLAN_發展計劃.md  # 詳細開發計劃
│   ├── INDEX_文件索引.md             # 本文件
│   ├── PROGRESS_進展說明.md          # 開發進度追蹤
│   ├── README.md                     # 專案說明
│   └── SECTIONS_網站區塊說明.md      # 網站區塊說明文檔
│
├── 📁 app/                           # Next.js App Router
│   ├── layout.tsx                    # 根布局
│   ├── page.tsx                      # 首頁
│   ├── globals.css                   # 全局樣式
│   ├── sitemap.ts                    # SEO 網站地圖
│   │
│   ├── 📁 sunnyhaus/                 # 頁面路由
│   │   ├── get-news/                 # 最新消息
│   │   │   ├── page.tsx              # 列表頁
│   │   │   └── [slug]/page.tsx       # 詳情頁
│   │   ├── bakery-items/             # 產品介紹
│   │   │   └── page.tsx
│   │   ├── about-us/                 # 關於我們
│   │   │   ├── page.tsx
│   │   │   └── storemap/page.tsx     # 門市據點
│   │   ├── business-cooperation/     # 商業合作
│   │   │   ├── page.tsx
│   │   │   ├── oembaking/page.tsx    # 代工烘培
│   │   │   └── corporate-procurement/page.tsx  # 企業採購
│   │   └── get-join/                 # 加盟表單
│   │       └── page.tsx
│   │
│   └── 📁 api/                       # API 路由
│       ├── contact/route.ts          # 聯絡表單
│       ├── inquiry/route.ts          # 詢價表單
│       └── franchise/route.ts        # 加盟表單
│
├── 📁 components/                    # 組件 (shadcn/ui)
│   ├── 📁 ui/                        # shadcn 基礎組件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── label.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── accordion.tsx
│   │   ├── toast.tsx
│   │   └── form.tsx
│   │
│   ├── 📁 layout/                    # 布局組件
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   │
│   └── 📁 forms/                     # 表單組件
│       ├── ContactForm.tsx
│       ├── InquiryForm.tsx
│       └── FranchiseForm.tsx
│
├── 📁 lib/                           # 工具函數
│   └── utils.ts                      # cn() 等工具
│
├── 📁 data/                          # 靜態數據
│   ├── news.ts                       # 新聞數據
│   ├── products.ts                   # 產品數據
│   └── stores.ts                     # 門市數據
│
├── 📁 types/                         # TypeScript 類型
│   └── index.ts
│
├── 📁 public/                        # 靜態資源
│   ├── images/
│   ├── favicon.ico
│   └── robots.txt
│
├── tailwind.config.js                # Tailwind 配置
├── next.config.js                    # Next.js 配置
├── tsconfig.json                     # TypeScript 配置
├── package.json                      # 依賴配置
└── components.json                   # shadcn/ui 配置
```

---

## 📋 URL 結構對照

| 頁面 | URL | 對應文件 |
|------|-----|----------|
| 首頁 | `/` | `app/page.tsx` |
| 最新消息列表 | `/sunnyhaus/get-news` | `app/sunnyhaus/get-news/page.tsx` |
| 新聞詳情 | `/sunnyhaus/get-news/[slug]` | `app/sunnyhaus/get-news/[slug]/page.tsx` |
| 產品介紹 | `/sunnyhaus/bakery-items` | `app/sunnyhaus/bakery-items/page.tsx` |
| 關於我們 | `/sunnyhaus/about-us` | `app/sunnyhaus/about-us/page.tsx` |
| 門市據點 | `/sunnyhaus/about-us/storemap` | `app/sunnyhaus/about-us/storemap/page.tsx` |
| 商業合作 | `/sunnyhaus/business-cooperation` | `app/sunnyhaus/business-cooperation/page.tsx` |
| 代工烘培 | `/sunnyhaus/business-cooperation/oembaking` | `app/sunnyhaus/business-cooperation/oembaking/page.tsx` |
| 企業採購 | `/sunnyhaus/business-cooperation/corporate-procurement` | `app/sunnyhaus/business-cooperation/corporate-procurement/page.tsx` |
| 加盟表單 | `/sunnyhaus/get-join` | `app/sunnyhaus/get-join/page.tsx` |

---

## 🛠️ 技術棧

### 核心框架
| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.x | React 全棧框架 |
| React | 18.x | UI 庫 |
| TypeScript | 5.x | 類型安全 |

### UI 與樣式
| 技術 | 用途 |
|------|------|
| shadcn/ui | 組件庫 |
| Tailwind CSS | 工具優先 CSS |
| React Icons | 圖標庫 |

### 表單與驗證
| 技術 | 用途 |
|------|------|
| React Hook Form | 表單管理 |
| Zod | Schema 驗證 |

---

## 📦 依賴清單

### 生產依賴
```json
{
  "next": "15.4.4",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-icons": "^5.0.0",
  "react-hook-form": "^7.50.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.5.0"
}
```

### shadcn/ui 依賴 (自動安裝)
```json
{
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-navigation-menu": "^1.1.4",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-radio-group": "^1.1.3",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-toast": "^1.1.5"
}
```

---

## 🎨 品牌色彩

| 名稱 | 色碼 | 用途 |
|------|------|------|
| Sunny Orange | `#F36C21` | 主品牌色 |
| Sunny Gold | `#FFD700` | 輔助色 / Hover |
| Sunny Cream | `#FFF8F0` | 背景色 |
| Sunny Dark | `#333333` | 主文字 |
| Sunny Gray | `#666666` | 次要文字 |
| Sunny Light | `#F5F5F5` | 淺背景 |

---

## 🔗 快速連結

### 文件
- [發展計劃](./DEVELOPMENT_PLAN_發展計劃.md) - 詳細開發階段和代碼範例
- [進度說明](./PROGRESS_進展說明.md) - 開發進度追蹤
- [專案說明](./README.md) - 快速開始指南
- [網站區塊說明](./SECTIONS_網站區塊說明.md) - 完整的網站區塊定義與說明

### 外部資源
- [Next.js 文檔](https://nextjs.org/docs)
- [shadcn/ui 文檔](https://ui.shadcn.com)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

---

## 📝 開發命令

```bash
# 開發
npm run dev          # 啟動開發伺服器 (localhost:3000)

# 構建
npm run build        # 構建生產版本
npm run start        # 啟動生產伺服器

# 檢查
npm run lint         # ESLint 檢查

# shadcn/ui
npx shadcn@latest add [component]  # 添加組件
```

---

**版本**: v3.0.0  
**最後更新**: 2025-12-01

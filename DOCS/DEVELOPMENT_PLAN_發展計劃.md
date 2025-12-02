# 🚀 晴朗家烘焙官網 - 發展計劃

> **使用成熟第三方 UI 庫的 Next.js 開發方案 (v3.0)**

---

## 📋 專案概述

### 目標
將原始 WordPress 網站 (sunny 專案) 使用 **Next.js 15 + 成熟 UI 庫** 重製，確保開發順暢、維護容易。

### 推薦技術棧

| 類別 | 推薦方案 | 說明 |
|------|----------|------|
| **框架** | Next.js 15 (App Router) | React 全棧框架 |
| **UI 庫** | **shadcn/ui** 或 **Chakra UI** | 成熟穩定的組件庫 |
| **樣式** | Tailwind CSS | 工具優先 CSS |
| **圖標** | React Icons | 多圖標集合 |
| **動畫** | CSS Transitions / Tailwind | 原生動畫 |
| **表單** | React Hook Form + Zod | 表單驗證 |
| **字體** | next/font | Google Fonts |

---

## 🎯 UI 庫選擇建議

### 方案 A: shadcn/ui (⭐ 推薦)

**優點:**
- ✅ 組件代碼直接複製到專案，完全可控
- ✅ 基於 Radix UI，可訪問性極佳
- ✅ 與 Tailwind CSS 完美整合
- ✅ 不增加 bundle size (按需複製)
- ✅ 高度可客製化
- ✅ 社群活躍，更新頻繁

**安裝:**
```bash
npx shadcn@latest init
npx shadcn@latest add button card input textarea select checkbox
```

**依賴 (自動安裝):**
```json
{
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.5.0",
  "@radix-ui/react-slot": "^1.0.2"
}
```

---

### 方案 B: Chakra UI

**優點:**
- ✅ 開箱即用，學習曲線低
- ✅ 內建主題系統
- ✅ 響應式設計簡單
- ✅ 完整的組件庫

**安裝:**
```bash
npm install @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled
```

---

### 方案 C: Ant Design

**優點:**
- ✅ 企業級 UI 設計
- ✅ 組件豐富完整
- ✅ 中文文檔完善

**安裝:**
```bash
npm install antd @ant-design/nextjs-registry
```

---

### 方案 D: MUI (Material UI)

**優點:**
- ✅ Google Material Design
- ✅ 組件最齊全
- ✅ 主題定制強大

**安裝:**
```bash
npm install @mui/material @emotion/react @emotion/styled
```

---

## 📊 方案比較

| 特性 | shadcn/ui | Chakra UI | Ant Design | MUI |
|------|-----------|-----------|------------|-----|
| Bundle Size | 最小 ⭐ | 中等 | 較大 | 較大 |
| 學習曲線 | 低 | 最低 ⭐ | 中等 | 中等 |
| 客製化 | 最高 ⭐ | 高 | 中等 | 高 |
| 可訪問性 | 極佳 ⭐ | 極佳 | 好 | 好 |
| Tailwind 整合 | 完美 ⭐ | 需配置 | 需配置 | 需配置 |
| 中文支援 | 好 | 好 | 最佳 ⭐ | 好 |
| 組件數量 | 40+ | 60+ | 70+ ⭐ | 50+ |

**推薦**: 對於此專案，建議使用 **shadcn/ui**，因為：
1. 與 Tailwind CSS 完美整合
2. 組件代碼完全可控
3. 不會有版本兼容問題
4. Bundle size 最小

---

## 📅 開發階段 (使用 shadcn/ui)

### Phase 1: 專案初始化 (0.5 天)

#### 1.1 安裝依賴
```bash
# 進入專案目錄
cd sunnybakery2

# 清理舊依賴
rm -rf node_modules .next package-lock.json

# 重新安裝基礎依賴
npm install

# 初始化 shadcn/ui
npx shadcn@latest init
```

**shadcn 初始化選項:**
```
Would you like to use TypeScript? › Yes
Which style would you like to use? › Default
Which color would you like to use as base color? › Orange
Where is your global CSS file? › app/globals.css
Would you like to use CSS variables for colors? › Yes
Are you using a custom tailwind prefix? › No
Where is your tailwind.config.js located? › tailwind.config.js
Configure the import alias for components? › @/components
Configure the import alias for utils? › @/lib/utils
```

#### 1.2 安裝所需組件
```bash
# 基礎 UI 組件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add label
npx shadcn@latest add separator
npx shadcn@latest add badge

# 導航組件
npx shadcn@latest add navigation-menu
npx shadcn@latest add sheet
npx shadcn@latest add dropdown-menu

# 表單組件
npx shadcn@latest add form

# 其他
npx shadcn@latest add accordion
npx shadcn@latest add toast
```

#### 1.3 安裝額外依賴
```bash
# 圖標 (React Icons - 包含多種圖標集)
npm install react-icons

# 表單驗證
npm install react-hook-form zod @hookform/resolvers
```

#### 1.4 最終 package.json
```json
{
  "dependencies": {
    "next": "15.4.4",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-icons": "^5.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
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
}
```

---

### Phase 2: 品牌配置 (0.5 天)

#### 2.1 Tailwind 配置 (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // 品牌色彩
        sunny: {
          orange: '#F36C21',
          gold: '#FFD700',
          cream: '#FFF8F0',
          dark: '#333333',
          gray: '#666666',
          light: '#F5F5F5',
        },
        // shadcn/ui 需要的色彩變數
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-tc)', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### 2.2 全局 CSS 變數 (app/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 30 100% 97%; /* sunny-cream */
    --foreground: 0 0% 20%; /* sunny-dark */
    
    --primary: 22 91% 53%; /* sunny-orange */
    --primary-foreground: 0 0% 100%;
    
    --secondary: 51 100% 50%; /* sunny-gold */
    --secondary-foreground: 0 0% 20%;
    
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 40%;
    
    --accent: 30 100% 97%;
    --accent-foreground: 22 91% 53%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 22 91% 53%;
    
    --radius: 0.5rem;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

---

### Phase 3: 布局組件開發 (1 天)

#### 3.1 Header 組件
使用 shadcn/ui 的 `NavigationMenu` + `Sheet` (手機菜單)

```tsx
// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const navItems = [
  { label: '首頁', href: '/' },
  { label: '最新消息', href: '/sunnyhaus/get-news' },
  { label: '產品介紹', href: '/sunnyhaus/bakery-items' },
  { 
    label: '關於我們', 
    href: '/sunnyhaus/about-us',
    children: [
      { label: '門市據點', href: '/sunnyhaus/about-us/storemap' },
    ]
  },
  { 
    label: '商業合作', 
    href: '/sunnyhaus/business-cooperation',
    children: [
      { label: '代工烘培', href: '/sunnyhaus/business-cooperation/oembaking' },
      { label: '企業採購', href: '/sunnyhaus/business-cooperation/corporate-procurement' },
    ]
  },
  { label: '加盟表單', href: '/sunnyhaus/get-join' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-sunny-orange">
          晴朗家
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                {item.children ? (
                  <>
                    <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="w-48 p-2">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={child.href}
                                className="block px-4 py-2 text-sm hover:bg-sunny-cream rounded-md"
                              >
                                {child.label}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className="px-4 py-2 text-sunny-dark hover:text-sunny-orange transition-colors"
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <HiMenu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-lg text-sunny-dark hover:text-sunny-orange"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
```

#### 3.2 Footer 組件
```tsx
// components/layout/Footer.tsx
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaLine } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-sunny-dark text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-sunny-orange mb-4">晴朗家烘焙</h3>
            <p className="text-gray-400">
              讓晴朗家烘焙成為每個早晨幸福的開始
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">快速連結</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sunnyhaus/get-news" className="text-gray-400 hover:text-white transition-colors">
                  最新消息
                </Link>
              </li>
              <li>
                <Link href="/sunnyhaus/bakery-items" className="text-gray-400 hover:text-white transition-colors">
                  產品介紹
                </Link>
              </li>
              <li>
                <Link href="/sunnyhaus/about-us" className="text-gray-400 hover:text-white transition-colors">
                  關於我們
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">聯絡我們</h4>
            <p className="text-gray-400">電話: 02-8722-8888</p>
            <p className="text-gray-400">Email: info@sunnyhausbakery.com.tw</p>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-4">社群媒體</h4>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/SunnyHausBakery/" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FaLine className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          © {new Date().getFullYear()} 晴朗家烘焙. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

---

### Phase 4: 頁面開發 (3-4 天)

#### 頁面清單
| 頁面 | 路由 | 優先級 |
|------|------|--------|
| 首頁 | `/` | P0 |
| 最新消息列表 | `/sunnyhaus/get-news` | P1 |
| 新聞詳情 | `/sunnyhaus/get-news/[slug]` | P1 |
| 產品介紹 | `/sunnyhaus/bakery-items` | P1 |
| 關於我們 | `/sunnyhaus/about-us` | P2 |
| 門市據點 | `/sunnyhaus/about-us/storemap` | P2 |
| 商業合作 | `/sunnyhaus/business-cooperation` | P2 |
| 代工烘培 | `/sunnyhaus/business-cooperation/oembaking` | P3 |
| 企業採購 | `/sunnyhaus/business-cooperation/corporate-procurement` | P3 |
| 加盟表單 | `/sunnyhaus/get-join` | P2 |

---

### Phase 5: 表單與 API (1-2 天)

#### 5.1 使用 React Hook Form + Zod
```tsx
// components/forms/ContactForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  name: z.string().min(2, '姓名至少 2 個字'),
  email: z.string().email('請輸入有效的電子郵件'),
  phone: z.string().optional(),
  message: z.string().min(10, '訊息至少 10 個字'),
});

type FormData = z.infer<typeof formSchema>;

export function ContactForm() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ title: '成功', description: '感謝您的訊息，我們會盡快回覆！' });
        reset();
      }
    } catch (error) {
      toast({ title: '錯誤', description: '提交失敗，請稍後重試', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">姓名 *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">電子郵件 *</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone">電話</Label>
        <Input id="phone" type="tel" {...register('phone')} />
      </div>

      <div>
        <Label htmlFor="message">訊息 *</Label>
        <Textarea id="message" rows={5} {...register('message')} />
        {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? '發送中...' : '發送訊息'}
      </Button>
    </form>
  );
}
```

#### 5.2 API Route
```tsx
// app/api/contact/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 這裡可以整合郵件服務或存入資料庫
    console.log('Contact form submission:', data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

---

### Phase 6: SEO 與部署 (1 天)

#### 6.1 Metadata 配置
```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '晴朗家烘焙 | Sunny Haus Bakery',
    template: '%s | 晴朗家烘焙',
  },
  description: '讓晴朗家烘焙成為每個早晨幸福的開始。提供新鮮、美味的手作麵包。',
  keywords: ['晴朗家烘焙', '麵包', '烘焙', '手作', '新竹', '桃園'],
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://sunnyhausbakery.com.tw',
    siteName: '晴朗家烘焙',
  },
};
```

#### 6.2 Sitemap
```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://sunnyhausbakery.com.tw', lastModified: new Date(), priority: 1 },
    { url: 'https://sunnyhausbakery.com.tw/sunnyhaus/get-news', lastModified: new Date(), priority: 0.8 },
    { url: 'https://sunnyhausbakery.com.tw/sunnyhaus/bakery-items', lastModified: new Date(), priority: 0.8 },
    { url: 'https://sunnyhausbakery.com.tw/sunnyhaus/about-us', lastModified: new Date(), priority: 0.7 },
    { url: 'https://sunnyhausbakery.com.tw/sunnyhaus/about-us/storemap', lastModified: new Date(), priority: 0.7 },
    { url: 'https://sunnyhausbakery.com.tw/sunnyhaus/business-cooperation', lastModified: new Date(), priority: 0.6 },
    { url: 'https://sunnyhausbakery.com.tw/sunnyhaus/get-join', lastModified: new Date(), priority: 0.5 },
  ];
}
```

---

## 📊 時間預估

| 階段 | 內容 | 時間 |
|------|------|------|
| Phase 1 | 專案初始化 + shadcn 安裝 | 0.5 天 |
| Phase 2 | 品牌配置 | 0.5 天 |
| Phase 3 | 布局組件 (Header + Footer) | 1 天 |
| Phase 4 | 頁面開發 (10 頁) | 3-4 天 |
| Phase 5 | 表單與 API | 1-2 天 |
| Phase 6 | SEO 與部署 | 1 天 |
| **總計** | | **7-9 天** |

---

## ✅ 完成標準

### 功能完成
- [ ] 所有 10 個頁面可正常訪問
- [ ] 響應式設計完整 (Mobile / Tablet / Desktop)
- [ ] 表單可正常提交
- [ ] SEO 配置完整

### 性能標準
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 90

### 品質標準
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
- [ ] 所有圖片已優化
- [ ] 代碼整潔可維護

---

## 🚀 快速開始命令

```bash
# 1. 清理專案
rm -rf node_modules .next package-lock.json

# 2. 重新安裝
npm install

# 3. 初始化 shadcn/ui
npx shadcn@latest init

# 4. 安裝組件
npx shadcn@latest add button card input textarea select checkbox radio-group label navigation-menu sheet dropdown-menu accordion toast form

# 5. 安裝額外依賴
npm install react-icons react-hook-form zod @hookform/resolvers

# 6. 啟動開發
npm run dev
```

---

**版本**: v3.0.0  
**最後更新**: 2025-12-01

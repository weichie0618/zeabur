/**
 * 晴朗家烘焙 - 全局 TypeScript 類型定義
 */

/* ==================== 通用類型 ==================== */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ==================== 新聞類型 ==================== */

export interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  imageAlt: string;
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  category: string;
  featured: boolean;
  views?: number;
}

export interface NewsCard extends Omit<News, "content"> {
  date: string;
}

/* ==================== 產品類型 ==================== */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  imageAlt: string;
  category: string;
  price?: number;
  stock?: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCard extends Omit<Product, "stock" | "createdAt" | "updatedAt"> {}

/* ==================== 門市類型 ==================== */

export interface Store {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email?: string;
  hours: string;
  image: string;
  imageAlt: string;
  latitude?: number;
  longitude?: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreCard extends Omit<Store, "createdAt" | "updatedAt"> {}

/* ==================== 表單類型 ==================== */

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface InquiryFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  inquiryType: "oembaking" | "corporate-procurement";
  quantity?: string;
  budget?: string;
  remarks?: string;
}

export interface FranchiseFormData {
  name: string;
  email: string;
  phone: string;
  budgetRange: string;
  location?: string;
  introduction?: string;
  experience?: string;
}

/* ==================== 品牌類型 ==================== */

export interface BrandInfo {
  name: string;
  slogan: string;
  description: string;
  logo: string;
  favicon: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  line?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  businessHours: string;
}

/* ==================== 頁面 Meta 類型 ==================== */

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
}

/* ==================== 優勢/特色類型 ==================== */

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  order: number;
}

/* ==================== 統計數據類型 ==================== */

export interface Statistics {
  storesCount: number;
  productsCount: number;
  yearsExperience: number;
  customersCount?: number;
  dailyProduction?: number;
}

/* ==================== 導航類型 ==================== */

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  submenu?: NavItem[];
  external?: boolean;
}

export interface NavConfig {
  mainNav: NavItem[];
  footer?: NavItem[];
}

/* ==================== Timeline 類型 ==================== */

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  image?: string;
}

/* ==================== 成功故事/案例類型 ==================== */

export interface SuccessStory {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  category: string;
  featured: boolean;
}

/* ==================== SEO 相關類型 ==================== */

export interface JsonLdOrganization {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export interface JsonLdLocalBusiness extends JsonLdOrganization {
  "@type": "LocalBusiness";
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone: string;
}


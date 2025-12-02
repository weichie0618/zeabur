import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合併 Tailwind CSS 類名
 * 解決類名衝突的問題
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 * @param date - Date 物件或時間戳
 * @param format - 格式字符串 (e.g., "YYYY-MM-DD")
 */
export function formatDate(date: Date | string, format = "YYYY-MM-DD"): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  if (format === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }

  if (format === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  }

  if (format === "YYYY年MM月DD日") {
    return `${year}年${month}月${day}日`;
  }

  return d.toLocaleDateString("zh-TW");
}

/**
 * 截斷文本
 * @param text - 要截斷的文本
 * @param length - 保留的長度
 * @param suffix - 後綴 (預設: "...")
 */
export function truncateText(
  text: string,
  length: number,
  suffix = "..."
): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + suffix;
}

/**
 * 驗證電子郵件
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 驗證台灣電話號碼
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+886|0)[1-9]\d{1,9}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ""));
}

/**
 * 去除空格
 */
export function trimString(text: string): string {
  return text.trim();
}

/**
 * 轉換為小駝峰命名
 */
export function toCamelCase(text: string): string {
  return text
    .split(/[-_\s]+/)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

/**
 * 轉換為短橫線命名
 */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * 延遲執行
 * @param ms - 毫秒數
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 取得查詢參數
 */
export function getQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * 複製文字到剪貼簿
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error("複製失敗:", error);
    return false;
  }
  return false;
}

/**
 * 對象是否為空
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * 深度複製對象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 生成隨機 ID
 */
export function generateId(prefix = ""): string {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * 計算折扣百分比
 */
export function calculateDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

/**
 * 格式化價格
 */
export function formatPrice(price: number, currency = "TWD"): string {
  const formatter = new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  });
  return formatter.format(price);
}


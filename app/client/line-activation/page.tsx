import { Suspense } from "react";
import { LineActivationClient } from "./ui/LineActivationClient";
import { Metadata } from "next";

// 定義頁面元數據（靜態生成）
export const metadata: Metadata = {
  title: "LINE 帳號服務 | 商家管理系統",
  description: "連接您的 LINE 帳號來管理您的商家服務和客戶關係",
};

// 設定預渲染 - Next.js 會靜態生成此頁面
export const dynamic = "force-static";
export const revalidate = 3600; // 一小時重新驗證一次

export default function LineActivationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 頂部區域：標題和LINE資訊 */}
          <div className="bg-gradient-to-r from-green-400 to-green-600 p-5 text-white">
            <h1 className="text-2xl font-bold text-center">LINE帳號服務</h1>
          </div>
          
          {/* 客戶端互動部分 */}
          <Suspense fallback={
            <div className="p-6 flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
            </div>
          }>
            <LineActivationClient />
          </Suspense>
        </div>
        
        
      </div>
    </div>
  );
} 
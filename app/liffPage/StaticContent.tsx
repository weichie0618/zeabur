import { cookies } from 'next/headers';

// 這是一個伺服器組件，沒有 'use client' 指令
async function getStaticData() {
  // 這裡可以進行伺服器端的數據獲取
  // 但不返回具體的公司資訊，只返回必要的基礎結構
  return {
    // 返回一個空物件，保留結構但不含特定內容
    initialized: true
  };
}

export default async function StaticContent() {
  // 在伺服器端獲取靜態數據
  const staticData = await getStaticData();
  
  // 獲取cookies (僅在伺服器端)
  const cookieStore = await cookies();
  const visitedCookie = cookieStore.get('visited');
  const hasVisited = visitedCookie !== undefined;
  
  return {
    staticData,
    hasVisited
  };
} 
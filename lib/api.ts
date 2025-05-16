// 從伺服器端獲取產品數據
export async function getProducts() {
  try {
    // 確保使用絕對 URL - 修改為使用 localhost:4000
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                    (process.env.NODE_ENV === 'development' 
                      ? 'http://localhost:4000' 
                      : 'http://localhost:4000'); // 修改生產環境的 URL
    
    // 添加時間戳和force_reload參數防止任何層級的緩存
    const timestamp = Date.now();
    const res = await fetch(`${baseUrl}/api/products?limit=20&status=active&_t=${timestamp}&force_reload=true`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!res.ok) {
      throw new Error('無法取得商品資料');
    }
    
    const data = await res.json();
    console.log('獲取產品數據 (時間戳):', timestamp);
    console.log('獲取的完整產品數據:', data); // 記錄完整響應
    console.log('獲取產品數據:', data.data); // 添加日誌以檢查獲取的產品數據
    return data.data || [];
  } catch (error) {
    console.error('獲取產品數據失敗:', error);
    return [];
  }
}

// 定義API返回的類別類型
interface ApiCategory {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  status: string;
  created_at: string;
  updated_at: string;
  parentId: number | null;
}

// 定義轉換後的類別類型
export interface Category {
  id: number;
  name: string;
  value: string;
  status: string;
}

// 從API獲取類別數據
export async function getCategories(): Promise<Category[]> {
  try {
    // 確保使用絕對 URL - 修改為使用 localhost:4000
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                    (process.env.NODE_ENV === 'development' 
                      ? 'http://localhost:4000' 
                      : 'http://localhost:4000'); // 修改生產環境的 URL
    
    // 添加時間戳防止緩存
    const timestamp = Date.now();
    const res = await fetch(`${baseUrl}/api/categories?_t=${timestamp}&force_reload=true`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!res.ok) {
      throw new Error('無法取得類別資料');
    }
    
    const categories: ApiCategory[] = await res.json();
    console.log('獲取類別數據 (時間戳):', timestamp);
    console.log('獲取的類別數據:', categories);
    
    // 為API返回的類別添加所需的屬性
    const transformedCategories = categories.map((category: ApiCategory) => {
      return {
        id: category.id,
        name: category.name,
        value: category.name.toLowerCase(), // 用於類別篩選
        status: category.status
      };
    });
    
    // 添加一個"全部商品"選項
    return [
      { 
        id: 0, 
        name: '全部商品', 
        value: 'all',
        status: 'active'
      },
      ...transformedCategories
    ];
  } catch (error) {
    console.error('獲取類別數據失敗:', error);
    // 出錯時返回默認類別
    return [
      { id: 0, name: '全部商品', value: 'all', status: 'active' }
    ];
  }
} 
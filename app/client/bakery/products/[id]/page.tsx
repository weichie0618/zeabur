import React from 'react';
import Link from 'next/link';

// 產品詳情頁面將根據URL參數顯示特定產品
// 在實際應用中，這裡會使用API獲取產品數據

// 模擬產品數據
const productsData = {
  1: {
    id: 1,
    name: '法式牛角麵包',
    category: '麵包',
    price: 65,
    originalPrice: 75,
    description: '使用頂級奶油製作，外層酥脆，內部鬆軟多層次，帶有濃郁的奶油香氣，是早餐或下午茶的完美選擇。',
    ingredients: ['高筋麵粉', '奶油', '糖', '鹽', '酵母', '牛奶'],
    nutritionFacts: {
      calories: 230,
      fat: '12g',
      carbs: '25g',
      protein: '5g',
      sodium: '290mg',
    },
    allergens: ['麩質', '乳製品'],
    storage: '室溫下可保存1天，冷藏可保存3天。建議在食用前微波加熱10-15秒。',
    images: [
      '/images/croissant-1.jpg',
      '/images/croissant-2.jpg',
      '/images/croissant-3.jpg',
    ],
    relatedProducts: [2, 5, 8, 11],
    reviews: [
      { id: 101, user: '林小明', rating: 5, comment: '非常好吃，酥脆度完美！', date: '2024-05-12' },
      { id: 102, user: '張美麗', rating: 4, comment: '奶香味十足，就是價格稍微有點高。', date: '2024-05-10' },
      { id: 103, user: '王大華', rating: 5, comment: '每次來都必買，非常推薦！', date: '2024-05-08' },
    ],
    isAvailable: true,
    stock: 24,
  }
};

export default function ProductDetail({ params }: { params: { id: string } }) {
  // 在實際應用中，可以使用 useEffect 和 useState 來處理數據加載
  // 這裡簡化處理，直接根據 ID 獲取模擬數據
  const productId = parseInt(params.id);
  const product = productsData[productId as keyof typeof productsData];
  
  // 如果產品不存在，顯示錯誤訊息
  if (!product) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到產品</h2>
          <p className="text-gray-600 mb-6">您要查看的產品不存在或已被移除。</p>
          <Link 
            href="/client/bakery/products" 
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            返回產品列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* 麵包屑導航 */}
      <nav className="text-sm text-gray-500">
        <ol className="flex items-center space-x-2">
          <li><Link href="/client/bakery" className="hover:text-amber-600">首頁</Link></li>
          <li><span>&gt;</span></li>
          <li><Link href="/client/bakery/products" className="hover:text-amber-600">產品列表</Link></li>
          <li><span>&gt;</span></li>
          <li><Link href={`/client/bakery/products?category=${product.category}`} className="hover:text-amber-600">{product.category}</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-800">{product.name}</li>
        </ol>
      </nav>

      {/* 產品詳情區域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 產品圖片區域 */}
        <div className="space-y-4">
          <div className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <p>主要產品圖片</p>
              <p className="text-sm">（實際應用中會顯示圖片）</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">縮圖 {index}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 產品資訊區域 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-amber-600 mt-2">
              <span className="text-2xl font-bold">${product.price}</span>
              {product.originalPrice && (
                <span className="text-gray-500 line-through ml-2">${product.originalPrice}</span>
              )}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star} 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${star <= 4.5 ? 'text-yellow-400' : 'text-gray-300'}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-gray-600 ml-2">4.5 (18 評論)</span>
            </div>
            
            <p className="text-gray-700">{product.description}</p>
            
            <div className="py-4 border-t border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button className="px-3 py-1 text-gray-600 hover:bg-gray-100">−</button>
                  <span className="px-4 py-1 border-l border-r border-gray-300">1</span>
                  <button className="px-3 py-1 text-gray-600 hover:bg-gray-100">+</button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {product.stock > 0 ? (
                    <span>庫存: {product.stock}件</span>
                  ) : (
                    <span className="text-red-500">缺貨中</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                disabled={!product.isAvailable}
              >
                加入購物車
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors">
                加入追蹤
              </button>
            </div>
          </div>
          
          {/* 產品詳細資訊 */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">成分</h3>
              <p className="text-gray-600 mt-1">{product.ingredients.join('、')}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">過敏原資訊</h3>
              <p className="text-gray-600 mt-1">{product.allergens.join('、')}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">保存方法</h3>
              <p className="text-gray-600 mt-1">{product.storage}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 營養成分 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">營養成分表</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">熱量</p>
            <p className="font-bold text-amber-600">{product.nutritionFacts.calories} 大卡</p>
          </div>
          <div className="bg-white p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">脂肪</p>
            <p className="font-bold text-amber-600">{product.nutritionFacts.fat}</p>
          </div>
          <div className="bg-white p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">碳水化合物</p>
            <p className="font-bold text-amber-600">{product.nutritionFacts.carbs}</p>
          </div>
          <div className="bg-white p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">蛋白質</p>
            <p className="font-bold text-amber-600">{product.nutritionFacts.protein}</p>
          </div>
          <div className="bg-white p-4 rounded-md text-center">
            <p className="text-gray-500 text-sm">鈉</p>
            <p className="font-bold text-amber-600">{product.nutritionFacts.sodium}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">* 以上營養成分數據僅供參考，實際成分可能因製作批次而略有不同。</p>
      </div>
      
      {/* 顧客評論 */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">顧客評論</h2>
          <button className="text-amber-600 hover:text-amber-700 font-medium">寫評論</button>
        </div>
        
        <div className="space-y-6">
          {product.reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6">
              <div className="flex justify-between mb-2">
                <div className="font-medium">{review.user}</div>
                <div className="text-gray-500 text-sm">{review.date}</div>
              </div>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star} 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button className="text-amber-600 hover:text-amber-700 font-medium">查看更多評論</button>
        </div>
      </div>
      
      {/* 相關商品推薦 */}
      <div>
        <h2 className="text-2xl font-bold mb-6">您可能也會喜歡</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">相關商品 {index}</span>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm">相關產品名稱</h3>
                <p className="text-amber-600 font-bold text-sm mt-1">$XX</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
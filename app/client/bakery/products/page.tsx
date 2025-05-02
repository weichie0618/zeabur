import React from 'react';
import Link from 'next/link';

// 模擬產品類別
const categories = [
  '所有產品',
  '麵包',
  '蛋糕',
  '餅乾',
  '甜點',
  '飲料',
];

// 模擬產品篩選選項
const filters = {
  sortBy: ['推薦', '價格低至高', '價格高至低', '最新上架'],
  priceRange: ['所有價位', '100元以下', '100-300元', '300元以上'],
  dietary: ['無', '素食', '無麩質', '低糖'],
};

// 模擬產品數據
const products = [
  { id: 1, name: '法式牛角麵包', category: '麵包', price: 65, isNew: false, image: '/images/croissant.jpg' },
  { id: 2, name: '藍莓乳酪蛋糕', category: '蛋糕', price: 120, isNew: true, image: '/images/blueberry-cheesecake.jpg' },
  { id: 3, name: '巧克力餅乾', category: '餅乾', price: 45, isNew: false, image: '/images/chocolate-cookies.jpg' },
  { id: 4, name: '鮮奶油蛋糕', category: '蛋糕', price: 320, isNew: false, image: '/images/cream-cake.jpg' },
  { id: 5, name: '紅豆麵包', category: '麵包', price: 55, isNew: false, image: '/images/red-bean-bread.jpg' },
  { id: 6, name: '提拉米蘇', category: '甜點', price: 150, isNew: true, image: '/images/tiramisu.jpg' },
  { id: 7, name: '抹茶拿鐵', category: '飲料', price: 110, isNew: false, image: '/images/matcha-latte.jpg' },
  { id: 8, name: '肉鬆麵包', category: '麵包', price: 60, isNew: false, image: '/images/pork-floss-bread.jpg' },
  { id: 9, name: '草莓蛋糕', category: '蛋糕', price: 270, isNew: true, image: '/images/strawberry-cake.jpg' },
  { id: 10, name: '曲奇餅乾', category: '餅乾', price: 80, isNew: false, image: '/images/cookies.jpg' },
  { id: 11, name: '核桃吐司', category: '麵包', price: 85, isNew: false, image: '/images/walnut-toast.jpg' },
  { id: 12, name: '檸檬塔', category: '甜點', price: 90, isNew: true, image: '/images/lemon-tart.jpg' },
];

export default function ProductsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">產品列表</h1>
      
      {/* 篩選器和排序區 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500">
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500">
              {filters.sortBy.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">價格範圍</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500">
              {filters.priceRange.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">飲食需求</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500">
              {filters.dietary.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 產品網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
            <Link href={`/client/bakery/products/${product.id}`}>
              <div className="relative h-48 bg-gray-200">
                {/* 實際應用中，這裡應該有產品圖片 */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  產品圖片
                </div>
                
                {product.isNew && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                    新品
                  </div>
                )}
              </div>
            </Link>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>
                <span className="text-amber-600 font-bold">${product.price}</span>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-md transition-colors text-sm">
                  加入購物車
                </button>
                <button className="p-2 text-gray-500 hover:text-amber-500 border border-gray-300 rounded-md hover:border-amber-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 分頁控制 */}
      <div className="flex justify-center mt-8">
        <nav className="flex items-center space-x-2">
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">
            上一頁
          </button>
          <button className="px-3 py-2 border border-amber-500 bg-amber-500 text-white rounded-md text-sm">
            1
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            3
          </button>
          <span className="px-3 py-2 text-gray-500">...</span>
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            8
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">
            下一頁
          </button>
        </nav>
      </div>
    </div>
  );
} 
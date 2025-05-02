import React from 'react';
import Link from 'next/link';

// 模擬產品數據
const products = [
  { id: 1, name: '法式牛角麵包', category: '麵包', price: 65, stock: 24, status: '上架中' },
  { id: 2, name: '藍莓乳酪蛋糕', category: '蛋糕', price: 120, stock: 15, status: '上架中' },
  { id: 3, name: '巧克力餅乾', category: '餅乾', price: 45, stock: 4, status: '庫存不足' },
  { id: 4, name: '鮮奶油蛋糕', category: '蛋糕', price: 320, stock: 3, status: '庫存不足' },
  { id: 5, name: '紅豆麵包', category: '麵包', price: 55, stock: 18, status: '上架中' },
  { id: 6, name: '提拉米蘇', category: '甜點', price: 150, stock: 12, status: '上架中' },
  { id: 7, name: '抹茶拿鐵', category: '飲料', price: 110, stock: 2, status: '庫存不足' },
  { id: 8, name: '肉鬆麵包', category: '麵包', price: 60, stock: 22, status: '上架中' },
  { id: 9, name: '草莓蛋糕', category: '蛋糕', price: 270, stock: 11, status: '上架中' },
  { id: 10, name: '曲奇餅乾', category: '餅乾', price: 80, stock: 31, status: '上架中' },
  { id: 11, name: '核桃吐司', category: '麵包', price: 85, stock: 16, status: '上架中' },
  { id: 12, name: '檸檬塔', category: '甜點', price: 90, stock: 8, status: '上架中' },
  { id: 13, name: '巧克力慕斯', category: '甜點', price: 180, stock: 0, status: '缺貨中' },
  { id: 14, name: '葡萄乾麵包', category: '麵包', price: 45, stock: 7, status: '上架中' },
  { id: 15, name: '法式馬卡龍', category: '甜點', price: 35, stock: 42, status: '上架中' },
];

// 分類數據
const categories = [
  '所有分類',
  '麵包',
  '蛋糕',
  '餅乾',
  '甜點',
  '飲料',
];

export default function ProductsManagement() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">產品管理</h1>
        <Link 
          href="/admin/bakery/products/new" 
          className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          新增產品
        </Link>
      </div>

      {/* 搜尋與篩選區 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">搜尋產品</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="輸入產品名稱或ID"
                className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">分類</label>
            <select
              id="category"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
            <select
              id="status"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">所有狀態</option>
              <option value="上架中">上架中</option>
              <option value="庫存不足">庫存不足</option>
              <option value="缺貨中">缺貨中</option>
              <option value="下架中">下架中</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select
              id="sort"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="newest">最新上架</option>
              <option value="price_asc">價格低至高</option>
              <option value="price_desc">價格高至低</option>
              <option value="stock_asc">庫存少至多</option>
              <option value="stock_desc">庫存多至少</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            套用篩選
          </button>
        </div>
      </div>

      {/* 產品表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  產品
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分類
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  價格
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  庫存
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  動作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                        圖片
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${product.stock < 5 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {product.stock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === '上架中' ? 'bg-green-100 text-green-800' :
                      product.status === '庫存不足' ? 'bg-yellow-100 text-yellow-800' :
                      product.status === '缺貨中' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link 
                        href={`/admin/bakery/products/edit/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        編輯
                      </Link>
                      <button className="text-red-600 hover:text-red-900">
                        刪除
                      </button>
                      <Link 
                        href={`/admin/bakery/products/${product.id}`}
                        className="text-amber-600 hover:text-amber-900"
                      >
                        檢視
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 分頁控制 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              上一頁
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              下一頁
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                顯示第 <span className="font-medium">1</span> 到 <span className="font-medium">15</span> 項結果，共 <span className="font-medium">30</span> 項
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">上一頁</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-amber-500 bg-amber-50 text-sm font-medium text-amber-600">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">下一頁</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';

// 模擬購物車數據
const cartItems = [
  {
    id: 1,
    name: '法式牛角麵包',
    price: 65,
    quantity: 2,
    image: '/images/croissant.jpg',
  },
  {
    id: 6,
    name: '提拉米蘇',
    price: 150,
    quantity: 1,
    image: '/images/tiramisu.jpg',
  },
  {
    id: 9,
    name: '草莓蛋糕',
    price: 270,
    quantity: 1,
    image: '/images/strawberry-cake.jpg',
  },
];

// 模擬優惠券數據
const coupons = [
  { id: 'NEW15', discount: '15% 折扣', minSpend: 300 },
  { id: 'BAKERY100', discount: '滿 1000 折 $100', minSpend: 1000 },
];

export default function CartPage() {
  // 計算總金額
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 60;
  const discount = 0; // 在實際應用中，這裡會根據選擇的優惠券計算折扣
  const total = subtotal + shipping - discount;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">購物車</h1>

      {cartItems.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">您的購物車是空的</h2>
          <p className="text-gray-500 mb-6 text-center">
            看起來您尚未將任何商品加入購物車。<br />瀏覽我們的產品並開始選購吧！
          </p>
          <Link
            href="/client/bakery/products"
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            繼續購物
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 購物車項目 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">購物車項目 ({cartItems.length})</h2>
                  <button className="text-gray-500 hover:text-amber-600">
                    清空購物車
                  </button>
                </div>
              </div>

              {/* 購物車項目列表 */}
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center">
                    <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-200 rounded-md mb-4 sm:mb-0 sm:mr-6 flex items-center justify-center">
                      <span className="text-gray-500">產品圖片</span>
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            <Link href={`/client/bakery/products/${item.id}`} className="hover:text-amber-600">
                              {item.name}
                            </Link>
                          </h3>
                          <p className="text-amber-600 font-bold mt-1">${item.price}</p>
                        </div>
                        
                        <div className="flex items-center mt-3 sm:mt-0">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100">−</button>
                            <span className="px-4 py-1 border-l border-r border-gray-300">{item.quantity}</span>
                            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100">+</button>
                          </div>
                          
                          <button className="ml-4 text-gray-500 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-right">
                        <p className="text-gray-700">小計: ${item.price * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-gray-50">
                <Link 
                  href="/client/bakery/products"
                  className="text-amber-600 hover:text-amber-700 font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  繼續購物
                </Link>
              </div>
            </div>
          </div>
          
          {/* 訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">訂單摘要</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">小計</span>
                  <span className="font-medium">${subtotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">運費</span>
                  <span className="font-medium">
                    {shipping === 0 ? '免運費' : `$${shipping}`}
                  </span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>折扣</span>
                    <span>-${discount}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4 flex justify-between font-bold">
                  <span>總計</span>
                  <span>${total}</span>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-1">
                    {subtotal < 500 ? `再消費 $${500 - subtotal} 即可享有免運費` : '您已享有免運費優惠'}
                  </p>
                </div>
              </div>
              
              {/* 優惠券輸入 */}
              <div className="p-6 border-t border-gray-200">
                <h3 className="font-medium mb-3">使用優惠券</h3>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="輸入優惠碼"
                    className="flex-grow border border-gray-300 rounded-l-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button className="bg-amber-100 text-amber-800 font-medium px-4 py-2 rounded-r-md hover:bg-amber-200 transition-colors">
                    套用
                  </button>
                </div>
                
                {coupons.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">可用優惠券</h4>
                    <div className="space-y-2">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className="flex justify-between items-center p-2 border border-dashed border-amber-300 rounded bg-amber-50">
                          <div>
                            <p className="font-medium text-amber-800">{coupon.discount}</p>
                            <p className="text-xs text-gray-500">最低消費: ${coupon.minSpend}</p>
                          </div>
                          <button className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200">
                            使用
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 結帳按鈕 */}
              <div className="p-6 bg-gray-50">
                <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                  前往結帳
                </button>
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>結帳即代表您同意我們的</p>
                  <div className="flex justify-center space-x-1 mt-1">
                    <Link href="/client/bakery/terms" className="text-amber-600 hover:underline">使用條款</Link>
                    <span>與</span>
                    <Link href="/client/bakery/privacy" className="text-amber-600 hover:underline">隱私政策</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
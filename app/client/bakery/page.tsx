'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// 骨架屏元件
const SkeletonCard = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-md p-4 animate-pulse">
    <div className="h-48 bg-gray-200 rounded mb-4"></div>
    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded mb-4 w-1/4"></div>
    <div className="h-8 bg-gray-200 rounded w-full"></div>
  </div>
);

export default function ClientHomePage() {
  // 1. 用 useState 管理商品資料
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // 檢測是否是移動設備
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 2. 用 useEffect 抓取 API
  useEffect(() => {
    fetch('/api/products?limit=20')  // 增加獲取的產品數量
      .then(async (res) => {
        if (!res.ok) throw new Error('無法取得商品資料');
        const json = await res.json();
        setProducts(json.data || []);
        setFilteredProducts(json.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        // 模擬載入時間，讓用戶可以看到骨架屏效果
        setTimeout(() => setLoading(false), 600);
      });
  }, []);

  // 篩選產品
  useEffect(() => {
    let result = [...products];
    
    // 根據類別篩選
    if (activeCategory !== 'all') {
      result = result.filter(product => product.category === activeCategory);
    }
    
    // 根據搜尋字詞篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredProducts(result);
  }, [activeCategory, products, searchQuery]);

  // 加入購物車功能
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // 如果產品已在購物車，增加數量
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      // 否則添加新產品
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // 不再自動顯示購物車側邊欄
  };

  // 從購物車移除
  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // 更新購物車商品數量
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // 計算購物車總金額
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // 計算購物車總數量
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // 麵包種類
  const breadCategories = [
    { name: '全部商品', icon: '🍞', description: '查看所有美味產品', value: 'all' },
    { name: '法式麵包', icon: '🥖', description: '酥脆外皮，鬆軟內裡', value: 'french' },
    { name: '甜點蛋糕', icon: '🍰', description: '精緻美味，香甜可口', value: 'cake' },
    { name: '健康全麥', icon: '🌾', description: '營養豐富，粗糧製作', value: 'wholegrain' },
    { name: '特色吐司', icon: '🍞', description: '鬆軟綿密，百搭美味', value: 'toast' },
  ];

  return (
    <div className="space-y-12">
      {/* 英雄區塊 */}
      <motion.section 
        className="relative bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-6 md:py-20">
          <div className="max-w-lg">
            <motion.h1 
              className="text-2xl md:text-5xl font-bold text-amber-900 mb-2 md:mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              新鮮出爐的幸福滋味
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-amber-800 mb-6 md:mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              採用頂級食材，每日新鮮製作，帶給您最道地的烘焙美食體驗。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <button 
                onClick={() => {
                  const productsSection = document.getElementById('products-section');
                  if (productsSection) {
                    window.scrollTo({
                      top: productsSection.offsetTop - 100,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 md:py-3 px-6 md:px-8 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 transition-transform"
              >
                立即選購
              </button>
            </motion.div>
          </div>
        </div>
        <div className="hidden md:block absolute right-0 bottom-0 w-1/3 h-full">
          <Image 
            src="/breads.jpg" 
            alt="新鮮麵包" 
            fill 
            style={{ objectFit: 'cover' }}
            className="rounded-l-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="absolute bottom-0 right-0 w-1/3 h-full bg-amber-200 opacity-50 -skew-x-12 transform origin-bottom-right"></div>
      </motion.section>

      {/* 購物車浮動按鈕 - 根據裝置位置不同 */}
      <div className={`fixed z-50 ${isMobile ? 'mb-5 bottom-0 left-0 right-0 mx-auto w-11/12' : 'bottom-6 right-6'}`}>
        <button 
          onClick={() => setIsCartOpen(!isCartOpen)}
          className={`${isMobile ? 'w-full' : 'w-auto min-w-[180px]'} bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center justify-between transition-all duration-300`}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">購物車</span>
          </div>
          <div className="flex items-center">
            {cart.length > 0 && (
              <>
                <span className="mr-2">${calculateTotal().toFixed(0)}</span>
                <span className="bg-white text-amber-600 font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* 購物車側邊欄/底部抽屜 - 根據裝置顯示方式不同 */}
      <div 
        className={`fixed z-50 bg-white shadow-xl transition-all duration-300 ${
          isMobile 
            ? `bottom-0 mb-0 left-0 right-0 w-full h-screen transform ${isCartOpen ? 'translate-y-0' : 'translate-y-[120%]'} rounded-t-3xl` 
            : `top-0 right-0 h-full w-full max-w-md transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          {isMobile && (
            <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          )}
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold">購物車</h2>
            <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>您的購物車目前是空的</p>
              {isMobile && (
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="mt-8 w-64 border border-amber-600 text-amber-600 hover:bg-amber-50 py-3 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  繼續購物
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center mb-4 border-b pb-4">
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden relative">
                      <Image
                        src={item.images}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-amber-600">${item.price}</p>
                      <div className="flex items-center mt-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 rounded-l px-2"
                        >
                          -
                        </button>
                        <span className="bg-gray-100 px-3">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-gray-200 text-gray-700 rounded-r px-2"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className={`border-t pt-4 ${isMobile ? 'pb-8' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">總計</span>
                  <span className="font-bold text-amber-600">${calculateTotal().toFixed(2)}</span>
                </div>
                <button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg">
                  結帳
                </button>
                {isMobile && (
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="w-full mt-3 border border-amber-600 text-amber-600 hover:bg-amber-50 py-3 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    繼續購物
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 麵包種類快速導覽 */}
      <section className="py-2">
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {breadCategories.map((category, index) => (
            <motion.div
              key={category.name}
              className={`bg-white border ${activeCategory === category.value ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200'} rounded-lg p-4 text-center hover:bg-amber-50 transition-colors cursor-pointer shadow-sm hover:shadow-md`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              onClick={() => setActiveCategory(category.value)}
            >
              <span className="text-3xl mb-2 block">{category.icon}</span>
              <h3 className="font-medium text-gray-800">{category.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 產品搜尋 */}
      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full border-amber-200 border-2 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 商品區塊 */}
      <section id="products-section">
        <div className="flex justify-between items-center mb-8">
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-gray-800 relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeCategory === 'all' ? '所有商品' : breadCategories.find(cat => cat.value === activeCategory)?.name || '商品'}
            <span className="absolute -bottom-2 left-0 w-1/4 h-1 bg-amber-400 rounded-full"></span>
          </motion.h2>
        </div>
        
        {/* 處理 loading、error 狀態 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
              <p className="font-medium">{error}</p>
              <button 
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  // 重新嘗試獲取商品
                  fetch('/api/products?limit=20')
                    .then(async (res) => {
                      if (!res.ok) throw new Error('無法取得商品資料');
                      const json = await res.json();
                      setProducts(json.data || []);
                      setFilteredProducts(json.data || []);
                    })
                    .catch((err) => setError(err.message))
                    .finally(() => setLoading(false));
                }}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
              >
                重新載入
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-amber-600 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium mb-2">找不到相符的商品</h3>
            <p className="text-gray-500">請嘗試其他搜尋條件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div 
                key={product.id} 
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * (index % 8), duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {/* 顯示商品圖片 */}
                  <Image
                    src={product.images}
                    alt={product.name.trim()}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{product.name.trim()}</h3>
                    {product.is_new && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">新品</span>
                    )}
                  </div>
                  <p className="text-amber-600 font-bold mt-1 flex items-center">
                    ${product.price}
                    {product.original_price && (
                      <span className="text-gray-400 text-sm line-through ml-2">${product.original_price}</span>
                    )}
                  </p>
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full mt-3 bg-amber-100 hover:bg-amber-200 text-amber-800 py-2 rounded-md transition-colors flex items-center justify-center group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    加入購物車
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 電腦版底部留白，避免購物車按鈕遮擋 */}
      {/* {isMobile && <div className="h-5"></div>} */}
    </div>
  );
} 
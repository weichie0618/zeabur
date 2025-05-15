'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BreadCategories } from './BreadCategories';
import { ShoppingCart } from './ShoppingCart';

// 骨架屏元件
const SkeletonCard = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-md p-4 animate-pulse">
    <div className="h-48 bg-gray-200 rounded mb-4"></div>
    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded mb-4 w-1/4"></div>
    <div className="h-8 bg-gray-200 rounded w-full"></div>
  </div>
);

interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  images: string;
  category: string;
  description?: string;
  is_new?: boolean;
  quantity?: number;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
  value: string;
  status?: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  breadCategories: Category[];
}

export const ProductsClient: React.FC<ProductsClientProps> = ({ initialProducts, breadCategories }) => {
  // 客戶端狀態管理
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 檢測是否是移動設備
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    // 設置初始化完成
    setIsInitialized(true);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 當類別變更時，適當地捲動到產品部分並更新標題
  useEffect(() => {
    // 確保類別變更時重新進行本地篩選
    let result = [...initialProducts]; // 使用初始產品進行篩選
    
    // 根據類別篩選
    if (activeCategory !== 'all') {
      // 將 activeCategory 轉換為數字進行比較
      const activeCategoryId = parseInt(activeCategory);
      
      // 篩選邏輯變更，使用 category_id 進行比較
      result = result.filter(product => product.category_id === activeCategoryId);
    }
    
    // 根據搜尋字詞篩選（如果有）
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredProducts(result);
    
    // 捲動到產品部分
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      setTimeout(() => {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeCategory, initialProducts, searchQuery]);

  // 加入購物車功能 - 使用 useCallback 優化
  const addToCart = useCallback((product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // 如果產品已在購物車，增加數量
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      ));
    } else {
      // 否則添加新產品
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  }, [cart]);

  // 從購物車移除 - 使用 useCallback 優化
  const removeFromCart = useCallback((productId: number) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    
    // 如果購物車為空，則清除localStorage中的購物車數據
    if (newCart.length === 0) {
      localStorage.removeItem('bakeryCart');
      // 自動關閉購物車抽屜
      setIsCartOpen(false);
    }
  }, [cart, setIsCartOpen]);

  // 更新購物車商品數量 - 使用 useCallback 優化
  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  }, [cart]);

  // 計算購物車總金額 - 使用 useCallback 優化
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  }, [cart]);

  // 計算購物車總數量 - 使用 useCallback 優化
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cart]);

  // 結帳功能 - 使用 useCallback 優化
  const handleCheckout = useCallback(() => {
    // 將購物車資料儲存到 localStorage
    try {
      localStorage.setItem('bakeryCart', JSON.stringify(cart));
      // 導向結帳頁面
      window.location.href = '/client/checkout';
    } catch (error) {
      console.error('無法保存購物車資料', error);
      alert('處理訂單時發生錯誤，請稍後再試');
    }
  }, [cart]);

  // 當購物車變化時，保存到 localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('bakeryCart', JSON.stringify(cart));
    } else {
      // 清除 localStorage 中的購物車數據
      localStorage.removeItem('bakeryCart');
    }
  }, [cart]);

  // 從 localStorage 載入購物車
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bakeryCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('無法載入購物車資料', error);
    }

    // 設置初始化完成，預設隱藏購物車抽屜，防止動畫問題
    setTimeout(() => {
      setIsInitialized(true);
    }, 300);

    // 防止初始載入時的動畫問題
    const bodyElement = document.body;
    bodyElement.classList.add('overflow-x-hidden');
    
    return () => {
      bodyElement.classList.remove('overflow-x-hidden');
    };
  }, []);
  
  // 重新獲取產品資料 - 使用 useCallback 優化
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // 統一篩選邏輯，與主要篩選邏輯一致
    let result = [...initialProducts];
    
    if (activeCategory !== 'all') {
      // 將 activeCategory 轉換為數字進行比較
      const activeCategoryId = parseInt(activeCategory);
      // 使用 category_id 進行篩選，與上方邏輯一致
      result = result.filter(product => product.category_id === activeCategoryId);
    }
    
    // 應用搜尋查詢篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredProducts(result);
    setLoading(false);
  }, [initialProducts, activeCategory, searchQuery]);

  return (
    <>
      {/* 使用分離的購物車元件 */}
      <ShoppingCart
        cart={cart}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        isMobile={isMobile}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        calculateTotal={calculateTotal}
        getTotalItems={getTotalItems}
        handleCheckout={handleCheckout}
        isInitialized={isInitialized}
      />

      {/* 麵包種類快速導覽 */}
      <BreadCategories 
        categories={breadCategories} 
        activeCategory={activeCategory}
        setActiveCategory={(category) => {
          setActiveCategory(category);
        }}
      />

      {/* 產品搜尋 */}
      <div className="w-full mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋商品..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="w-full px-4 py-2 rounded-full border-gray-200 border focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 text-sm"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 商品區塊 - 注意在這裡優化手機顯示為兩列 */}
      <section id="products-section">
        <div className="flex justify-between items-center mb-4 md:mb-8">
          <motion.h2 
            className="text-xl md:text-2xl font-bold text-gray-800 relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeCategory === 'all' 
              ? '所有商品' 
              : breadCategories.find(cat => cat.id.toString() === activeCategory)?.name.trim() || '商品'}
            <span className="absolute -bottom-1 left-0 w-1/4 h-1 bg-amber-400 rounded-full"></span>
          </motion.h2>
          <span className="text-amber-600 text-sm">
            {filteredProducts.length} 件商品
          </span>
        </div>
        
        {/* 處理 loading、error 狀態 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
              <p className="font-medium">{error}</p>
              <button 
                onClick={handleRefresh}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
    </>
  );
}; 
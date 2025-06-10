'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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
  category: Category;
  description?: string;
  is_new?: boolean;
  quantity?: number;
  categoryId: number;
  specification?: string;
}

interface Category {
  id: number;
  name: string;
  value: string;
  status?: string;
  sort?: number;
}

interface ProductsClientProps {
  initialProducts: Product[];
  breadCategories: Category[];
}

export const ProductsClient: React.FC<ProductsClientProps> = ({ initialProducts, breadCategories }) => {
  // 添加日誌檢查初始產品數據
  console.log('初始產品數據:', initialProducts);
  
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
  // 添加模態視窗狀態
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  // 添加購物車動畫狀態
  const [animatingProduct, setAnimatingProduct] = useState<number | null>(null);
  const [cartButtonAnimating, setCartButtonAnimating] = useState<number | null>(null);
  // 修改為使用Set集合追蹤多個同時進行的動畫
  const [animatingButtons, setAnimatingButtons] = useState<Set<number>>(new Set());
  // 添加模態視窗數量選擇狀態
  const [modalQuantity, setModalQuantity] = useState<number>(1);

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
      result = result.filter(product => product.categoryId === activeCategoryId);
    } else {
      // 當顯示所有商品時，先按照類別ID排序
      result.sort((a, b) => (a.category.sort || 0) - (b.category.sort || 0));
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
    
    // 添加一個狀態追蹤標記，只在使用者主動點擊類別時才滾動
    const userTriggeredCategoryChange = sessionStorage.getItem('userTriggeredCategoryChange') === 'true';
    
    // 捲動到產品部分，但只在使用者主動切換類別時進行
    if (userTriggeredCategoryChange) {
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        setTimeout(() => {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        // 重置標記，確保下次需要明確設置
        sessionStorage.removeItem('userTriggeredCategoryChange');
      }
    }
  }, [activeCategory, initialProducts, searchQuery]);

  // 加入購物車功能 - 修改為考慮移動裝置
  const addToCart = useCallback((product: Product) => {
    // 防止重複快速點擊
    const productId = product.id;
    
    // 如果已經在模態視窗中，直接添加到購物車
    if (showModal) {
      const existingItem = cart.find(item => item.id === productId);
      
      if (existingItem) {
        // 如果產品已在購物車，增加數量
        setCart(cart.map(item => 
          item.id === productId ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        ));
      } else {
        // 否則添加新產品
        setCart([...cart, { ...product, quantity: 1 }]);
      }
      return;
    }
    
    // 立即將商品加入購物車，不等待動畫完成
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      // 如果產品已在購物車，增加數量
      setCart(cart.map(item => 
        item.id === productId ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      ));
    } else {
      // 否則添加新產品
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // 移動裝置不顯示動畫或使用簡化動畫
    if (isMobile) {
      // 簡化的動畫處理，避免懸停問題
      setAnimatingButtons(prev => {
        const newSet = new Set(prev);
        newSet.add(productId);
        return newSet;
      });
      
      // 縮短動畫時間以提升移動設備體驗
      setTimeout(() => {
        setAnimatingButtons(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }, 900); // 移動設備上使用較短的動畫時間
      
      return;
    }
    
    // 桌面設備使用完整動畫
    // 啟動按鈕動畫 - 修改為使用Set集合
    setAnimatingButtons(prev => {
      // 創建新的Set以避免直接修改狀態
      const newSet = new Set(prev);
      // 如果此商品已在動畫中，先移除再添加（重置動畫）
      if (newSet.has(productId)) {
        newSet.delete(productId);
        // 使用setTimeout確保DOM更新後再添加
        setTimeout(() => {
          setAnimatingButtons(current => new Set([...current, productId]));
        }, 10);
      } else {
        // 否則直接添加
        newSet.add(productId);
      }
      return newSet;
    });
    
    // 動畫結束後移除該商品的動畫狀態
    setTimeout(() => {
      setAnimatingButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 1000); // 按鈕動畫時長
  }, [cart, showModal, isMobile]);

  // 從購物車移除 - 使用 useCallback 優化
  const removeFromCart = useCallback((productId: number) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    
    // 僅在購物車變為空且用戶已經在頁面上操作時才考慮清空localStorage
    // 不再在這裡直接清空localStorage，而是依靠上面的useEffect
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

  // 從 localStorage 載入購物車
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bakeryCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // 只有當購物車為空時才設置購物車數據
        if (cart.length === 0 && parsedCart && parsedCart.length > 0) {
          console.log('從 localStorage 載入購物車數據:', parsedCart);
          setCart(parsedCart);
        }
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

  // 當購物車變化時，保存到 localStorage
  useEffect(() => {
    if (cart.length > 0) {
      console.log('將購物車數據保存到 localStorage:', cart);
      localStorage.setItem('bakeryCart', JSON.stringify(cart));
    } else if (isInitialized) {
      // 只有在初始化完成後才清除 localStorage 中的購物車數據
      // 這可以防止在從結帳頁面返回時清空購物車
      localStorage.removeItem('bakeryCart');
    }
  }, [cart, isInitialized]);
  
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
      result = result.filter(product => product.categoryId === activeCategoryId);
    } else {
      // 當顯示所有商品時，先按照類別ID排序
      result.sort((a, b) => a.categoryId - b.categoryId);
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

  // 顯示商品詳情模態視窗
  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
    // 重置模態視窗數量為1
    setModalQuantity(1);
    // 模態視窗開啟時禁止捲動
    document.body.style.overflow = 'hidden';
  }, []);

  // 關閉商品詳情模態視窗
  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedProduct(null);
    // 模態視窗關閉時恢復捲動
    document.body.style.overflow = 'auto';
  }, []);

  // 增加模態視窗數量
  const increaseModalQuantity = useCallback(() => {
    setModalQuantity(prev => prev + 1);
  }, []);

  // 減少模態視窗數量
  const decreaseModalQuantity = useCallback(() => {
    setModalQuantity(prev => (prev > 1 ? prev - 1 : 1));
  }, []);

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
              // 如果搜尋字段不為空，設置用戶觸發滾動標記
              if (e.target.value.trim()) {
                sessionStorage.setItem('userTriggeredCategoryChange', 'true');
              }
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

      {/* 商品詳情模態視窗 */}
      <AnimatePresence>
        {showModal && selectedProduct && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="relative bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1.5 border-2 border-white shadow-md flex items-center justify-center"
                onClick={closeModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative h-64 bg-gray-100">
                <Image
                  src={selectedProduct.images}
                  alt={selectedProduct.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-gray-900 break-words mr-2 ${
                    selectedProduct.name.length > 25 ? 'text-xl' : 'text-2xl'
                  }`}>
                    {selectedProduct.name}
                  </h3>
                  {selectedProduct.is_new && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex-shrink-0">新品</span>
                  )}
                </div>
                
                <p className="text-amber-600 text-xl font-bold mb-4">
                  ${selectedProduct.price}
                  {selectedProduct.original_price && (
                    <span className="text-gray-400 text-base line-through ml-2">
                      ${selectedProduct.original_price}
                    </span>
                  )}
                </p>
                
                {selectedProduct.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">商品描述</h4>
                    <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                  </div>
                )}
                
                {selectedProduct.specification && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                      </svg>
                      商品規格
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                      <p className="text-gray-600 text-sm whitespace-pre-line">{selectedProduct.specification}</p>
                    </div>
                  </div>
                )}
                
                {/* 新增數量選擇器 */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    購買數量
                  </h4>
                  <div className="flex items-center justify-start">
                    <button 
                      onClick={decreaseModalQuantity}
                      className="w-10 h-10 rounded-l-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center border border-amber-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="w-12 h-10 flex items-center justify-center border-t border-b border-amber-200 bg-white text-gray-800 font-medium">
                      {modalQuantity}
                    </div>
                    <button 
                      onClick={increaseModalQuantity}
                      className="w-10 h-10 rounded-r-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center border border-amber-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    // 修改加入購物車函數，將選擇的數量添加到購物車
                    const existingItem = cart.find(item => item.id === selectedProduct.id);
                    
                    if (existingItem) {
                      // 如果產品已在購物車，增加選擇的數量
                      setCart(cart.map(item => 
                        item.id === selectedProduct.id 
                          ? { ...item, quantity: (item.quantity || 1) + modalQuantity } 
                          : item
                      ));
                    } else {
                      // 否則添加新產品，數量為選擇的數量
                      setCart([...cart, { ...selectedProduct, quantity: modalQuantity }]);
                    }
                    closeModal();
                  }}
                  className={`w-full py-3 ${
                    isMobile 
                      ? 'bg-amber-500 active:bg-amber-600' // 移動設備使用 active 而非 hover
                      : 'bg-amber-500 hover:bg-amber-600'
                  } text-white rounded-md transition-colors font-medium flex items-center justify-center overflow-hidden group relative`}
                >
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-full bg-amber-600 origin-left"
                    initial={{ scaleX: 0 }}
                    whileTap={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="relative flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isMobile ? '' : 'group-hover:animate-bounce'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    加入購物車 ({modalQuantity} 件)
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div 
                  className="relative h-48 bg-gray-200 overflow-hidden cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
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
                    <h3 
                      className={`font-medium text-gray-900 cursor-pointer hover:text-amber-600 transition-colors truncate whitespace-nowrap overflow-hidden w-full ${
                        product.name.length > 20 ? 'text-xs' : product.name.length > 15 ? 'text-sm' : 'text-base'
                      }`}
                      onClick={() => handleProductClick(product)}
                      title={product.name.trim()}
                    >
                      {product.name.trim()}
                    </h3>
                    {product.is_new && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex-shrink-0 ml-1">新品</span>
                    )}
                  </div>
                  <p className="text-amber-600 font-bold mt-1 flex items-center">
                    ${product.price}
                    {product.original_price && (
                      <span className="text-gray-400 text-sm line-through ml-2">${product.original_price}</span>
                    )}
                  </p>
                  {product.specification && (
                    <div className="flex justify-between items-center">
                      <p className="text-gray-500 text-xs mt-1 truncate" title={product.specification}>
                        <span className="font-medium">規格:</span> {product.specification}
                      </p>
                      <button 
                        onClick={() => handleProductClick(product)}
                        className="text-amber-600 hover:text-amber-800 text-xs mt-1"
                      >
                        查看
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => addToCart(product)}
                    className={`w-full mt-3 ${
                      isMobile 
                        ? 'bg-amber-200 active:bg-amber-300' // 移動設備使用 active 而非 hover
                        : 'bg-amber-100 hover:bg-amber-200'
                    } text-amber-800 py-2 rounded-md transition-colors flex items-center justify-center group relative overflow-hidden`}
                  >
                    {/* 默認按鈕內容 */}
                    <span className={`relative z-10 flex items-center justify-center transition-opacity duration-200 ${animatingButtons.has(product.id) ? 'opacity-0' : 'opacity-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 ${isMobile ? '' : 'group-hover:animate-bounce'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      加入購物車
                    </span>
                    
                    {/* 按鈕內的動畫 */}
                    {animatingButtons.has(product.id) && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-amber-200 z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: isMobile ? 0.1 : 0.2 }}
                      >
                        <div className="relative h-8 w-10">
                          {/* 購物車圖標顯示 */}
                          <motion.div
                            className="absolute left-0 right-0 mx-auto bottom-0"
                            initial={{ 
                              opacity: 0,
                              y: -10,
                              x: -15
                            }}
                            animate={{ 
                              opacity: 1,
                              y: 0,
                              x: 1
                            }}
                            transition={{ 
                              duration: 0.4,
                              delay: 0.2,
                              ease: "easeOut"
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </motion.div>
                          
                          {/* 麵包圖標動畫 - 放入購物車 */}
                          <motion.div 
                            className="absolute left-0 right-0 mx-auto"
                            initial={{ opacity: 0, y: 0, scale: 1 }}
                            animate={{ 
                              opacity: [0, 1, 1, 0.7],
                              y: [0, -15, 3],
                              scale: [1, 1, 0.7],
                              x: [0, 0, 0]
                            }}
                            transition={{ 
                              duration: 0.8, 
                              times: [0, 0.3, 0.7, 1],
                              ease: "easeInOut",
                              // 延遲0.3秒，等待原按鈕內容完全隱藏
                              delay: 0.3
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C5.5 2 2 5.5 2 9c0 2.3 1.1 4.1 3 5.4V15l1 1v3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3l1-1v-.6c1.9-1.3 3-3.1 3-5.4 0-3.5-3.5-7-10-7zm0 1.5c5.7 0 8.5 2.8 8.5 5.5 0 1.9-1 3.3-2.5 4.3V15l-1 1v3c0 .3-.2.5-.5.5h-9c-.3 0-.5-.2-.5-.5v-3l-1-1v-1.7c-1.5-1-2.5-2.4-2.5-4.3 0-2.7 2.8-5.5 8.5-5.5zM11 6v1H6v1h5v1l3-1.5L11 6z"/>
                            </svg>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
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
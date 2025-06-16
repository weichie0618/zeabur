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
  productImages?: ProductImage[]; // 添加商品圖片陣列
  flavors?: ProductFlavor[]; // 添加商品口味陣列
  product_flavors?: any; // 產品口味設置，如果為null表示必選
  selectedFlavors?: {[key: string]: number}; // 用戶選擇的口味和數量
}

interface ProductFlavor {
  id: number;
  flavor: string;
  productId: number;
}

interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
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
  // 只在組件首次加載時輸出日誌，使用useRef追蹤
  const isFirstRender = React.useRef(true);
  
  // 只在首次渲染時輸出日誌 - 移除生產環境的日誌輸出
  React.useEffect(() => {
    if (isFirstRender.current) {
      // 移除不必要的console.log
      isFirstRender.current = false;
    }
  }, [initialProducts]);
  
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
  // 添加當前顯示圖片索引狀態
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  // 添加時間戳避免圖片快取
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  // 添加口味選擇相關狀態
  const [showFlavorModal, setShowFlavorModal] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<{[key: string]: number}>({});
  const [flavorSelectionRequired, setFlavorSelectionRequired] = useState<boolean>(false);
  const [flavorSelectionError, setFlavorSelectionError] = useState<string>('');

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
    
    // 檢查產品是否有口味選項
    if (product.flavors && product.flavors.length > 0) {
      // 設置當前產品
      setCurrentProduct(product);
      // 判斷口味是否必選
      setFlavorSelectionRequired(product.product_flavors !== undefined);
      // 重置已選口味
      setSelectedFlavors({});
      // 清除錯誤提示
      setFlavorSelectionError('');
      // 顯示口味選擇模態框
      setShowFlavorModal(true);
      return;
    }
    
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
  const removeFromCart = useCallback((productId: number, selectedFlavors?: {[key: string]: number}) => {
    if (selectedFlavors) {
      // 如果提供了 selectedFlavors，則只刪除具有相同 ID 和相同 selectedFlavors 的項目
      const newCart = cart.filter(item => {
        // 如果 ID 不同，保留該項目
        if (item.id !== productId) return true;
        
        // 如果 ID 相同但沒有 selectedFlavors，且刪除的項目有 selectedFlavors，保留該項目
        if (!item.selectedFlavors && selectedFlavors) return true;
        
        // 如果 ID 相同且都有 selectedFlavors，比較 selectedFlavors 是否相同
        if (item.selectedFlavors && selectedFlavors) {
          // 將兩個 selectedFlavors 對象轉換為字符串進行比較
          const itemFlavorsStr = JSON.stringify(item.selectedFlavors);
          const targetFlavorsStr = JSON.stringify(selectedFlavors);
          // 如果 selectedFlavors 不同，保留該項目
          return itemFlavorsStr !== targetFlavorsStr;
        }
        
        // 其他情況下刪除該項目
        return false;
      });
      setCart(newCart);
    } else {
      // 如果沒有提供 selectedFlavors，則刪除所有具有相同 ID 的項目
      const newCart = cart.filter(item => item.id !== productId);
      setCart(newCart);
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
      window.location.href = '/client/bakery/checkout';
    } catch (error) {
      // 替換alert為更友好的錯誤處理
      setError('處理訂單時發生錯誤，請稍後再試');
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
          // 移除不必要的console.log
          setCart(parsedCart);
        }
      }
    } catch (error) {
      // 移除不必要的console.log
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
      // 移除不必要的console.log
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
    // 重置當前圖片索引為0
    setCurrentImageIndex(0);
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

  // 切換到下一張圖片
  const nextImage = useCallback(() => {
    if (!selectedProduct || !selectedProduct.productImages?.length) return;
    
    // 只使用productImages的總數量
    const totalImages = selectedProduct.productImages.length;
    
    setCurrentImageIndex(prevIndex => (prevIndex + 1) % totalImages);
  }, [selectedProduct]);

  // 切換到上一張圖片
  const prevImage = useCallback(() => {
    if (!selectedProduct || !selectedProduct.productImages?.length) return;
    
    // 只使用productImages的總數量
    const totalImages = selectedProduct.productImages.length;
    
    setCurrentImageIndex(prevIndex => (prevIndex - 1 + totalImages) % totalImages);
  }, [selectedProduct]);
  
  // 獲取當前顯示的圖片URL
  const getCurrentImageUrl = useCallback(() => {
    if (!selectedProduct) return '';
    
    // 如果沒有productImages或長度為0，顯示主圖片
    if (!selectedProduct.productImages?.length) {
      // 添加時間戳避免快取
      return `${selectedProduct.images}?t=${timestamp}`;
    }
    
    // 排序productImages按sort字段
    const sortedImages = [...selectedProduct.productImages].sort((a, b) => a.sort - b.sort);
    
    // 從排序後的productImages中獲取，並添加時間戳避免快取
    return `${sortedImages[currentImageIndex]?.imageUrl || selectedProduct.images}?t=${timestamp}`;
  }, [selectedProduct, currentImageIndex, timestamp]);

  // 添加防止圖片快取的函數
  const getImageUrlWithTimestamp = useCallback((url: string) => {
    return `${url}?t=${timestamp}`;
  }, [timestamp]);

  // 添加口味處理函數
  const handleFlavorChange = useCallback((flavor: string, change: number) => {
    // 清除錯誤提示
    setFlavorSelectionError('');
    
    setSelectedFlavors(prev => {
      const currentValue = prev[flavor] || 0;
      const newValue = Math.max(0, currentValue + change);
      
      // 如果數量為0，則從選擇中移除該口味
      if (newValue === 0) {
        const newState = { ...prev };
        delete newState[flavor];
        return newState;
      }
      
      return { ...prev, [flavor]: newValue };
    });
  }, []);

  // 確認口味選擇並加入購物車
  const confirmFlavorSelection = useCallback(() => {
    if (!currentProduct) return;
    
    // 檢查是否有選擇口味（如果必選）
    if (flavorSelectionRequired) {
      // 計算已選擇的口味總數
      const totalSelectedFlavors = Object.values(selectedFlavors).reduce((sum: number, count: number) => sum + count, 0);
      
      // 將product_flavors轉換為數字（如果是字串）
      const requiredFlavors = typeof currentProduct.product_flavors === 'string' ? 
        parseInt(currentProduct.product_flavors, 10) : currentProduct.product_flavors;
      
      // 如果product_flavors是數字或可以轉換為數字，則需要選擇指定數量的口味
      if (typeof requiredFlavors === 'number' && !isNaN(requiredFlavors)) {
        if (totalSelectedFlavors !== requiredFlavors) {
          setFlavorSelectionError(`請選擇總共 ${requiredFlavors} 個口味，您目前選擇了 ${totalSelectedFlavors} 個`);
          return;
        }
      } else if (Object.keys(selectedFlavors).length === 0) {
        // 如果product_flavors不是數字，則至少要選擇一種口味
        setFlavorSelectionError('請至少選擇一種口味');
        return;
      }
    }
    
    // 清除錯誤信息
    setFlavorSelectionError('');
    
    // 將選擇的口味添加到產品中
    const productWithFlavors = {
      ...currentProduct,
      selectedFlavors,
      quantity: 1
    };
    
    // 加入購物車
    setCart(prev => [...prev, productWithFlavors]);
    
    // 關閉口味選擇模態框
    setShowFlavorModal(false);
    setCurrentProduct(null);
  }, [currentProduct, selectedFlavors, flavorSelectionRequired]);

  // 取消口味選擇
  const cancelFlavorSelection = useCallback(() => {
    setShowFlavorModal(false);
    setCurrentProduct(null);
    setSelectedFlavors({});
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
              className="relative bg-white rounded-lg md:max-w-4xl w-full max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-50 bg-white rounded-full p-2 border-2 border-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200"
                onClick={closeModal}
                aria-label="關閉"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* 電腦版水平佈局，手機版垂直佈局 */}
              <div className="flex flex-col md:flex-row">
                {/* 圖片區塊 - 在桌面設備上佔一半寬度 */}
                <div className="md:w-1/2">
                  <div className="relative h-72 md:h-96 bg-gray-100">
                    <Image
                      src={getCurrentImageUrl()}
                      alt={selectedProduct.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="object-cover"
                    />
                    
                    {/* 只有當商品有多張圖片時才顯示導航按鈕 */}
                    {(selectedProduct.productImages && selectedProduct.productImages.length > 1) && (
                      <>
                        {/* 左箭頭 - 上一張圖片 */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-1.5 shadow-md flex items-center justify-center text-amber-600 hover:text-amber-800 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {/* 右箭頭 - 下一張圖片 */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-1.5 shadow-md flex items-center justify-center text-amber-600 hover:text-amber-800 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* 圖片指示器 */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1.5">
                          {/* 所有圖片指示器 */}
                          {selectedProduct.productImages.sort((a, b) => a.sort - b.sort).map((_, idx) => (
                            <button 
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex(idx);
                              }}
                              className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-amber-500 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* 縮略圖畫廊 - 只有當有多張圖片時才顯示 */}
                  {(selectedProduct.productImages && selectedProduct.productImages.length > 1) && (
                    <div className="px-4 py-3 border-b md:border-b-0 border-gray-100">
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {/* 所有圖片縮略圖 */}
                        {selectedProduct.productImages.sort((a, b) => a.sort - b.sort).map((image, idx) => (
                          <button 
                            key={image.id}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                              currentImageIndex === idx ? 'border-amber-500 shadow-md' : 'border-transparent hover:border-gray-300'
                            }`}
                          >
                            <div className="relative w-full h-full">
                              <Image
                                src={getImageUrlWithTimestamp(image.imageUrl)}
                                alt={`${selectedProduct.name} - 圖片 ${idx + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="object-cover"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 商品詳情區塊 - 在桌面設備上佔一半寬度 */}
                <div className="md:w-1/2 p-6">
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
                  
                  {/* 口味選擇區塊 - 只有當商品有口味選項時顯示 */}
                  {selectedProduct.flavors && selectedProduct.flavors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        口味選擇 
                        {(() => {
                          // 將product_flavors轉換為數字（如果是字串）
                          const requiredFlavors = typeof selectedProduct.product_flavors === 'string' ? 
                            parseInt(selectedProduct.product_flavors, 10) : selectedProduct.product_flavors;
                          
                          if (typeof requiredFlavors === 'number' && !isNaN(requiredFlavors)) {
                            return <span className="text-red-500 text-xs ml-1">(必選{requiredFlavors}個)</span>;
                          } else if (selectedProduct.product_flavors !== undefined) {
                            return <span className="text-red-500 text-xs ml-1">(必選)</span>;
                          }
                          return null;
                        })()}
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                        <div className="space-y-2">
                          {selectedProduct.flavors.map((flavor) => (
                            <div key={flavor.id} className="flex justify-between items-center">
                              <span className="text-gray-700">{flavor.flavor}</span>
                              <div className="flex items-center">
                                <button 
                                  onClick={() => handleFlavorChange(flavor.flavor, -1)}
                                  className="w-7 h-7 rounded-l-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center border border-amber-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <div className="w-8 h-7 flex items-center justify-center border-t border-b border-amber-200 bg-white text-gray-800 font-medium text-sm">
                                  {selectedFlavors[flavor.flavor] || 0}
                                </div>
                                <button 
                                  onClick={() => handleFlavorChange(flavor.flavor, 1)}
                                  className="w-7 h-7 rounded-r-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center border border-amber-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                                              {(() => {
                        // 將product_flavors轉換為數字（如果是字串）
                        const requiredFlavors = typeof selectedProduct.product_flavors === 'string' ? 
                          parseInt(selectedProduct.product_flavors, 10) : selectedProduct.product_flavors;
                        
                        if (typeof requiredFlavors === 'number' && !isNaN(requiredFlavors)) {
                          const totalSelected = Object.values(selectedFlavors).reduce((sum: number, count: number) => sum + count, 0);
                          return (
                            <div className="mt-3 text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                              已選擇: {totalSelected} / {requiredFlavors} 個
                            </div>
                          );
                        }
                        return null;
                      })()}
                        
                        {/* 錯誤提示 */}
                        {flavorSelectionError && (
                          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>{flavorSelectionError}</span>
                            </div>
                          </div>
                        )}
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
                      // 檢查是否有口味選項
                      if (selectedProduct.flavors && selectedProduct.flavors.length > 0) {
                        // 計算已選擇的口味總數
                        const totalSelectedFlavors = Object.values(selectedFlavors).reduce((sum: number, count: number) => sum + count, 0);
                        
                        // 將product_flavors轉換為數字（如果是字串）
                        const requiredFlavors = typeof selectedProduct.product_flavors === 'string' ? 
                          parseInt(selectedProduct.product_flavors, 10) : selectedProduct.product_flavors;
                        
                        // 檢查是否必選且未選擇
                        if (typeof requiredFlavors === 'number' && !isNaN(requiredFlavors)) {
                          if (totalSelectedFlavors !== requiredFlavors) {
                            setFlavorSelectionError(`請選擇總共 ${requiredFlavors} 個口味，您目前選擇了 ${totalSelectedFlavors} 個`);
                            return;
                          }
                        } else if (selectedProduct.product_flavors !== undefined && Object.keys(selectedFlavors).length === 0) {
                          setFlavorSelectionError('請至少選擇一種口味');
                          return;
                        }
                        
                        // 清除錯誤信息
                        setFlavorSelectionError('');
                        
                        // 將選擇的口味添加到產品中
                        const productWithFlavors = {
                          ...selectedProduct,
                          selectedFlavors,
                          quantity: modalQuantity
                        };
                        
                        // 加入購物車
                        const existingItemIndex = cart.findIndex(item => 
                          item.id === selectedProduct.id && 
                          JSON.stringify(item.selectedFlavors) === JSON.stringify(selectedFlavors)
                        );
                        
                        if (existingItemIndex >= 0) {
                          // 如果已有相同口味組合的產品，增加數量
                          const newCart = [...cart];
                          newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + modalQuantity;
                          setCart(newCart);
                        } else {
                          // 否則添加新產品
                          setCart([...cart, productWithFlavors]);
                        }
                      } else {
                        // 無口味選項，正常加入購物車
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
                    src={getImageUrlWithTimestamp(product.images)}
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

      {/* 口味選擇模態框 */}
      <AnimatePresence>
        {showFlavorModal && currentProduct && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelFlavorSelection}
          >
            <motion.div 
              className="relative bg-white rounded-lg max-w-md w-full overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    請選擇口味
                  </h3>
                  <button 
                    onClick={cancelFlavorSelection}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {currentProduct.name}
                    {(() => {
                      // 將product_flavors轉換為數字（如果是字串）
                      const requiredFlavors = typeof currentProduct.product_flavors === 'string' ? 
                        parseInt(currentProduct.product_flavors, 10) : currentProduct.product_flavors;
                      
                      if (typeof requiredFlavors === 'number' && !isNaN(requiredFlavors)) {
                        return <span className="text-red-500 ml-1">(必選{requiredFlavors}個)</span>;
                      } else if (currentProduct.product_flavors !== undefined) {
                        return <span className="text-red-500 ml-1">(必選)</span>;
                      }
                      return null;
                    })()}
                  </p>
                  <div className="h-px bg-gray-200 w-full my-2"></div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {currentProduct.flavors?.map((flavor) => (
                    <div key={flavor.id} className="flex justify-between items-center">
                      <span className="text-gray-700">{flavor.flavor}</span>
                      <div className="flex items-center">
                        <button 
                          onClick={() => handleFlavorChange(flavor.flavor, -1)}
                          className="w-8 h-8 rounded-l-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center border border-amber-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="w-10 h-8 flex items-center justify-center border-t border-b border-amber-200 bg-white text-gray-800 font-medium">
                          {selectedFlavors[flavor.flavor] || 0}
                        </div>
                        <button 
                          onClick={() => handleFlavorChange(flavor.flavor, 1)}
                          className="w-8 h-8 rounded-r-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center border border-amber-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(() => {
                    // 將product_flavors轉換為數字（如果是字串）
                    const requiredFlavors = typeof currentProduct.product_flavors === 'string' ? 
                      parseInt(currentProduct.product_flavors, 10) : currentProduct.product_flavors;
                    
                    if (typeof requiredFlavors === 'number' && !isNaN(requiredFlavors)) {
                      const totalSelected = Object.values(selectedFlavors).reduce((sum: number, count: number) => sum + count, 0);
                      return (
                        <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                          已選擇: {totalSelected} / {requiredFlavors} 個
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* 錯誤提示 */}
                  {flavorSelectionError && (
                    <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {flavorSelectionError}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={cancelFlavorSelection}
                    className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={confirmFlavorSelection}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                  >
                    確認
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 
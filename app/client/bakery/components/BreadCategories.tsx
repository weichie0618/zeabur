'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface Category {
  id: number;
  name: string;
  value: string;
  status?: string;
}

interface BreadCategoriesProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const BreadCategories: React.FC<BreadCategoriesProps> = ({
  categories,
  activeCategory,
  setActiveCategory
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 處理滾動按鈕
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 確保分類顯示正確
  const getCategoryDisplayName = (category: Category) => {
    // 清理可能的尾隨空白
    return category.name.trim();
  };

  // 過濾掉包含「全部商品」或類似全部字樣的分類
  const filteredCategories = categories.filter(category => {
    const name = category.name.trim().toLowerCase();
    return category.status === 'active' && 
           !name.includes('全部') && 
           !name.includes('all');
  });

  return (
    <section className="py-2 relative">
      {/* 滾動按鈕 - 僅在非移動設備上顯示 */}
      <div className="hidden md:block">
        <button 
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-amber-600 p-1 rounded-full shadow-md"
          aria-label="向左滾動"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-amber-600 p-1 rounded-full shadow-md"
          aria-label="向右滾動"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 水平滾動容器 - 增加左右內邊距 */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide py-2 px-6 md:px-10 -mx-1 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 隱藏滾動條的樣式 */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* 手動添加一個"全部商品"按鈕 */}
        <motion.div
          key="all"
          className={`flex-shrink-0 snap-start mx-2 px-5 py-2 rounded-full border ${
            activeCategory === 'all' 
              ? 'bg-amber-500 text-white border-amber-500' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
          } transition-colors cursor-pointer`}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.3 }}
          onClick={() => {
            // 設置為全部顯示
            setActiveCategory('all');
            // 設置標記，表示這是用戶主動觸發的類別變更
            sessionStorage.setItem('userTriggeredCategoryChange', 'true');
          }}
        >
          <span className="whitespace-nowrap font-medium">全部商品</span>
        </motion.div>

        {/* 顯示過濾後的分類，排除掉全部商品 */}
        {filteredCategories.map((category, index) => (
          <motion.div
            key={category.id}
            className={`flex-shrink-0 snap-start mx-2 px-5 py-2 rounded-full border ${
              activeCategory === category.id.toString() 
                ? 'bg-amber-500 text-white border-amber-500' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
            } transition-colors cursor-pointer`}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (index + 1), duration: 0.3 }}
            onClick={() => {
              // 傳遞分類ID作為字符串
              setActiveCategory(category.id.toString());
              // 設置標記，表示這是用戶主動觸發的類別變更
              sessionStorage.setItem('userTriggeredCategoryChange', 'true');
            }}
          >
            <span className="whitespace-nowrap font-medium">{getCategoryDisplayName(category)}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}; 
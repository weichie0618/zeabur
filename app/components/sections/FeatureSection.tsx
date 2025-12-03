'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

// 產品資料
const featuredProducts = [
  {
    id: 1,
    name: '牛奶棒系列',
    images: [
      'https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/巧克力牛奶棒.jpg',
      'https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/芋頭牛奶棒.jpg',
      'https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/圖片s10.jpg',
    ],
    tagline: "milk stick series",
    title: '牛奶棒系列',
    description: '濃郁的牛奶香氣，搭配精選巧克力與芋頭，每一口都是滿滿的幸福。外層酥脆，內層柔軟，是下午茶的最佳選擇。',
    gradient: 'from-amber-100 via-orange-50 to-yellow-50',
    cardGradient: 'from-amber-200 to-orange-100',
    accentColor: 'bg-amber-100',
    textAccent: 'text-amber-800',
  },
  {
    id: 2,
    name: '小吐司系列',
    images: [
      'https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/圖片1.jpg',
      'https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/圖片9.jpg',
      'https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/圖片3.jpg',
    ],
    tagline: "small toast series",
    title: '小吐司系列',
    description: '小巧可愛的吐司，搭配精選巧克力與芋頭，每一口都是滿滿的幸福。外層酥脆，內層柔軟，是下午茶的最佳選擇。',
    gradient: 'from-yellow-100 via-amber-50 to-orange-50',
    cardGradient: 'from-yellow-200 to-amber-100',
    accentColor: 'bg-yellow-100',
    textAccent: 'text-yellow-800',
  },
//   {
//     id: 3,
//     emoji: '🍞',
//     name: '酸種吐司',
//     tagline: 'ARTISAN',
//     title: '職人手作',
//     description: '使用自家培養超過百年的酸種酵母，結合精選有機麵粉。獨特的微酸風味與綿密的質地，是健康早餐的最佳選擇。',
//     stats: [
//       { label: '酵母年齡', value: '100+ 年', highlight: true },
//       { label: '發酵方式', value: '天然酸種' },
//       { label: '麵粉類型', value: '有機石磨' },
//     ],
//     gradient: 'from-stone-100 via-amber-50 to-orange-50',
//     cardGradient: 'from-stone-200 to-amber-50',
//     accentColor: 'bg-stone-100',
//     textAccent: 'text-stone-800',
//   },
//   {
//     id: 4,
//     emoji: '🧁',
//     name: '抹茶紅豆麵包',
//     tagline: 'SEASONAL',
//     title: '季節限定',
//     description: '嚴選京都宇治抹茶，搭配北海道十勝紅豆。茶香與豆香交織，微苦回甘的滋味讓人一吃就愛上。',
//     stats: [
//       { label: '每日限量', value: '30 個', highlight: true },
//       { label: '抹茶產地', value: '京都宇治' },
//       { label: '紅豆產地', value: '北海道十勝' },
//     ],
//     gradient: 'from-green-100 via-emerald-50 to-teal-50',
//     cardGradient: 'from-green-200 to-emerald-100',
//     accentColor: 'bg-green-100',
//     textAccent: 'text-green-800',
//   },
];

interface FeatureSectionProps {
  scrollProgress?: number;
}

export default function FeatureSection({ scrollProgress = 0 }: FeatureSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // 系列產品的主要圖片索引
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const currentProduct = featuredProducts[currentIndex];
  
  // 當滾動進度超過 5% 時才顯示頂部裝飾（降低閾值以便更早顯示）
  // scrollProgress 範圍是 0-1，當 HeaderSection 開始被覆蓋時就會 > 0
  const showTopDecoration = scrollProgress > 0.05;
  
  // 檢查當前產品是否為系列產品（有多張圖片）
  const isSeriesProduct = currentProduct.images && currentProduct.images.length > 1;
  
  // 當產品切換時，重置主要圖片索引
  useEffect(() => {
    setMainImageIndex(0);
  }, [currentIndex]);
  
  // 處理預覽圖點擊
  const handleThumbnailClick = (index: number) => {
    setMainImageIndex(index);
  };

  // 自動輪播產品
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [currentIndex]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  // 動畫變體
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  return (
    <section 
      className="relative overflow-hidden max-md:max-h-[600px] max-[620px]:min-h-[600px]"
      style={{ height: '90vh', minHeight: '500px' }}
    >
      {/* 頂部裝飾 - 拖曳把手視覺提示（僅在滾動時顯示） */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-20 z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: showTopDecoration ? 1 : 0,
        }}
        transition={{ 
          duration: 0.3,
          ease: 'easeOut'
        }}
      >
        {/* 頂部圓角裝飾已由 CSS 處理 */}
        {/* 橙色漸層裝飾線 - 僅在滾動時顯示 */}
        {showTopDecoration && (
          <motion.div
            className="feature-top-decoration-line"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ 
              duration: 0.4,
              ease: 'easeOut',
              delay: 0.1
            }}
          />
        )}
      </motion.div>

      {/* 動態背景 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          className={`absolute inset-0 bg-gradient-to-br ${currentProduct.gradient}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle, var(--sunny-orange) 0%, transparent 60%)`,
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div 
          className="absolute -bottom-1/3 -left-1/4 w-2/3 h-2/3 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, var(--sunny-gold) 0%, transparent 60%)`,
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 主要內容 */}
      <div className="relative h-full container mx-auto px-4 md:px-8 lg:px-20 flex items-center">
        <div className="w-full grid grid-cols-2 max-[620px]:grid-cols-1 max-[620px]:flex max-[620px]:flex-col gap-6 max-[620px]:gap-4 lg:gap-12 items-center">
          
          {/* 左側 - 產品卡片 */}
          <div className={`flex justify-center max-[620px]:w-full ${isSeriesProduct ? 'lg:justify-start' : 'lg:justify-end'} order-1 lg:order-1`}>
            <div className="relative w-full" style={{ perspective: '1000px' }}>
              <AnimatePresence mode="wait" custom={direction}>
                {/* 系列產品：主要圖 + 預覽圖 */}
                {isSeriesProduct && currentProduct.images ? (
                  <motion.div
                    key={`series-${currentProduct.id}`}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.3 },
                      rotateY: { duration: 0.4 },
                    }}
                    className="relative w-full flex flex-col items-center gap-4 sm:gap-6"
                  >
                    {/* 手機版：左側垂直預覽圖 + 右側主要圖 */}
                    {/* 桌面版：上方主要圖 + 下方預覽圖 */}
                    <div className="w-full flex flex-col md:flex-col gap-3 sm:gap-4">
                      {/* 手機版：橫向排列（預覽圖在左，主要圖在右） */}
                      <div className="flex md:hidden flex-row gap-3 items-start">
                        {/* 預覽圖列表 - 垂直排列 */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          {currentProduct.images.map((imageUrl, idx) => (
                            <motion.button
                              key={`thumb-mobile-${idx}`}
                              onClick={() => handleThumbnailClick(idx)}
                              className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                                idx === mainImageIndex
                                  ? 'border-sunny-orange shadow-md shadow-sunny-orange/50 scale-105'
                                  : 'border-gray-200 hover:border-sunny-orange/50 opacity-70 hover:opacity-100'
                              }`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: idx === mainImageIndex ? 1 : 0.7, x: 0 }}
                              transition={{ 
                                duration: 0.3,
                                delay: idx * 0.05 
                              }}
                              whileHover={{ scale: idx === mainImageIndex ? 1.05 : 1.02 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Image
                                src={imageUrl}
                                alt={`${currentProduct.name} 預覽 ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                              {/* 選中狀態指示器 */}
                              {idx === mainImageIndex && (
                                <motion.div
                                  className="absolute inset-0 bg-sunny-orange/20"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </motion.button>
                          ))}
                        </div>

                        {/* 主要圖片 - 手機版 */}
                        <motion.div
                          className={`relative flex-1 h-48 bg-gradient-to-br ${currentProduct.cardGradient} rounded-xl shadow-xl overflow-hidden`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          {/* 裝飾圓圈 */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/30 rounded-full blur-lg" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/20 rounded-full blur-lg" />
                          </div>
                          
                          {/* 主要圖片 */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`main-mobile-${mainImageIndex}`}
                              className="relative w-full h-full p-3"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Image
                                src={currentProduct.images[mainImageIndex]}
                                alt={`${currentProduct.name} - ${mainImageIndex + 1}`}
                                fill
                                className="object-contain rounded-lg"
                                priority={currentIndex === 0 && mainImageIndex === 0}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                      </div>

                      {/* 桌面版：上方主要圖 + 下方預覽圖 */}
                      <div className="hidden md:flex flex-col gap-4">
                        {/* 主要圖片 - 桌面版 */}
                        <motion.div
                          className={`relative w-full h-64 lg:h-80 xl:h-96 bg-gradient-to-br ${currentProduct.cardGradient} rounded-2xl shadow-2xl overflow-hidden`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          {/* 裝飾圓圈 */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/30 rounded-full blur-xl" />
                            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/20 rounded-full blur-xl" />
                          </div>
                          
                          {/* 主要圖片 */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`main-desktop-${mainImageIndex}`}
                              className="relative w-full h-full p-4 sm:p-6 md:p-8"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Image
                                src={currentProduct.images[mainImageIndex]}
                                alt={`${currentProduct.name} - ${mainImageIndex + 1}`}
                                fill
                                className="object-contain rounded-xl"
                                priority={currentIndex === 0 && mainImageIndex === 0}
                              />
                            </motion.div>
                          </AnimatePresence>

                          {/* 裝飾光暈 */}
                          <motion.div 
                            className="absolute -right-4 -bottom-4 w-32 h-32 md:w-40 md:h-40 bg-sunny-orange/20 rounded-full blur-2xl" 
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        </motion.div>

                        {/* 預覽圖列表 - 桌面版水平排列 */}
                        <div className="flex items-center justify-center gap-2 lg:gap-3 w-full overflow-x-auto pb-2">
                          {currentProduct.images.map((imageUrl, idx) => (
                            <motion.button
                              key={`thumb-desktop-${idx}`}
                              onClick={() => handleThumbnailClick(idx)}
                              className={`relative flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                                idx === mainImageIndex
                                  ? 'border-sunny-orange shadow-lg shadow-sunny-orange/50 scale-110'
                                  : 'border-gray-200 hover:border-sunny-orange/50 opacity-70 hover:opacity-100'
                              }`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: idx === mainImageIndex ? 1 : 0.7, y: 0 }}
                              transition={{ 
                                duration: 0.3,
                                delay: idx * 0.05 
                              }}
                              whileHover={{ scale: idx === mainImageIndex ? 1.1 : 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Image
                                src={imageUrl}
                                alt={`${currentProduct.name} 預覽 ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                              {/* 選中狀態指示器 */}
                              {idx === mainImageIndex && (
                                <motion.div
                                  className="absolute inset-0 bg-sunny-orange/20"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* 單品項產品：單個 card */
                  <motion.div
                    key={currentProduct.id}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.3 },
                      rotateY: { duration: 0.4 },
                    }}
                    className="relative"
                  >
                    {/* 產品卡片 */}
                    <div 
                      className={`relative w-48 h-60 sm:w-56 sm:h-72 md:w-64 md:h-80 bg-gradient-to-br ${currentProduct.cardGradient} rounded-[2rem] flex items-center justify-center shadow-2xl overflow-hidden`}
                    >
                      {/* 裝飾圓圈 */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/30 rounded-full blur-sm" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/20 rounded-full blur-sm" />
                      </div>
                      
                      {/* 產品內容 */}
                      <div className="relative text-center space-y-3 p-4 w-full h-full flex flex-col items-center justify-center">
                        {/* 單品項產品：顯示單張圖片或 emoji */}
                        <motion.div 
                          className={`relative ${(currentProduct as any).image ? 'w-full h-3/4' : 'text-6xl sm:text-7xl md:text-8xl'}`}
                          animate={{ 
                            y: [0, -8, 0],
                            rotate: [0, 2, -2, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          style={{
                            filter: (currentProduct as any).image ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
                          }}
                        >
                          {(currentProduct as any).image ? (
                            <Image
                              src={(currentProduct as any).image}
                              alt={currentProduct.name}
                              fill
                              className="object-contain rounded-xl"
                              priority={currentIndex === 0}
                            />
                          ) : (
                            <span>{(currentProduct as any).emoji || ''}</span>
                          )}
                        </motion.div>
                        <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800 tracking-wide">
                          {currentProduct.name}
                        </p>
                      </div>
                    </div>

                    {/* 裝飾光暈 */}
                    <div className="absolute -right-3 -bottom-3 w-20 h-20 md:w-28 md:h-28 bg-sunny-orange/20 rounded-full blur-lg" />
                    <div className="absolute -left-4 -top-4 w-14 h-14 md:w-20 md:h-20 bg-sunny-gold/30 rounded-full blur-lg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 右側 - 產品資訊 */}
          <div className="order-2 lg:order-2 max-[620px]:w-full lg:pl-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentProduct.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                }}
                className="space-y-4 md:space-y-5"
              >
                {/* 標籤 */}
                <motion.div 
                  className={`inline-block px-3 py-1.5 ${currentProduct.accentColor} rounded-full`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className={`text-xs sm:text-sm font-bold ${currentProduct.textAccent} tracking-wider`}>
                    ✨ {currentProduct.tagline}
                  </span>
                </motion.div>

                {/* 標題 */}
                <motion.h2 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-sunny-dark leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {currentProduct.title}
                </motion.h2>

                {/* 描述 */}
                <motion.p 
                  className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed line-clamp-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentProduct.description}
                </motion.p>

                {/* CTA */}
                <motion.div 
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 導航控制 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* 上一個 */}
        <button
          onClick={goToPrev}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
          aria-label="上一個產品"
        >
          <ChevronLeft className="w-5 h-5 text-sunny-dark" />
        </button>

        {/* 進度指示器 */}
        <div className="flex gap-2">
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-sunny-orange' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`前往第 ${index + 1} 個產品`}
            />
          ))}
        </div>

        {/* 下一個 */}
        <button
          onClick={goToNext}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
          aria-label="下一個產品"
        >
          <ChevronRight className="w-5 h-5 text-sunny-dark" />
        </button>
      </div>

      {/* 計數器與暫停按鈕 */}
      <div className="absolute top-6 right-6 md:right-12 z-20 flex items-center gap-3">
        {/* 計數器 */}
        <div className="flex items-baseline gap-1 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span className="text-2xl font-black text-sunny-orange">
            {String(currentIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-400">
            {String(featuredProducts.length).padStart(2, '0')}
          </span>
        </div>
        
        {/* 暫停/播放按鈕 */}
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
          aria-label={isAutoPlaying ? '暫停輪播' : '播放輪播'}
        >
          {isAutoPlaying ? (
            <Pause className="w-5 h-5 text-sunny-dark" />
          ) : (
            <Play className="w-5 h-5 text-sunny-dark" />
          )}
        </button>
      </div>

      {/* 自動播放指示器 */}
      {isAutoPlaying && (
        <motion.div 
          className="absolute bottom-0 left-0 h-1 bg-sunny-orange z-20"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          key={currentIndex}
        />
      )}

     
    </section>
  );
}

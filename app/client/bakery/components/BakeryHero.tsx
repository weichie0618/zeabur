'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// 引入 Swiper 樣式
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// 輪播資料
const slides = [
  {
    id: 1,
    title: '專業烘焙技術',
    subtitle: '嚴選優質原料,純粹的美味',
    description: '新鮮出爐的幸福滋味，為您帶來最純粹的美味體驗，每一口都是幸福的滋味。',
    bgColor: 'from-amber-50 to-orange-100',
    textColor: 'text-amber-900',
    image: '🥖',
    buttonText: '立即選購',
    buttonAction: 'shop'
  },
  {
    id: 2,
    title: '點數回饋系統',
    subtitle: '購物享回饋，點數當現金',
    description: '每次購物享10%點數回饋，1點可折抵1元。點數無使用期限，讓您的每次消費都更有價值。',
    bgColor: 'from-green-50 to-emerald-100',
    textColor: 'text-green-900',
    image: '⭐',
    buttonText: '了解更多',
    buttonAction: 'points'
  },
  {
    id: 3,
    title: '專業配送服務',
    subtitle: '新鮮直送到府',
    description: '本島低溫宅配，滿1500元免運費\n自取免運\n地址：桃園市蘆竹區油管路一段696號',
    bgColor: 'from-blue-50 to-cyan-100',
    textColor: 'text-blue-900',
    image: '🚚',
    buttonText: '查看配送',
    buttonAction: 'delivery'
  }
];

export const BakeryHero: React.FC = () => {
  const [showPointsModal, setShowPointsModal] = useState(false);

  // 按鈕動作處理
  const handleButtonAction = (action: string) => {
    switch (action) {
      case 'shop':
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
          window.scrollTo({
            top: productsSection.offsetTop - 100,
            behavior: 'smooth'
          });
        }
        break;
      case 'points':
        setShowPointsModal(true);
        break;
    
    }
  };

  return (
    <div className="space-y-0">
      {/* 主輪播區域 */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={true}
          className="h-full"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className={`h-full bg-gradient-to-r ${slide.bgColor} relative overflow-hidden`}>
                {/* 背景裝飾 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 right-10 text-8xl">{slide.image}</div>
                  <div className="absolute bottom-10 left-10 text-6xl opacity-50">{slide.image}</div>
                  <div className="absolute top-1/2 left-1/3 text-4xl opacity-30">{slide.image}</div>
                </div>
                
                <div className="relative h-full flex items-center">
                  <div className="container mx-auto px-6">
                    <div className="max-w-2xl">
                      <div className={`flex flex-col justify-between h-80 ${slide.textColor}`}>
                        {/* 標題區域 - 固定高度 */}
                        <div className="space-y-2 h-20 flex flex-col justify-start">
                          <h1 className="text-4xl md:text-6xl font-bold leading-tight line-clamp-2">
                            {slide.title}
                          </h1>
                          <h2 className="text-xl md:text-2xl font-medium opacity-90 line-clamp-1">
                            {slide.subtitle}
                          </h2>
                        </div>
                        
                        {/* 描述區域 - 固定高度 */}
                        <div className="h-24 flex items-start">
                          <p className="text-lg opacity-80 max-w-md line-clamp-3 leading-relaxed">
                            {slide.description}
                          </p>
                        </div>
                        
                        {/* 按鈕區域 - 固定高度 */}
                        <div className="h-10 flex items-center">
                          {slide.buttonAction !== 'delivery' ? (
                            <button 
                              onClick={() => handleButtonAction(slide.buttonAction)}
                              className="bg-white text-gray-800 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                            >
                              {slide.buttonText}
                            </button>
                          ) : (
                            <div className="h-12"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
      

        {/* 輪播指示器 */}
        <div className="swiper-pagination absolute bottom-6 left-1/2 -translate-x-1/2 z-10"></div>
      </div>

      {/* 快速導航欄 - 重新設計為一列一列顯示 */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="space-y-3">
            

            {/* 第三列：點數回饋資訊 */}
            <div className="flex items-center ">
              <div className="text-orange-600 font-medium text-sm">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 01.894.553l1.382 2.8 3.09.45a1 1 0 01.554 1.706l-2.236 2.18.528 3.08a1 1 0 01-1.45 1.054L10 12.347l-2.762 1.456a1 1 0 01-1.45-1.054l.528-3.08-2.236-2.18a1 1 0 01.554-1.706l3.09-.45L9.106 2.553A1 1 0 0110 2z" />
                  </svg>
                  購買結帳完成後回饋點數10%
                </span>
              </div>
            </div>

            {/* 第四列：點數使用資訊 */}
            <div className="flex items-center ">
              <div className="text-orange-600 font-medium text-sm">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 01.894.553l1.382 2.8 3.09.45a1 1 0 01.554 1.706l-2.236 2.18.528 3.08a1 1 0 01-1.45 1.054L10 12.347l-2.762 1.456a1 1 0 01-1.45-1.054l.528-3.08-2.236-2.18a1 1 0 01.554-1.706l3.09-.45L9.106 2.553A1 1 0 0110 2z" />
                  </svg>
                  1點數可於結帳時折抵1元
                </span>
              </div>
            </div>

            {/* 第五列：運費資訊 */}
            <div className="flex items-center ">
              <div className="text-orange-600 font-medium text-sm">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 01.894.553l1.382 2.8 3.09.45a1 1 0 01.554 1.706l-2.236 2.18.528 3.08a1 1 0 01-1.45 1.054L10 12.347l-2.762 1.456a1 1 0 01-1.45-1.054l.528-3.08-2.236-2.18a1 1 0 01.554-1.706l3.09-.45L9.106 2.553A1 1 0 0110 2z" />
                  </svg>
                  滿1500免運
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* 點數詳情模態視窗 */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">點數回饋系統</h3>
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">如何獲得點數</h4>
                  <p className="text-green-700 text-sm">每次購物完成後，系統自動給予消費金額10%的點數回饋</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">如何使用點數</h4>
                  <p className="text-blue-700 text-sm">結帳時可選擇使用點數，1點可折抵1元，無使用期限</p>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">點數查詢</h4>
                  <p className="text-amber-700 text-sm">登入LINE後可在頁面頂部查看點數餘額，或前往點數商城查看詳細記錄</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPointsModal(false);
                    window.location.href = '/client/bakery/points';
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  前往點數商城
                </button>
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}; 
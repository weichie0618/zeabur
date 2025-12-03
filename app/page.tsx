'use client';

import { useRef, useEffect, useState } from 'react';
import { Navbar } from '@/app/components/sections/Navbar';
import HeaderSection from '@/app/components/sections/HeaderSection';
import FeatureSection from '@/app/components/sections/FeatureSection';
import NewsSection from '@/app/components/sections/NewsSection';
import StoreLocatorSection from '@/app/components/sections/StoreLocatorSection';
import CTASection from '@/app/components/sections/CTASection';
import { Footer } from '@/app/components/layout/Footer';
import { Wheat, Shield, Award, Sparkles, ChefHat, Clock } from 'lucide-react';

export default function Home() {
  const headerRef = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 監聽滾動進度，用於視差效果
  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;
      
      const headerRect = headerRef.current.getBoundingClientRect();
      const headerHeight = headerRect.height;
      
      // 計算滾動進度 (0-1)
      // 當 header 完全在視口內時為 0，完全滾出時為 1
      const progress = Math.max(0, Math.min(1, -headerRect.top / headerHeight));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Navbar />

      <main>
        {/* ==================== STICKY HERO CONTAINER ==================== */}
        {/* 這個容器讓 HeaderSection 固定，FeatureSection 滑上覆蓋 */}
        <div className="hero-sticky-container">
          {/* ==================== HERO SECTION (Sticky Background) ==================== */}
          <div 
            ref={headerRef}
            className="hero-sticky"
            style={{
              // 視差效果：Header 微微縮小和變暗
              transform: `scale(${1 + scrollProgress * 0.05})`,
              filter: `brightness(${1 - scrollProgress * 0.2})`,
            }}
          >
          <HeaderSection />
        </div>

          {/* ==================== FEATURED PRODUCT SECTION (Slide-up Overlay) ==================== */}
          <div 
            ref={featureRef}
            className="feature-slide-up"
          >
            <FeatureSection scrollProgress={scrollProgress} />
          </div>
        </div>

        {/* ==================== NEWS SECTION ==================== */}
        <NewsSection />

        {/* 優化版 Wave Divider - 絕對定位，不佔據空間 */}
      <div className="relative bottom-[-80px]">
        {/* 波浪 SVG - 絕對定位，不佔據空間 */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          {/* 漸層過渡層 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/20 to-amber-100/30 h-20" />
          
          <svg 
            className="w-full h-24 md:h-32 relative z-10" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="newsWaveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F36C21" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#FFD700" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="newsWaveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#F36C21" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            {/* SVG 漸層定義 */}
            
            {/* 第一層波浪 - 更柔和的曲線，向下移動 */}
            <path 
              d="M0,70 Q300,120 600,70 T1200,70 L1200,0 L0,0 Z" 
              fill="url(#newsWaveGradient1)"
            />
            {/* 第二層波浪 - 與 FeatureSection 漸層呼應，向下移動 */}
            <path 
              d="M0,90 Q300,50 600,90 T1200,90 L1200,0 L0,0 Z" 
              fill="url(#newsWaveGradient2)"
            />
          </svg>
        </div>
      </div>

       

       

        {/* ==================== STORE LOCATOR ==================== */}
        <StoreLocatorSection />

         {/* 優化版 Wave Divider - Store 到 CTA 過渡，幾何三角形設計，絕對定位不佔據空間 */}
      <div className="relative bottom-[-100px]">
        {/* 幾何三角形 SVG - 絕對定位，不佔據空間 */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          {/* 漸層過渡層 - 從 amber 漸進到 CTA 的淺色背景 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-200/40 to-orange-100/50 h-20" />
          
          <svg 
            className="w-full h-28 md:h-36 relative z-10" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="storeToCtaGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#FED7AA" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="storeToCtaGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* 幾何三角形圖案 - 上層 - 淺琥珀色，向下延伸 */}
            <polygon
              points="0,0 0,45 100,65 200,40 300,75 400,45 500,80 600,50 700,85 800,55 900,90 1000,60 1100,95 1200,70 1200,0"
              fill="url(#storeToCtaGrad1)"
            />
            {/* 幾何三角形圖案 - 下層 - 淺橙色，向下延伸 */}
            <polygon
              points="0,0 0,25 150,45 300,20 450,50 600,25 750,55 900,30 1050,60 1200,40 1200,0"
              fill="url(#storeToCtaGrad2)"
            />
            {/* 頂部裝飾線 - 使用更明顯的顏色 */}
            <line x1="0" y1="15" x2="1200" y2="15" stroke="#FCD34D" strokeOpacity="0.4" strokeWidth="2" />
            <line x1="0" y1="8" x2="1200" y2="8" stroke="#FED7AA" strokeOpacity="0.45" strokeWidth="1" />
          </svg>
        </div>
      </div>

        {/* ==================== CTA SECTION ==================== */}
        <CTASection />
      </main>

      <Footer />
    </>
  );
}

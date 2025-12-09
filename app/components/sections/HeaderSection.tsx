'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import { Play, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function HeaderSection() {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visibleImages, setVisibleImages] = useState<number[]>([]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // 手機版圖片陣列（去背圖片）
  const mobileImages = [
    {
      src: "https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/2024-10-25.jpg",
      isTransparent: false, // JPG 圖片
    },
    {
      src: "https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/未命名設計-1.png",
      isTransparent: true, // PNG 去背圖片
    },
    {
      src: "https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/玫瑰玫瑰鹽可頌去背-scaled.png",
      isTransparent: true, // PNG 去背圖片
    },
    {
      src: "https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/晴朗家LOGO-1712x1044-03.jpg",
      isTransparent: false, // JPG 圖片
    },
    {
      src: "https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/2024-10-25.jpg",
      isTransparent: false, // JPG 圖片（重複使用以達到6張）
    },
    {
      src: "https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/LINE_ALBUM_晴朗家烘焙-蘆竹奉化_241223_4.jpg",
      isTransparent: false, // JPG 圖片
    },
  ];

  // 定義圖片顯示順序
  const imageOrder = [
    3, // 晴朗家LOGO-1712x1044-03.jpg (立即顯示)
    5, // LINE_ALBUM_晴朗家烘焙-蘆竹奉化_241223_4.jpg (立即顯示)
    0, // 2024-10-25.jpg (3秒後)
    1, // 未命名設計-1.png (6秒後)
    2, // 玫瑰玫瑰鹽可頌去背-scaled.png (9秒後)
    4, // 2024-10-25.jpg (12秒後)
  ];

  // 控制圖片顯示時間
  useEffect(() => {
    // 立即顯示前兩張圖片
    setVisibleImages([imageOrder[0], imageOrder[1]]);

    // 每3秒顯示下一張圖片
    const timers = imageOrder.slice(2).map((_, index) => {
      return setTimeout(() => {
        setVisibleImages((prev) => [...prev, imageOrder[index + 2]]);
      }, 3000 + (index * 3000));
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden pb-12 md:pb-20">
      {/* Video Background - Desktop Only */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-top"
      >
        <source
          src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/12/%E5%A8%81%E6%97%AD_%E5%BF%AB%E5%BB%A3%E5%91%8A_%E5%B1%B9%E6%BE%A7%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8_%E7%83%98%E7%84%99_%E6%A9%ABfinal.mp4"
          type="video/mp4"
        />
      </video>

      {/* Mobile Animated Background */}
      <div className="md:hidden absolute inset-0 w-full h-full overflow-hidden">
        {/* 背景圖層 */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={mobileImages[0]?.src || "/placeholder.svg"}
            alt="背景"
            fill
            className="object-cover animate-slow-drift blur-sm"
            priority
          />
        </div>
        {/* 浮動圖片 */}
        <div className="absolute inset-0">
          {mobileImages.map((image, index) => {
            // 只顯示 visibleImages 中包含的圖片
            if (!visibleImages.includes(index)) {
              return null;
            }

            const src = typeof image === 'string' ? image : image.src;
            const isTransparent = typeof image === 'object' ? image.isTransparent : false;
            const positions = [
              { top: "5%", left: "10%", size: "w-32 h-24" },
              { top: "15%", right: "5%", size: "w-36 h-36" },
              { top: "50%", left: "5%", size: "w-40 h-32" },
              { top: "30%", left: "15%", size: "w-36 h-32" },
              { top: "40%", right: "5%", size: "w-28 h-28" },
              { top: "60%", right: "15%", size: "w-32 h-24" },
            ];
            const pos = positions[index];
            
            // 計算該圖片在 visibleImages 中的順序，作為延遲時間
            const visibleIndex = visibleImages.indexOf(index);
            
            return (
              <div
                key={`float-${index}`}
                className={`absolute ${pos.size} ${isTransparent ? '' : 'rounded-xl overflow-hidden shadow-2xl'} animate-pop-up-and-float`}
                style={{
                  top: pos.top,
                  left: pos.left,
                  right: pos.right,
                  bottom: pos.top,
                  animationDelay: `${visibleIndex * 0.3}s`,
                  animationDuration: `${6 + visibleIndex * 0.5}s`,
                }}
              >
                <Image
                  src={src || "/placeholder.svg"}
                  alt="麵包"
                  fill
                  className={isTransparent ? "object-contain" : "object-cover"}
                  priority={visibleIndex < 3}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Overlay */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-sunny-dark/40 via-sunny-dark/20 to-transparent" />

      {/* Mobile Overlay */}
      <div className="md:hidden absolute inset-0 bg-black/10 z-[5]" />

      {/* Floating Decorations - Desktop Only */}
      <div className="hidden md:block absolute top-20 left-10 text-6xl opacity-20 animate-float">🥐</div>
      <div className="hidden md:block absolute top-40 right-20 text-5xl opacity-15 animate-float" style={{ animationDelay: '2s' }}>
        🍞
      </div>
      <div className="hidden md:block absolute bottom-40 left-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '4s' }}>
        🥖
      </div>

      {/* Mobile Logo */}
      <div className="md:hidden absolute inset-0 z-20 flex items-center justify-center pt-10">
        <div className='w-full h-auto z-20 justify-center  absolute bottom-5 '>
        <Image
          src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/10/晴朗家-png.png"
          alt="晴朗家烘焙"
          width={400}
          height={360}
          className="w-auto mx-auto h-auto drop-shadow-2xl relative z-[25]"
          priority
        />
        {/* 地板 */}
        <div
          className="w-[88%] mx-auto bg-white"
          style={{
            height: '32px', // h-8
            borderRadius: '50%', // 極大 border-radius 形成橢圓
            boxShadow: '0 8px 24px 0 rgba(208, 154, 87, 0.09)', // 柔和陰影感覺像地板
            opacity: 0.92,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '-0.5rem', // 上移一點（原本 bottom-20 = 5rem, 稍微再高一點）
            zIndex: 22,
          }}
        >
         
        </div>
        </div>
        
      </div>
     
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">

        {/* Desktop Version: 保持原有結構（目前為註解狀態） */}
        <div className="hidden md:block max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          {/* <div className="inline-block px-6 py-3 bg-sunny-orange/90 rounded-full animate-fade-in-up backdrop-blur-sm">
            <span className="text-sm font-bold text-white tracking-wider">🍞 每日新鮮烘焙 · 手作麵包</span>
          </div> */}

          {/* Main Title */}
          {/* <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            晴朗家烘焙
          </h1> */}

          {/* Subtitle with Gradient */}
          {/* <p
            className="text-2xl md:text-4xl font-light text-sunny-gold animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            情不自禁之意
          </p> */}

          {/* Description */}
          {/* <p
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            烘焙就是一場對話，每一次揉搓都是對食材的尊重。
            我們用傳統工藝結合現代創意，讓每一個麵包都成為您生活中的溫暖陪伴。
          </p> */}

          {/* CTA Buttons */}
          {/* <div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <Button
              size="lg"
              className="bg-sunny-orange hover:bg-orange-600 text-white text-lg px-10 py-6 shadow-2xl hover:shadow-sunny-orange/50 transition-all hover:scale-105"
            >
              <Link href="/sunnyhaus/bakery-items" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                了解產品
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-sunny-dark text-lg px-10 py-6 backdrop-blur-sm bg-transparent"
            >
              <Link href="/sunnyhaus/about-us">認識我們</Link>
            </Button>
          </div> */}
        </div>
      </div>

      {/* Mute Button - Desktop Only */}
      <button
        onClick={toggleMute}
        className="hidden md:flex absolute bottom-8 right-8 z-20 p-4 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all"
        aria-label={isMuted ? '開啟聲音' : '關閉聲音'}
      >
        {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
      </button>

      {/* Scroll Indicator - 提示用戶向下滾動 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {/* 文字提示 - 只在桌面顯示 */}
        <span className="hidden md:block text-xs text-white/50 uppercase tracking-widest font-medium">
          往下探索
        </span>
        {/* 箭頭動畫 */}
        <div className="scroll-hint-arrow">
          <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white/60" />
        </div>
        {/* 發光效果 */}
        <div className="absolute -inset-4 bg-sunny-orange/10 rounded-full blur-xl opacity-50" />
      </div>
      
    </section>
  );
}


'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/app/components/sections/Navbar';
import HeaderSection from '@/app/components/sections/HeaderSection';
import FeatureSection from '@/app/components/sections/FeatureSection';
import { Footer } from '@/components/layout/Footer';
import { Wheat, Shield, Award, Sparkles, ChefHat, Clock } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        {/* ==================== HERO SECTION ==================== */}
        <HeaderSection />

        {/* ==================== FEATURED PRODUCT SECTION ==================== */}
        <FeatureSection />

        {/* ==================== PRODUCTS CAROUSEL ==================== */}
        <section className="py-20 bg-orange-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-sunny-dark mb-12">
              晴朗精選
            </h2>

            {/* Product Carousel */}
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-6 min-w-max px-4">
                {[
                  { emoji: '🥐', name: '牛角麵包', desc: '法式牛角麵包' },
                  { emoji: '🍞', name: '黑麥麵包', desc: '黑麥全麥麵包' },
                  { emoji: '🧈', name: '鹹奶油麵包', desc: '法式鹹奶油麵包' },
                  { emoji: '🥖', name: '長棍麵包', desc: '經典法式長棍' },
                ].map((product, idx) => (
                  <div key={idx} className="flex-shrink-0">
                    <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <div className="text-5xl mb-2">{product.emoji}</div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-sunny-dark">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="mt-20">
            <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="white"></path>
              <path d="M0,70 Q300,30 600,70 T1200,70 L1200,0 L0,0 Z" fill="#FFF8F0" opacity="0.8"></path>
            </svg>
          </div>
        </section>

        {/* ==================== WHY CHOOSE US ==================== */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-bold text-sunny-dark">為什麼選擇晴朗家？</h2>
              <p className="text-lg text-gray-600">我們不只賣麵包，我們提供的是品質、信任和生活態度</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🌾',
                  title: '嚴選食材',
                  desc: '只選用最優質的麵粉、黃油和食材，確保每一個麵包都是最好的'
                },
                {
                  icon: '🤝',
                  title: '傳統工藝',
                  desc: '結合傳統烘焙手藝與現代創意，打造獨特而美味的麵包'
                },
                {
                  icon: '✨',
                  title: '品質保證',
                  desc: '每一款產品都經過嚴格檢測，堅持卓越品質'
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-gradient-to-br from-sunny-cream to-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all hover:-translate-y-2 text-center">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-sunny-dark mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wave Divider */}
          <div className="mt-20">
            <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="#1e40af" opacity="0.08"></path>
              <path d="M0,70 Q300,30 600,70 T1200,70 L1200,0 L0,0 Z" fill="#1e40af" opacity="0.12"></path>
            </svg>
          </div>
        </section>

        {/* ==================== ABOUT US ==================== */}
        <section className="py-20 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div className="inline-block px-4 py-2 bg-blue-100 rounded-full">
                  <span className="text-sm font-semibold text-blue-800">ABOUT</span>
                </div>
                <h2 className="text-4xl font-bold text-sunny-dark">
                  關於晴朗家
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  晴朗家烘焙成立於 2010 年，致力於為顧客帶來最美好的烘焙體驗。我們堅持每日新鮮製作，選用最優質的食材，融合傳統工藝與現代創意。
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-bold text-sunny-dark">台灣新竹</p>
                      <p className="text-sm text-gray-600">總店位於新竹市東區</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">👨‍🍳</span>
                    <div>
                      <p className="font-bold text-sunny-dark">15+ 年烘焙經驗</p>
                      <p className="text-sm text-gray-600">專業烘焙師傅團隊</p>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="bg-sunny-orange hover:bg-orange-600 text-white">
                  <Link href="/sunnyhaus/about-us">查看完整故事</Link>
                </Button>
              </div>

              {/* Right Image */}
              <div className="hidden md:block">
                <div className="h-96 rounded-3xl bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center shadow-xl">
                  <div className="text-center space-y-4">
                    <div className="text-8xl">🏪</div>
                    <p className="text-lg font-bold text-blue-900">晴朗家烘焙</p>
                    <p className="text-sm text-blue-800">新竹旗艦店</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="mt-20">
            <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="white"></path>
            </svg>
          </div>
        </section>

        {/* ==================== GALLERY SECTION ==================== */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-sunny-dark mb-4">晴朗推薦</h2>
              <p className="text-gray-600">顧客的真實分享</p>
            </div>

            {/* Image Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                    <div className="text-5xl">🥐</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wave Divider */}
          <div className="mt-20">
            <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="#FFD700" opacity="0.1"></path>
              <path d="M0,70 Q300,30 600,70 T1200,70 L1200,0 L0,0 Z" fill="#F36C21" opacity="0.1"></path>
            </svg>
          </div>
        </section>

        {/* ==================== STORE LOCATOR ==================== */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-orange-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-sunny-dark mb-12">
              門市據點
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Map */}
              <div className="h-96 rounded-3xl bg-gray-200 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-gray-600 font-semibold">台灣門市地圖</p>
                  <p className="text-sm text-gray-500">新竹、台中、台北</p>
                </div>
              </div>

              {/* Store Info */}
              <div className="space-y-6">
                {[
                  { name: '新竹旗艦店', addr: '新竹市東區' },
                  { name: '台中分店', addr: '台中市西屯區' },
                  { name: '台北門市', addr: '台北市信義區' }
                ].map((store, idx) => (
                  <div key={idx} className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
                    <h3 className="font-bold text-lg text-sunny-dark mb-2">{store.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{store.addr}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>☎️ 02-XXXX-XXXX</span>
                      <span>🕐 10:00-20:00</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="mt-20">
            <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="#1e40af" opacity="0.15"></path>
            </svg>
          </div>
        </section>

        {/* ==================== CTA SECTION ==================== */}
        <section className="py-20 bg-gradient-to-r from-sunny-orange via-orange-500 to-sunny-gold text-white overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-8">
              <h2 className="text-5xl font-bold leading-tight">
                加入晴朗家大家庭
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                無論是想開設自己的烘焙店，還是尋找高品質的企業採購夥伴，
                <br />
                晴朗家都歡迎與您合作。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-sunny-orange font-semibold shadow-lg">
                  <Link href="/sunnyhaus/get-join">我要加盟 🚀</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20">
                  <Link href="/sunnyhaus/business-cooperation">商業合作</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

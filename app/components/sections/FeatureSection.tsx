'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FeatureSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Image */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-64 h-80 bg-gradient-to-br from-blue-300 to-blue-100 rounded-3xl flex items-center justify-center shadow-xl">
                <div className="text-center space-y-4">
                  <div className="text-7xl">🥖</div>
                  <p className="text-sm text-gray-700 font-semibold">法式長棍麵包</p>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-50 rounded-full opacity-50"></div>
            </div>
          </div>

          {/* Right Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-block px-4 py-2 bg-blue-100 rounded-full">
                <span className="text-sm font-semibold text-blue-800">🌟 CAN'T HELP</span>
              </div>
              <h2 className="text-4xl font-bold text-sunny-dark">
                晴朗推薦
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                選用法國進口麵粉，手工揉搓每一個麵團。經過長時間低溫發酵，讓麵包呈現完美的香氣和口感。外酥內柔，每一口都能感受到烘焙師的用心。
              </p>
            </div>

            {/* Product Info */}
            <div className="space-y-4 py-6 border-y border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">每日限量</span>
                <span className="font-bold text-sunny-orange">50 條</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">麵粉來源</span>
                <span className="font-bold text-sunny-dark">法國進口</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">發酵時間</span>
                <span className="font-bold text-sunny-dark">12+ 小時</span>
              </div>
            </div>

            {/* CTA */}
            <Button size="lg" className="w-full bg-sunny-orange hover:bg-orange-600 text-white">
              <Link href="/sunnyhaus/bakery-items">探索更多產品</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="mt-20">
        <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,100 600,50 T1200,50 L1200,0 L0,0 Z" fill="#F36C21" opacity="0.1"></path>
          <path d="M0,70 Q300,30 600,70 T1200,70 L1200,0 L0,0 Z" fill="#FFD700" opacity="0.15"></path>
        </svg>
      </div>
    </section>
  );
}


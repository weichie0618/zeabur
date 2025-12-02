'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-sunny-dark to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sunny-orange to-sunny-gold flex items-center justify-center">
                <span className="text-white font-bold">☀️</span>
              </div>
              <h3 className="text-2xl font-bold">晴朗家烘焙</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              讓晴朗家烘焙成為每個早晨幸福的開始。用新鮮、美味的手作麵包為您的生活增添幸福與美好。
            </p>
            <div className="flex gap-4 pt-4">
              <a href="https://www.facebook.com/SunnyHausBakery/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sunny-orange transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-sunny-orange transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">快速連結</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/sunnyhaus/bakery-items" className="text-gray-300 hover:text-sunny-orange transition-colors">
                  產品介紹
                </Link>
              </li>
              <li>
                <Link href="/sunnyhaus/get-news" className="text-gray-300 hover:text-sunny-orange transition-colors">
                  最新消息
                </Link>
              </li>
              <li>
                <Link href="/sunnyhaus/about-us" className="text-gray-300 hover:text-sunny-orange transition-colors">
                  關於我們
                </Link>
              </li>
              <li>
                <Link href="/sunnyhaus/business-cooperation" className="text-gray-300 hover:text-sunny-orange transition-colors">
                  商業合作
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">聯絡資訊</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-sunny-orange mt-0.5 flex-shrink-0" />
                <a href="tel:02-8722-8888" className="text-gray-300 hover:text-sunny-orange transition-colors">
                  02-8722-8888
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-sunny-orange mt-0.5 flex-shrink-0" />
                <a href="mailto:info@sunnyhausbakery.com.tw" className="text-gray-300 hover:text-sunny-orange transition-colors break-all text-sm">
                  info@sunnyhausbakery.com.tw
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-sunny-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">台灣 新竹市東區</span>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white">營業時間</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex justify-between">
                <span>週一至週五</span>
                <span>08:00 - 20:00</span>
              </li>
              <li className="flex justify-between">
                <span>週六</span>
                <span>08:00 - 21:00</span>
              </li>
              <li className="flex justify-between">
                <span>週日</span>
                <span>09:00 - 20:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} 晴朗家烘焙. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-sunny-orange transition-colors">隱私政策</Link>
            <Link href="#" className="hover:text-sunny-orange transition-colors">使用條款</Link>
            <Link href="#" className="hover:text-sunny-orange transition-colors">網站地圖</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


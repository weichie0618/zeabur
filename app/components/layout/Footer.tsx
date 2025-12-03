'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, Building2, Facebook, Instagram, ArrowRight } from 'lucide-react';

const footerLinks = [
  { name: '最新消息', href: '/sunnyhaus/get-news' },
  { name: '產品介紹', href: '/sunnyhaus/bakery-items' },
  { name: '關於我們', href: '/sunnyhaus/about-us' },
  { name: '商業合作', href: '/sunnyhaus/business-cooperation' },
  { name: '加盟表單', href: '/sunnyhaus/get-join' },
];

const socialLinks = [
  { 
    icon: Facebook, 
    href: 'https://www.facebook.com/SunnyHausBakery/', 
    label: '晴朗家烘焙 Facebook' 
  },
  { 
    icon: Instagram, 
    href: 'https://www.instagram.com/sunnyhausbakery/', 
    label: '晴朗家烘焙 Instagram' 
  },
];

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.6fr_1fr] gap-8 lg:gap-12">
          {/* 品牌信息 - 晴朗家烘焙 */}
          <div className="space-y-4">
            <div className="flex justify-start ">
              <div className="relative w-28 md:w-20 lg:w-20">
                <Image
                  src="https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/晴朗家LOGO-1712x1044-03.jpg"
                  alt="晴朗家烘焙 Logo"
                  width={144}
                  height={144}
                  className="w-full h-auto object-contain"
                  priority={false}
                  loading="lazy"
                />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              晴朗家烘焙
            </h3>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              讓晴朗家烘焙成為每個早晨幸福的開始。
            </p>
            
            {/* 社群媒體連結 */}
            <div className="pt-4">
              <h4 className="text-base md:text-lg font-semibold text-white mb-3">
                社交媒體
              </h4>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-gray-800 hover:bg-sunny-orange text-gray-300 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
                      aria-label={social.label}
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 快速連結 */}
          <div className="hidden md:block space-y-4 lg:max-w-[180px]">
            <h4 className="text-base  md:text-lg font-semibold text-white mb-4">
              快速連結
            </h4>
            <nav>
              <ul className="space-y-3">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm md:text-base text-gray-300 hover:text-sunny-orange transition-colors duration-200 flex items-center group"
                    >
                      <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Company Info Section */}
          <div className="space-y-4 md:space-y-5 lg:max-w-none">
            <h4 className="text-base md:text-lg font-semibold text-white mb-4">
              聯絡資訊
            </h4>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-sunny-orange mt-1 flex-shrink-0" />
              <p className="text-sm md:text-base leading-relaxed">
                屹澧股份有限公司<br />
                <span className="text-gray-300 text-xs md:text-sm">統編：54938525</span>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-sunny-orange mt-1 flex-shrink-0" />
              <p className="text-sm md:text-base">服務時間：週一~週五 08:00~17:00</p>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-sunny-orange mt-1 flex-shrink-0" />
              <a
                href="https://maps.app.goo.gl/pYyFqpgEoVwkkxSRA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm md:text-base hover:text-sunny-orange transition-colors duration-200 hover:underline"
              >
                地址：桃園市蘆竹區油管路一段696號
              </a>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-sunny-orange mt-1 flex-shrink-0" />
              <a
                href="mailto:service@cityburger.com.tw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm md:text-base hover:text-sunny-orange transition-colors duration-200 hover:underline break-all"
              >
                信箱：service@cityburger.com.tw
              </a>
            </div>
          </div>

          {/* Contact Buttons Section */}
          <div className="flex flex-col gap-4 md:gap-5 justify-start">
            {/* 連絡電話 */}
            <a
              href="tel:033363620"
              className="relative px-5 py-4 text-center text-white bg-sunny-orange rounded-lg no-underline block group hover:bg-[#e55a15] transition-all duration-300 hover:shadow-lg hover:shadow-sunny-orange/30 hover:scale-[1.02] active:scale-[0.98]"
              aria-label="連絡電話 03-3363620"
            >
              <div className="absolute inset-[2px] border-2 border-white rounded-md pointer-events-none opacity-90"></div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-6 w-6 md:h-7 md:w-7" />
                  <span className="text-sm md:text-base font-semibold">連絡電話</span>
                </div>
                <div className="text-lg md:text-xl font-bold tracking-wide">03-3363620</div>
              </div>
            </a>

            {/* 加盟專線 */}
            <a
              href="tel:0800872642"
              className="relative px-5 py-4 text-center text-white bg-sunny-orange rounded-lg no-underline block group hover:bg-[#e55a15] transition-all duration-300 hover:shadow-lg hover:shadow-sunny-orange/30 hover:scale-[1.02] active:scale-[0.98]"
              aria-label="加盟專線 0800-872-642"
            >
              <div className="absolute inset-[2px] border-2 border-white rounded-md pointer-events-none opacity-90"></div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-6 w-6 md:h-7 md:w-7" />
                  <span className="text-sm md:text-base font-semibold">加盟專線</span>
                </div>
                <div className="text-lg md:text-xl font-bold tracking-wide">0800-872-642</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Footer - Copyright */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm md:text-base">
              Copyright © {new Date().getFullYear()} - 屹澧股份有限公司 All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


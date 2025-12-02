'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Phone, MapPin, Clock, ChevronRight } from 'lucide-react';

const navItems = [
  { label: '品牌故事', href: '/sunnyhaus/about-us', en: 'ABOUT' },
  { label: '最新消息', href: '/sunnyhaus/get-news', en: 'NEWS' },
  { label: '產品介紹', href: '/sunnyhaus/bakery-items', en: 'MENU' },
  { label: '加盟專區', href: '/sunnyhaus/get-join', en: 'FRANCHISE' },
  { label: '門市資訊', href: '/sunnyhaus/about-us/storemap', en: 'SHOP' },
  { label: '聯絡我們', href: '/sunnyhaus/business-cooperation', en: 'CONTACT' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 防止手機選單開啟時背景滾動
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/98 backdrop-blur-md shadow-lg' 
          : 'bg-white'
      }`}>
        
        {/* Top Bar - Contact Info (Desktop Only) */}
        <div className={`hidden sm:block bg-gradient-to-r from-sunny-dark via-gray-800 to-sunny-dark text-white transition-all duration-500 ${
          isScrolled ? 'h-0 overflow-hidden opacity-0' : 'h-9 opacity-100'
        }`}>
          <div className="container mx-auto px-4 h-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <a 
                href="tel:02-8722-8888" 
                className="flex items-center gap-1.5 hover:text-sunny-gold transition-colors group"
              >
                <Phone size={12} className="group-hover:animate-pulse" />
                <span className="font-medium">02-8722-8888</span>
              </a>
              <span className="flex items-center gap-1.5 text-gray-300">
                <MapPin size={12} />
                <span>新竹市東區</span>
              </span>
              <span className="flex items-center gap-1.5 text-gray-300">
                <Clock size={12} />
                <span>08:00 - 20:00</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-sunny-gold transition-colors font-medium"
              >
                Facebook
              </a>
              <span className="text-gray-500">|</span>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-sunny-gold transition-colors font-medium"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'
            }`}>
              
              {/* Left Navigation (Desktop) */}
              <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-8">
                {navItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative py-2"
                    onMouseEnter={() => setActiveNav(item.href)}
                    onMouseLeave={() => setActiveNav(null)}
                  >
                    <span className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider block leading-tight">
                      {item.en}
                    </span>
                    <span className={`text-xs lg:text-sm font-semibold transition-colors duration-200 ${
                      activeNav === item.href ? 'text-sunny-orange' : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                    {/* Underline Animation */}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sunny-orange to-sunny-gold transition-all duration-300 ${
                      activeNav === item.href ? 'w-full' : 'w-0'
                    }`} />
                  </Link>
                ))}
              </nav>

              {/* Center Logo */}
              <Link href="/" className="flex flex-col items-center group absolute left-1/2 -translate-x-1/2 md:relative md:left-0 md:translate-x-0">
                <div className={`transition-all duration-300 ${isScrolled ? 'scale-90' : 'scale-100'}`}>
                  <div className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-[0.25em] text-center font-medium">
                    CAN'T HELP
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-sunny-dark group-hover:text-sunny-orange transition-colors duration-300">
                      晴
                    </span>
                    <span className="text-sunny-orange/60 text-lg sm:text-xl mx-0.5">|</span>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-sunny-dark group-hover:text-sunny-orange transition-colors duration-300">
                      朗
                    </span>
                    <span className="text-sunny-orange/60 text-lg sm:text-xl mx-0.5">|</span>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-sunny-dark group-hover:text-sunny-orange transition-colors duration-300">
                      家
                    </span>
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-gray-400 tracking-wider text-center italic">
                    Bakery Supply
                  </div>
                </div>
              </Link>

              {/* Right Navigation (Desktop) */}
              <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-8">
                {navItems.slice(3).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative py-2"
                    onMouseEnter={() => setActiveNav(item.href)}
                    onMouseLeave={() => setActiveNav(null)}
                  >
                    <span className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider block leading-tight">
                      {item.en}
                    </span>
                    <span className={`text-xs lg:text-sm font-semibold transition-colors duration-200 ${
                      activeNav === item.href ? 'text-sunny-orange' : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                    {/* Underline Animation */}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sunny-orange to-sunny-gold transition-all duration-300 ${
                      activeNav === item.href ? 'w-full' : 'w-0'
                    }`} />
                  </Link>
                ))}
              </nav>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden absolute right-4 p-2.5 text-sunny-dark hover:text-sunny-orange transition-colors rounded-xl hover:bg-sunny-cream/50 active:scale-95"
                aria-label={isMobileMenuOpen ? '關閉選單' : '開啟選單'}
                aria-expanded={isMobileMenuOpen}
              >
                <div className="relative w-6 h-6">
                  <Menu className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                  }`} />
                  <X className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Wave (Desktop Only) */}
        <div className={`hidden sm:block transition-all duration-500 overflow-hidden ${
          isScrolled ? 'h-0 opacity-0' : 'h-6 opacity-100'
        }`}>
          <svg className="w-full h-6" viewBox="0 0 1200 24" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#fed7aa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d="M0,12 Q300,24 600,12 T1200,12 L1200,24 L0,24 Z" fill="url(#waveGradient)" />
          </svg>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div 
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMobileMenuOpen ? 'visible' : 'invisible pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Overlay */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="關閉選單"
        />
        
        {/* Menu Panel */}
        <div className={`absolute top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Menu Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 bg-gradient-to-r from-sunny-cream/30 to-white">
            <div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">CAN'T HELP</div>
              <div className="text-lg font-bold text-sunny-dark">晴朗家</div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
              aria-label="關閉選單"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="py-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gradient-to-r hover:from-sunny-cream/50 hover:to-transparent transition-all duration-200 border-b border-gray-50 group ${
                  isMobileMenuOpen ? 'animate-slideIn' : ''
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">{item.en}</div>
                  <div className="text-base font-semibold text-gray-800 group-hover:text-sunny-orange transition-colors">
                    {item.label}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-sunny-orange group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </nav>

          {/* Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-gray-50 to-white border-t border-gray-100">
            {/* Quick Contact */}
            <a 
              href="tel:02-8722-8888" 
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-sunny-orange to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all duration-300 font-semibold active:scale-[0.98]"
            >
              <Phone size={18} />
              <span>立即來電諮詢</span>
            </a>
            
            {/* Info */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
              <Clock size={12} />
              <span>營業時間 08:00 - 20:00</span>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center justify-center gap-6 mt-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-sunny-orange transition-colors font-medium"
              >
                Facebook
              </a>
              <span className="text-gray-300">•</span>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-sunny-orange transition-colors font-medium"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Header Spacing */}
      <div className="h-20 sm:h-28 md:h-32" />

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

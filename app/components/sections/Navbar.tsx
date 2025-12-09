"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Phone, ChevronDown, Search } from "lucide-react";

// 導航項目類型定義
type NavItem = {
  label: string;
  href: string;
  submenu?: Array<{ label: string; href: string }>;
};

// 導航配置（從 nav.ts 移過來）
const navConfig: {
  mainNav: NavItem[];
  footer: NavItem[];
} = {
  mainNav: [
    {
      label: "首頁",
      href: "/",
    },
    {
      label: "最新消息",
      href: "/sunnyhaus/get-news",
    },
    {
      label: "產品介紹",
      href: "/sunnyhaus/bakery-items",
    },
    {
      label: "關於我們",
      href: "/sunnyhaus/about-us",
    },
    {
      label: "加盟表單",
      href: "/sunnyhaus/get-join",
    },
  ],
  footer: [
    {
      label: "最新消息",
      href: "/sunnyhaus/get-news",
    },
    {
      label: "產品介紹",
      href: "/sunnyhaus/bakery-items",
    },
    {
      label: "關於我們",
      href: "/sunnyhaus/about-us",
    },
    {
      label: "加盟表單",
      href: "/sunnyhaus/get-join",
    },
  ],
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 點擊外部區域關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setOpenSubmenus(new Set());
      }
    };

    if (isOpen) {
      // 使用 capture phase 來確保在事件冒泡前處理
      document.addEventListener("mousedown", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  return (
    <header
      ref={navRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
        isScrolled 
          ? "top-4 w-[95%] max-w-5xl xl:max-w-6xl" 
          : "top-6 w-[90%] max-w-6xl xl:max-w-7xl"
      )}
    >
      <nav
        className={cn(
          "bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-amber-100 transition-all",
          isScrolled 
            ? "px-4 py-2 xl:px-6 xl:py-3" 
            : "px-8 py-4 xl:px-12 xl:py-5"
        )}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group outline-none focus:outline-none focus-visible:outline-none"
          >
            <div
              className={cn(
                "relative transition-all group-hover:scale-105",
                isScrolled 
                  ? "h-10 w-auto xl:h-12" 
                  : "h-12 w-auto xl:h-16"
              )}
            >
              <Image
                src="https://sunnyhausbakery.com.tw/wp-content/uploads/2025/12/transparent-Photoroom-6.png"
                alt="晴朗家烘焙"
                width={isScrolled ? 120 : 150}
                height={isScrolled ? 40 : 48}
                className="h-full w-auto object-contain border-0 outline-none select-none xl:w-auto"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-amber-50/50 rounded-full px-2 py-1 xl:gap-2 xl:px-3 xl:py-2">
            {navConfig.mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 text-sm rounded-full transition-all xl:px-5 xl:py-2.5 xl:text-base",
                      active
                        ? "text-amber-700 bg-white font-semibold shadow-sm"
                        : "text-amber-800 hover:text-amber-600 hover:bg-white"
                    )}
                  >
                    {item.label}
                    {item.submenu && (
                      <ChevronDown size={12} className="transition-transform group-hover:rotate-180 xl:w-4 xl:h-4" />
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.submenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 bg-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-3 border border-amber-100">
                      {item.submenu.map((sub: { label: string; href: string }) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "block px-5 py-2 text-sm transition-colors",
                            isActive(sub.href)
                              ? "text-amber-600 bg-amber-50 font-semibold"
                              : "text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            
            <a
              href="https://joinmeet.sunnyhausbakery.com.tw/client/bakery"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all xl:px-6 xl:py-3 xl:text-base"
            >
              線上訂購
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-amber-700 hover:bg-amber-100 rounded-full transition-colors"
            aria-label={isOpen ? "關閉選單" : "開啟選單"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div 
          className="lg:hidden mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-amber-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-2">
            {navConfig.mainNav.map((item) => {
              const isSubmenuOpen = openSubmenus.has(item.href);
              return (
                <div key={item.href}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(item.href)}
                        className={cn(
                          "w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors font-medium",
                          isActive(item.href)
                            ? "text-amber-700 bg-amber-50 font-semibold"
                            : "text-amber-800 hover:bg-amber-50"
                        )}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform",
                            isSubmenuOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Mobile Submenu */}
                      {isSubmenuOpen && (
                        <div className="ml-4 space-y-1 mt-1">
                          {item.submenu.map((sub: { label: string; href: string }) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                "block py-2 px-4 text-sm transition-colors",
                                isActive(sub.href)
                                  ? "text-amber-700 font-semibold"
                                  : "text-gray-600 hover:text-amber-700"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "block py-3 px-4 rounded-xl transition-colors font-medium",
                        isActive(item.href)
                          ? "text-amber-700 bg-amber-50 font-semibold"
                          : "text-amber-800 hover:bg-amber-50"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}

            {/* Mobile CTA Button */}
            <a
              href="https://line.me/R/app/2006231077-9A6bmQNe"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-center hover:shadow-lg transition-all block"
              onClick={() => setIsOpen(false)}
            >
              線上訂購
            </a>
          </div>
        </div>
      )}

      {/* Header Spacing - 浮動設計需要動態間距 */}
      <div className={cn("transition-all duration-500")} />
    </header>
  );
}

export default Navbar;

// 導出 navConfig 供其他組件使用（如果需要）
export { navConfig };


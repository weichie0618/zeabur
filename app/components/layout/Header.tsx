"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navConfig } from "@/app/components/sections/Navbar";
import { Button } from "@/app/components/ui/Button";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white shadow-md"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 text-2xl font-bold">
          <div className="text-sunny-orange hover:text-sunny-gold transition-colors">
            晴朗家
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navConfig.mainNav.map((item) => (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors duration-300",
                  isActive(item.href)
                    ? "text-sunny-orange font-semibold"
                    : "text-sunny-dark hover:text-sunny-orange"
                )}
              >
                {item.label}
              </Link>

              {/* Dropdown Menu */}
              {item.submenu && (
                <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2">
                  {item.submenu.map((subitem) => (
                    <Link
                      key={subitem.href}
                      href={subitem.href}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors duration-300",
                        isActive(subitem.href)
                          ? "text-sunny-orange font-semibold bg-sunny-cream"
                          : "text-sunny-dark hover:text-sunny-orange hover:bg-sunny-cream"
                      )}
                    >
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button - Desktop */}
        <div className="hidden md:flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // 可以導向到聯絡頁面或打開 modal
            }}
          >
            聯絡我們
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-sunny-orange hover:bg-sunny-cream rounded-lg transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="切換選單"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-sunny-border">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navConfig.mainNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block px-4 py-2 rounded-lg transition-colors duration-300",
                    isActive(item.href)
                      ? "text-sunny-orange font-semibold bg-sunny-cream"
                      : "text-sunny-dark hover:text-sunny-orange hover:bg-sunny-cream"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>

                {/* Mobile Submenu */}
                {item.submenu && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-sunny-border pl-4">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={cn(
                          "block px-4 py-2 text-sm rounded-lg transition-colors duration-300",
                          isActive(subitem.href)
                            ? "text-sunny-orange font-semibold bg-sunny-cream"
                            : "text-sunny-dark hover:text-sunny-orange hover:bg-sunny-cream"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile CTA Button */}
            <Button fullWidth className="mt-4">
              聯絡我們
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;


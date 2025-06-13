'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// 客戶端標頭行為組件
export default function HeaderBehavior() {
  const pathname = usePathname();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // 避免在伺服器端或重複初始化
    if (typeof window === 'undefined' || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const headerContainer = document.getElementById('header-container');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('[data-nav-link]');

    // 設置當前活動鏈接
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('data-nav-link');
      if (linkPath && pathname === linkPath) {
        link.classList.add('text-[#ff6000]');
        link.classList.remove('text-[#4f2982]');
        const indicator = link.querySelector('.nav-indicator');
        if (indicator) {
          indicator.classList.remove('opacity-0');
        }
      }
    });

    // 處理滾動效果
    const handleScroll = () => {
      // 清除之前的計時器（如果有）
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // 設置新的計時器以延遲更新滾動位置
      debounceTimerRef.current = setTimeout(() => {
        const currentScrollY = window.scrollY;
        
        if (headerContainer) {
          if (currentScrollY > 50) {
            headerContainer.classList.remove('py-3');
            headerContainer.classList.add('py-1', 'bg-white/95', 'shadow-lg');
            
            // 調整 logo 大小
            const logo = headerContainer.querySelector('.flex-shrink-0 img');
            if (logo) {
              logo.classList.remove('h-14');
              logo.classList.add('h-11');
            }
          } else {
            headerContainer.classList.add('py-3');
            headerContainer.classList.remove('py-1', 'bg-white/95', 'shadow-lg');
            
            // 恢復 logo 大小
            const logo = headerContainer.querySelector('.flex-shrink-0 img');
            if (logo) {
              logo.classList.add('h-14');
              logo.classList.remove('h-11');
            }
          }
        }
      }, 10);
    };
    
    // 處理行動版選單切換
    const handleMobileMenuToggle = () => {
      if (mobileMenu && mobileMenuButton) {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        mobileMenuButton.setAttribute('aria-expanded', newState.toString());
        
        if (newState) {
          mobileMenu.classList.remove('hidden');
          
          // 更新漢堡圖標為關閉狀態
          const spans = mobileMenuButton.querySelectorAll('span:not(.sr-only)');
          if (spans.length >= 3) {
            spans[0].classList.add('rotate-45', 'top-2.5');
            spans[0].classList.remove('top-1.5');
            spans[1].classList.add('opacity-0');
            spans[1].classList.remove('opacity-100');
            spans[2].classList.add('-rotate-45', 'top-2.5');
            spans[2].classList.remove('top-3.5');
          }
          
          // 更新 sr-only 文本
          const srOnly = mobileMenuButton.querySelector('.sr-only');
          if (srOnly) {
            srOnly.textContent = '關閉選單';
          }
        } else {
          mobileMenu.classList.add('hidden');
          
          // 更新漢堡圖標為開啟狀態
          const spans = mobileMenuButton.querySelectorAll('span:not(.sr-only)');
          if (spans.length >= 3) {
            spans[0].classList.remove('rotate-45', 'top-2.5');
            spans[0].classList.add('top-1.5');
            spans[1].classList.remove('opacity-0');
            spans[1].classList.add('opacity-100');
            spans[2].classList.remove('-rotate-45', 'top-2.5');
            spans[2].classList.add('top-3.5');
          }
          
          // 更新 sr-only 文本
          const srOnly = mobileMenuButton.querySelector('.sr-only');
          if (srOnly) {
            srOnly.textContent = '開啟選單';
          }
        }
      }
    };
    
    // 添加事件監聽器
    window.addEventListener('scroll', handleScroll);
    mobileMenuButton?.addEventListener('click', handleMobileMenuToggle);
    
    // 初始調用一次滾動處理程序以設置初始狀態
    handleScroll();
    
    // 清理函數
    return () => {
      window.removeEventListener('scroll', handleScroll);
      mobileMenuButton?.removeEventListener('click', handleMobileMenuToggle);
      
      // 清理任何現有的計時器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pathname]);

  // 這個組件不渲染任何 UI
  return null;
} 
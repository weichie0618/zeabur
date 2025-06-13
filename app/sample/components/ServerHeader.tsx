import Link from 'next/link';
import Image from 'next/image';

// 伺服器端 Header 組件
export default function ServerHeader() {
  return (
    <header className="sticky top-0 z-50 transition-all duration-300 bg-white py-3" id="header-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="https://sunnyhausbakery.com.tw/" className="block">
              <Image 
                src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/晴朗家-LOGO-1比1-e1725508365820.jpg" 
                alt="晴朗家烘焙" 
                width={1400} 
                height={735} 
                className="transition-all duration-300 h-14 w-auto"
                priority={true}
              />
            </Link>
          </div>

          {/* 桌面版導航 */}
          <div className="hidden md:flex items-center">
            <nav className="flex-1 flex items-center justify-center">
              <ul className="flex space-x-8 lg:space-x-12">
                <li>
                  <a
                    href="https://sunnyhausbakery.com.tw/" 
                    className="relative font-bold text-base lg:text-lg px-1 py-2 text-[#4f2982] hover:text-[#ff6000]"
                    data-nav-link="/"
                  >
                    首頁
                    <span className="nav-indicator absolute left-0 right-0 bottom-0 h-0.5 bg-[#ff6000] opacity-0"></span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://sunnyhausbakery.com.tw/sunnyhaus/business-cooperation/" 
                    className="relative font-bold text-base lg:text-lg px-1 py-2 text-[#4f2982] hover:text-[#ff6000]"
                    data-nav-link="/about"
                  >
                    商業合作
                    <span className="nav-indicator absolute left-0 right-0 bottom-0 h-0.5 bg-[#ff6000] opacity-0"></span>
                  </a>
                </li>
                <li>
                  <Link 
                    href="/sample/apply" 
                    className="relative font-bold text-base lg:text-lg px-1 py-2 text-[#4f2982] hover:text-[#ff6000]"
                    data-nav-link="/sample/apply"
                  >
                    申請樣品
                    <span className="nav-indicator absolute left-0 right-0 bottom-0 h-0.5 bg-[#ff6000] opacity-0"></span>
                  </Link>
                </li>
              </ul>
            </nav>

            {/* 社交媒體圖標 - 桌面版 */}
            <div className="flex items-center ml-8 space-x-4">
              <a 
                href="https://reurl.cc/VMWV4b" 
                aria-label="Facebook" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transform hover:scale-110 transition-transform duration-200"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" fill="#1877F2"/>
                </svg>
              </a>
              
              <a 
                href="https://liff.line.me/2006778137-nyD0rXR5/page-1dpzvq6o" 
                aria-label="Line" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transform hover:scale-110 transition-transform duration-200"
              >
                <svg width="20px" height="20px" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M16.1 8.2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5v.9h1.5c.3 0 .5.2.5.5s-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5V8h1.5zm-3.2 2.5c0 .2-.1.4-.4.5h-.2c-.2 0-.3-.1-.4-.2l-2-2.8v2.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4c0-.2.1-.4.4-.5h.2c.2 0 .3.1.4.2L12 9.2V6.8c0-.3.2-.5.5-.5s.5.2.5.5v3.9zm-4.8 0c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v4zm-2 .6h-2c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v3.5h1.5c.3 0 .5.2.5.5 0 .2-.2.5-.5.5M20 8.6C20 4.1 15.5.5 10 .5S0 4.1 0 8.6c0 4 3.6 7.4 8.4 8 .3.1.8.2.9.5.1.3.1.6 0 .9l-.1.9c0 .3-.2 1 .9.5 1.1-.4 5.8-3.4 7.9-5.8 1.3-1.6 2-3.2 2-5" fill="#20be60" />
                </svg>
              </a>
            </div>
          </div>

          {/* 行動版選單按鈕 */}
          <button 
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#4f2982] hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4f2982]"
            aria-expanded="false"
            id="mobile-menu-button"
          >
            <span className="sr-only">開啟選單</span>
            <span className="relative w-6 h-6">
              <span className="absolute block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out top-1.5"></span>
              <span className="absolute block w-6 h-0.5 bg-current top-2.5 transform transition duration-200 ease-in-out opacity-100"></span>
              <span className="absolute block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out top-3.5"></span>
            </span>
          </button>
        </div>
      </div>

      {/* 行動版選單 - 預設隱藏 */}
      <div className="md:hidden hidden" id="mobile-menu">
        <div className="px-4 pt-2 pb-4 space-y-1 bg-white">
          <a
            href="https://sunnyhausbakery.com.tw/" 
            className="block py-3 px-4 text-base font-medium text-[#4f2982] hover:bg-purple-50 hover:text-[#ff6000] rounded-md"
          >
            首頁
          </a>
          <a
            href="https://sunnyhausbakery.com.tw/sunnyhaus/business-cooperation/" 
            className="block py-3 px-4 text-base font-medium text-[#4f2982] hover:bg-purple-50 hover:text-[#ff6000] rounded-md"
          >
            商業合作
          </a>
          <Link 
            href="/sample/apply" 
            className="block py-3 px-4 text-base font-medium text-[#ff6000] bg-purple-50 rounded-md"
          >
            申請樣品
          </Link>
          
          {/* 社交媒體圖標 - 行動版 */}
          <div className="flex space-x-6 px-4 py-3">
            <a 
              href="https://reurl.cc/VMWV4b" 
              aria-label="Facebook" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" fill="#1877F2"/>
              </svg>
            </a>
            <a 
              href="https://liff.line.me/2006778137-nyD0rXR5/page-1dpzvq6o" 
              aria-label="Line" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg width="20px" height="20px" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M16.1 8.2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5v.9h1.5c.3 0 .5.2.5.5s-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5V8h1.5zm-3.2 2.5c0 .2-.1.4-.4.5h-.2c-.2 0-.3-.1-.4-.2l-2-2.8v2.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4c0-.2.1-.4.4-.5h.2c.2 0 .3.1.4.2L12 9.2V6.8c0-.3.2-.5.5-.5s.5.2.5.5v3.9zm-4.8 0c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v4zm-2 .6h-2c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v3.5h1.5c.3 0 .5.2.5.5 0 .2-.2.5-.5.5M20 8.6C20 4.1 15.5.5 10 .5S0 4.1 0 8.6c0 4 3.6 7.4 8.4 8 .3.1.8.2.9.5.1.3.1.6 0 .9l-.1.9c0 .3-.2 1 .9.5 1.1-.4 5.8-3.4 7.9-5.8 1.3-1.6 2-3.2 2-5" fill="#20be60" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
} 
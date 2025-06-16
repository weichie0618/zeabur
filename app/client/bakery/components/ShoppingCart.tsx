'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

// 定義產品介面
interface Product {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  images: string;
  selectedFlavors?: {[key: string]: number};
}

// 格式化選擇的口味
const formatSelectedFlavors = (flavors?: {[key: string]: number}): string => {
  if (!flavors || Object.keys(flavors).length === 0) return '';
  
  return Object.entries(flavors)
    .filter(([_, count]) => count > 0)
    .map(([flavor, count]) => `${flavor} x${count}`)
    .join(', ');
};

interface ShoppingCartProps {
  cart: Product[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  removeFromCart: (productId: number, selectedFlavors?: {[key: string]: number}) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  calculateTotal: () => number;
  getTotalItems: () => number;
  handleCheckout: () => void;
  isInitialized: boolean;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cart,
  isCartOpen,
  setIsCartOpen,
  isMobile,
  removeFromCart,
  updateQuantity,
  calculateTotal,
  getTotalItems,
  handleCheckout,
  isInitialized
}) => {
  // 購物車浮動按鈕
  const CartButton = () => (
    <>
      {(!isMobile || (isMobile && cart.length > 0)) && (
        <div className={`fixed z-50 ${
          isMobile 
            ? 'bottom-10 left-0 right-0 mx-auto w-11/12' 
            : 'bottom-6 right-6'
        }`}>
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={`${isMobile ? 'w-full' : 'w-auto min-w-[180px]'} bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center justify-between transition-all duration-300`}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">購物車</span>
            </div>
            <div className="flex items-center">
              {cart.length > 0 && (
                <>
                  <span className="mr-2">${calculateTotal().toFixed(0)}</span>
                  <span className="bg-white text-amber-600 font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </>
  );

  // 空購物車內容
  const EmptyCart = ({ isMobile }: { isMobile: boolean }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p>您的購物車目前是空的</p>
      {isMobile && (
        <button 
          onClick={() => setIsCartOpen(false)}
          className="mt-8 w-64 border border-amber-600 text-amber-600 hover:bg-amber-50 py-3 rounded-lg flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          繼續購物
        </button>
      )}
    </div>
  );

  // 購物車商品列表
  const CartItemList = ({ items }: { items: Product[] }) => (
    <div className="flex-1 overflow-y-auto py-4">
      {items.map(item => (
        <div key={item.id} className="flex items-center mb-4 border-b pb-4">
          <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden relative">
            <Image
              src={item.images}
              alt={item.name}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="ml-4 flex-1">
            <h3 className={`font-medium truncate whitespace-nowrap overflow-hidden ${
              item.name.length > 15 ? 'text-xs' : 'text-sm'
            }`} title={item.name}>
              {item.name}
            </h3>
            <p className="text-amber-600">${item.price}</p>
            {item.selectedFlavors && (
              <p className="text-xs text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-full mt-1">
                {formatSelectedFlavors(item.selectedFlavors)}
              </p>
            )}
            <div className="flex items-center mt-1">
              <button 
                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                className="bg-gray-200 text-gray-700 rounded-l px-2"
              >
                -
              </button>
              <span className="bg-gray-100 px-3">{item.quantity || 1}</span>
              <button 
                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                className="bg-gray-200 text-gray-700 rounded-r px-2"
              >
                +
              </button>
            </div>
          </div>
          <button 
            onClick={() => removeFromCart(item.id, item.selectedFlavors)}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  // 購物車底部
  const CartFooter = ({ isMobile }: { isMobile: boolean }) => (
    <div className={`border-t pt-4 ${isMobile ? 'pb-8' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold">總計</span>
        <span className="font-bold text-amber-600">${calculateTotal()}</span>
      </div>
      <button 
        onClick={handleCheckout}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        前往結帳
      </button>
      {isMobile && (
        <button 
          onClick={() => setIsCartOpen(false)}
          className="w-full mt-3 border border-amber-600 text-amber-600 hover:bg-amber-50 py-3 rounded-lg flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          繼續購物
        </button>
      )}
    </div>
  );

  // 計算渲染類別，防止初始載入時的動畫問題
  const desktopCartClasses = useMemo(() => {
    if (!isInitialized) {
      return "fixed z-50 bg-white shadow-xl top-0 right-0 h-screen w-full max-w-md transform-gpu translate-x-full transition-none";
    }
    return `fixed z-50 bg-white shadow-xl top-0 right-0 h-screen w-full max-w-md transform-gpu ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`;
  }, [isCartOpen, isInitialized]);

  const mobileCartClasses = useMemo(() => {
    if (!isInitialized) {
      return "fixed z-50 bg-white shadow-xl bottom-0 left-0 right-0 w-full h-[100vh] transform-gpu translate-y-full transition-none rounded-t-3xl";
    }
    return `fixed z-50 bg-white shadow-xl bottom-0 left-0 right-0 w-full h-[100vh] transform-gpu ${isCartOpen ? 'translate-y-0' : 'translate-y-full'} rounded-t-3xl transition-transform duration-300`;
  }, [isCartOpen, isInitialized]);

  return (
    <>
      {/* 購物車浮動按鈕 */}
      <CartButton />
      
      {/* 電腦版購物車側邊欄 */}
      {!isMobile && (
        <div 
          className={desktopCartClasses}
          style={{ 
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isInitialized ? 'transform' : 'auto'
          }}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold">購物車</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {cart.length === 0 ? (
              <EmptyCart isMobile={false} />
            ) : (
              <>
                <CartItemList items={cart} />
                <CartFooter isMobile={false} />
              </>
            )}
          </div>
        </div>
      )}

      {/* 手機版購物車底部抽屜 */}
      {isMobile && (
        <div 
          className={mobileCartClasses}
          style={{ 
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isInitialized ? 'transform' : 'auto'
          }}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold">購物車</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {cart.length === 0 ? (
              <EmptyCart isMobile={true} />
            ) : (
              <>
                <CartItemList items={cart} />
                <CartFooter isMobile={true} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 
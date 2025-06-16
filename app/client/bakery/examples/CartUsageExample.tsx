'use client';

import React, { useState } from 'react';
import { ShoppingCart } from '../components/ShoppingCart';

// 定義產品介面
interface Product {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  images: string;
  selectedFlavors?: {[key: string]: number};
}

const CartUsageExample: React.FC = () => {
  // 購物車狀態
  const [cart, setCart] = useState<Product[]>([]);
  // 購物車開關狀態
  const [isCartOpen, setIsCartOpen] = useState(false);
  // 購物車初始化狀態
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 移除商品
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  // 更新商品數量
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => prevCart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  // 移除特定口味
  const removeFlavor = (productId: number, flavor: string) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId && item.selectedFlavors && item.selectedFlavors[flavor]) {
        // 創建新的 selectedFlavors 對象，移除指定的口味
        const updatedFlavors = { ...item.selectedFlavors };
        delete updatedFlavors[flavor];
        
        // 檢查是否還有其他口味
        const hasOtherFlavors = Object.keys(updatedFlavors).length > 0;
        
        // 如果還有其他口味，返回更新後的商品
        if (hasOtherFlavors) {
          return {
            ...item,
            selectedFlavors: updatedFlavors
          };
        } else {
          // 如果沒有其他口味，但商品數量大於1，則保留商品但清空口味
          if (item.quantity && item.quantity > 1) {
            return {
              ...item,
              selectedFlavors: {}
            };
          }
          // 標記為null以便過濾
          return null;
        }
      }
      return item;
    }).filter(Boolean) as Product[]); // 過濾掉標記為刪除的商品
  };
  
  // 計算總金額
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  };
  
  // 計算總商品數量
  const getTotalItems = () => {
    return cart.reduce((total, item) => {
      return total + (item.quantity || 1);
    }, 0);
  };
  
  // 結帳處理
  const handleCheckout = () => {
    alert('前往結帳頁面');
    setIsCartOpen(false);
  };
  
  // 偵測移動設備
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // 元件掛載後設定為已初始化
  React.useEffect(() => {
    setIsInitialized(true);
    // 偵聽視窗大小改變
    const handleResize = () => {
      // 更新移動設備狀態
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      {/* 其他頁面內容 */}
      <ShoppingCart
        cart={cart}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        isMobile={isMobile}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        calculateTotal={calculateTotal}
        getTotalItems={getTotalItems}
        handleCheckout={handleCheckout}
        isInitialized={isInitialized}
        removeFlavor={removeFlavor}
      />
    </div>
  );
};

export default CartUsageExample; 
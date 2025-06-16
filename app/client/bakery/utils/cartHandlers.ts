// 購物車操作處理範例
import { useState } from 'react';

// 購物車商品介面
interface CartProduct {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  images: string;
  selectedFlavors?: {[key: string]: number};
}

// 移除購物車中特定商品口味的功能
export const removeFlavor = (
  cart: CartProduct[], 
  productId: number, 
  flavor: string
): CartProduct[] => {
  return cart.map(item => {
    // 找到要修改的商品
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
        // 如果沒有其他口味且數量為1或未定義，標記為null（稍後過濾）
        return null;
      }
    }
    return item;
  }).filter(Boolean) as CartProduct[]; // 過濾掉標記為刪除的商品
};

// 使用示例
export const useCartHandlers = () => {
  // 假設使用狀態管理存儲購物車
  const [cart, setCart] = useState<CartProduct[]>([]);
  
  // 移除特定口味
  const handleRemoveFlavor = (productId: number, flavor: string) => {
    setCart((prevCart: CartProduct[]) => removeFlavor(prevCart, productId, flavor));
  };
  
  return {
    cart,
    setCart,
    removeFlavor: handleRemoveFlavor,
    // 其他購物車相關功能...
  };
}; 
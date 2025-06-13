'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FaSearch } from 'react-icons/fa';
import { Product } from '../data/products';
import ApplicationForm from './ApplicationForm';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import ServerProductList from './ServerProductList';

interface ProductDisplayProps {
  products: Product[];
}

export default function ProductDisplay({ products }: ProductDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 過濾產品
  const filteredProducts = useMemo(() => 
    products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  // 處理產品選擇
  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      return prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
    });
  };

  // 客戶端掛載後初始化產品選擇功能
  useEffect(() => {
    // 為所有產品項目添加點擊事件
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
      const productId = item.getAttribute('data-product-id');
      if (productId) {
        item.addEventListener('click', () => handleProductSelection(productId));
      }
    });

    // 清理函數
    return () => {
      productItems.forEach(item => {
        const productId = item.getAttribute('data-product-id');
        if (productId) {
          item.removeEventListener('click', () => handleProductSelection(productId));
        }
      });
    };
  }, []);

  // 更新選擇狀態的視覺效果
  useEffect(() => {
    document.querySelectorAll('.product-item').forEach(item => {
      const productId = item.getAttribute('data-product-id');
      const overlay = item.querySelector('.product-selected-overlay') as HTMLElement;
      
      if (productId && overlay) {
        if (selectedProducts.includes(productId)) {
          item.classList.add('ring-2', 'ring-blue-500');
          overlay.style.opacity = '1';
        } else {
          item.classList.remove('ring-2', 'ring-blue-500');
          overlay.style.opacity = '0';
        }
      }
    });
  }, [selectedProducts]);

  // 移動到下一步
  const moveToNextStep = () => {
    if (selectedProducts.length === 0) {
      // 顯示錯誤
      document.getElementById('products-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    if (selectedProducts.length > 5) {
      // 顯示錯誤：最多選擇5個產品
      document.getElementById('products-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setStep(2);
    // 滾動到表單位置
    setTimeout(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 返回產品選擇
  const moveToProductStep = () => {
    setStep(1);
    // 滾動到產品選擇區
    setTimeout(() => {
      document.getElementById('product-selection')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 申請成功後處理
  const handleFormSuccess = () => {
    setStep(3); // 將步驟設為3（完成申請）
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 檢查步驟是否完成
  const isStepCompleted = (stepNumber: number) => {
    if (stepNumber === 1) {
      return selectedProducts.length > 0 && selectedProducts.length <= 5;
    }
    return false;
  };

  return (
    <>
      {/* 申請步驟指示器 */}
      <div className="flex items-center justify-between mb-10 bg-white rounded-lg shadow-sm p-6 transition-all duration-300">
        <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">選擇樣品</div>
        </div>
        <div className={`step-connector ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">填寫資料</div>
        </div>
        <div className={`step-connector ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">完成申請</div>
        </div>
      </div>

      {step === 1 ? (
        <div id="product-selection">
          {/* 搜尋欄 */}
          <div className="mb-6 relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋樣品..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 使用伺服器端渲染的產品列表 */}
          <ServerProductList products={filteredProducts} />

          {/* 產品選擇相關錯誤訊息 */}
          {selectedProducts.length === 0 && (
            <p id="products-error" className="text-red-500 text-center mb-4">請選擇至少一個樣品</p>
          )}
          {selectedProducts.length > 5 && (
            <p id="products-error" className="text-red-500 text-center mb-4">最多只能選擇5個樣品</p>
          )}

          {/* 下一步按鈕 */}
          <div className="flex justify-center mb-10">
            <button
              onClick={moveToNextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg focus:outline-none transition duration-300"
            >
              下一步: 填寫資料
            </button>
          </div>
        </div>
      ) : step === 2 ? (
        <ApplicationForm 
          selectedProducts={selectedProducts} 
          productsData={products} 
          onBack={moveToProductStep}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10 animate-fadeIn">
          <div className="flex flex-col items-center mb-6">
            <IoIosCheckmarkCircle className="text-green-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">樣品申請成功!</h2>
          </div>
          <p className="mb-4 text-gray-700">感謝您申請我們的商品樣品。我們已收到您的申請，將盡快處理並寄送樣品給您。</p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-blue-600 mb-2">您申請的樣品：</h3>
            <ul className="list-disc list-inside text-gray-700">
              {selectedProducts.map((id) => {
                const product = products.find(p => p.id === id);
                return product ? (
                  <li key={id}>{product.name.split('｜')[1]}</li>
                ) : null;
              })}
            </ul>
          </div>
          <div className="mb-6 text-gray-700">
            <p>如有任何問題，請隨時與我們聯繫：</p>
            <p>屹澧股份有限公司 統編：54938525</p>
            <p>服務時間：週一~週五 08:00~17:00</p>
            <p>地址：桃園市蘆竹區油管路一段696號</p>
            <p>信箱：<a href="mailto:service@cityburger.com.tw" className="text-blue-600 hover:underline">service@cityburger.com.tw</a></p>
          </div>
          <button 
            onClick={() => window.location.href = 'https://sunnyhausbakery.com.tw/sunnyhaus/business-cooperation/'} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none w-full transition duration-300"
          >
            瞭解更多
          </button>
        </div>
      )}
    </>
  );
} 
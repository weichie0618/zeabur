'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  initializeAuth, 
  getAuthHeaders, 
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide
} from '../../utils/authService';

// 定義產品類型
interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number;
  category: Category;
  images: string;
  status: string;
  specification: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 初始化認證
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // 檢查令牌是否存在
        if (!accessToken) {
          handleAuthError('獲取產品資料時缺少認證令牌', setError, setLoading, setShowAuthWarning);
          return;
        }
        
        const response = await fetch(`/api/products/${productId}`, {
          headers: getAuthHeaders(accessToken),
          credentials: 'include'
        });
        
        // 處理認證錯誤
        if (response.status === 401) {
          handleAuthError('獲取產品資料時認證失敗', setError, setLoading, setShowAuthWarning);
          return;
        }
        
        if (!response.ok) {
          throw new Error('無法獲取產品資料');
        }
        
        const data = await response.json();
        // 確保圖片是陣列格式
        if (data.images) {
          if (typeof data.images === 'string') {
            // 如果是字符串，將其轉換為只有一個元素的數組
            data.images = [data.images];
          } else if (!Array.isArray(data.images)) {
            // 如果不是字符串也不是數組，嘗試轉換
            try {
              data.images = data.images.filter(Boolean);
            } catch (e) {
              // 若轉換失敗，設為空數組
              data.images = [];
            }
          }
        } else {
          // 如果沒有圖片，設為空數組
          data.images = [];
        }
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    if (productId && accessToken) {
      fetchProduct();
    }
  }, [productId, accessToken]);

  // 取得產品狀態顯示樣式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 翻譯狀態文字
  const translateStatus = (status: string) => {
    switch (status) {
      case 'active':
        return '上架中';
      case 'inactive':
        return '下架中';
      case 'out_of_stock':
        return '缺貨中';
      case 'low_stock':
        return '庫存不足';
      default:
        return status;
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">找不到產品</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">產品詳情</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            返回
          </button>
          <Link 
            href={`/admin/bakery/products/edit/${product.id}`} 
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            編輯產品
          </Link>
        </div>
      </div>
      
      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || '認證失敗，請重新登入系統'}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleRelogin();
                  }}
                  className="ml-2 font-medium text-red-700 underline"
                >
                  立即登入
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* 產品圖片 */}
          <div className="col-span-1">
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-80 w-full">
              {product.images && product.images.length > 0 ? (
                <Image 
                  src={product.images[0]} 
                  alt={product.name} 
                  width={400} 
                  height={320} 
                  className="object-contain"
                />
              ) : (
                <div className="text-gray-400">無圖片</div>
              )}
            </div>
            
            {/* 多圖預覽 */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {Array.isArray(product.images) && product.images.map((img: string, index: number) => (
                  <div key={index} className="bg-gray-100 rounded-md overflow-hidden h-16 w-full">
                    <Image
                      src={img}
                      alt={`產品圖片 ${index + 1}`}
                      width={80}
                      height={64}
                      className="object-cover h-full w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 產品資訊 */}
          <div className="col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <div className="mt-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(product.status)}`}>
                  {translateStatus(product.status)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="text-3xl font-bold text-gray-900">
                {product.discount_price ? (
                  <>
                    <span className="text-red-600">${product.discount_price}</span>
                    <span className="text-lg line-through text-gray-400 ml-2">${product.price}</span>
                  </>
                ) : (
                  `$${product.price}`
                )}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">商品編號：</span>
                  <span>{product.id}</span>
                </p>
                <p className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">商品規格：</span>
                  <span className="text-right">
                    {product.specification 
                      ? (product.specification.length > 30 
                          ? `${product.specification.substring(0, 30)}...` 
                          : product.specification)
                      : '無規格資訊'}
                  </span>
                </p>
                <p className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">商品分類：</span>
                  <span>{product.category.name}</span>
                </p>
                <p className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">上架時間：</span>
                  <span>{formatDate(product.created_at)}</span>
                </p>
                <p className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">最後更新：</span>
                  <span>{formatDate(product.updated_at)}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">商品描述</h3>
              <div className="prose max-w-none text-gray-600">
                <p>{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  initializeAuth, 
  getAuthHeaders, 
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide
} from '../utils/authService';

// 定義產品類型
interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  status: string;
  created_at: string;
  updated_at: string;
  parentId: number | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  discount_price: string | null;
  
  images: string;
  status: string;
  created_at: string;
  updated_at: string;
  categoryId: number | null;
  short_description: string | null;
  category: Category | null;
  specification: string | null;
}

interface ApiResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CategoryApiResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  // 分類數據狀態
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // 篩選相關狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // 添加時間戳狀態，用於防止圖片快取
  const [imageTimestamps, setImageTimestamps] = useState<{[key: number]: number}>({});
  
  // 添加一個狀態來存儲所有原始產品
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 初始化時間戳
  useEffect(() => {
    const timestamps: {[key: number]: number} = {};
    products.forEach(product => {
      timestamps[product.id] = Date.now();
    });
    setImageTimestamps(timestamps);
  }, [products]);
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // 獲取分類列表
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log('開始獲取分類列表');
      console.log('當前 accessToken 狀態:', accessToken ? '已設置' : '未設置');
      
      const timestamp = Date.now();
      const response = await fetch(`/api/categories?t=${timestamp}`, {
        headers: getAuthHeaders(accessToken),
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError('獲取分類時認證失敗', setError, setLoading, setShowAuthWarning);
        setLoadingCategories(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('無法獲取分類資料');
      }
      
      const data = await response.json();
      
      // 處理兩種可能的API回傳格式
      // 1. data可能是直接的分類數組 [{id:1, name:'xxx'}, ...]
      // 2. data可能是包含data屬性的對象 {data: [{id:1, name:'xxx'}, ...], meta: {...}}
      const categoriesArray = Array.isArray(data) 
        ? data 
        : (data.data && Array.isArray(data.data)) 
          ? data.data 
          : [];
      
      console.log('獲取到的分類數據:', categoriesArray);
      setCategories(categoriesArray);
    } catch (err) {
      console.error('獲取分類失敗:', err);
      // 發生錯誤時設置為空數組
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // 獲取產品列表 - 只負責從API獲取所有產品
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 檢查令牌狀態但不提前返回
      console.log('開始獲取產品列表');
      console.log('當前 accessToken 狀態:', accessToken ? '已設置' : '未設置');
      
      // 構建查詢參數 - 只請求所有產品，不包含篩選
      const queryParams = new URLSearchParams();
      
      // 添加較大的limit參數，嘗試一次獲取更多數據
      queryParams.append('limit', '500');
      
      // 添加時間戳參數，防止快取
      const timestamp = Date.now();
      queryParams.append('t', timestamp.toString());
      
      const apiUrl = `/api/products?${queryParams.toString()}`;
      console.log('發送請求到:', apiUrl);
      
      // 發送GET請求獲取所有產品
      const response = await fetch(apiUrl, {
        headers: getAuthHeaders(accessToken),
        credentials: 'include'
      });
      
      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('獲取產品資料時認證失敗', setError, setLoading, setShowAuthWarning);
        setLoading(false);
        return;
      }
      
      console.log('獲得回應狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API錯誤響應:', errorText);
        throw new Error(`無法獲取產品資料: ${response.status} ${errorText}`);
      }
      
      // 解析API回應
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('JSON解析錯誤:', parseError);
        throw new Error('無法解析API回應');
      }
      
      // 處理不同格式的回應，保存所有產品
      let productsData: Product[] = [];
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          productsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          productsData = data.data;
        }
      }
      
      console.log(`成功獲取 ${productsData.length} 個產品`);
      
      // 保存所有產品到狀態
      setAllProducts(productsData);
      
      // 初始顯示所有產品
      applyFiltersLocally(productsData);
    } catch (err) {
      console.error('獲取產品錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
      setAllProducts([]);
      setFilteredProducts([]);
      setProducts([]);
      setMeta(prev => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // 本地應用篩選條件
  const applyFiltersLocally = (productsToFilter = allProducts, pageNum = 1) => {
    try {
      console.log('本地套用篩選 - 搜尋詞:', searchQuery);
      console.log('本地套用篩選 - 分類:', selectedCategory);
      console.log('本地套用篩選 - 狀態:', selectedStatus);
      console.log('本地套用篩選 - 排序:', sortBy);
      console.log('篩選前產品數量:', productsToFilter.length);
      
      // 篩選產品
      let filtered = [...productsToFilter];
      
      // 應用名稱搜尋篩選
      if (searchQuery && searchQuery.trim() !== '') {
        const searchTerm = searchQuery.trim().toLowerCase();
        console.log('套用搜尋篩選:', searchTerm);
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm)) ||
          (product.short_description && product.short_description.toLowerCase().includes(searchTerm)) ||
          product.id.toString().includes(searchTerm)
        );
        console.log('搜尋後產品數量:', filtered.length);
      }
      
      // 應用分類篩選
      if (selectedCategory) {
        console.log('套用分類篩選:', selectedCategory);
        filtered = filtered.filter(product => 
          product.categoryId !== null && product.categoryId.toString() === selectedCategory
        );
        console.log('分類篩選後產品數量:', filtered.length);
      
      // 應用狀態篩選
      if (selectedStatus) {
        console.log('套用狀態篩選:', selectedStatus);
        filtered = filtered.filter(product => product.status === selectedStatus);
        console.log('狀態篩選後產品數量:', filtered.length);
      }
      }
      // 應用排序
      if (sortBy) {
        console.log('套用排序:', sortBy);
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'price_asc':
              return parseFloat(a.price) - parseFloat(b.price);
            case 'price_desc':
              return parseFloat(b.price) - parseFloat(a.price);
            case 'newest':
            default:
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
        });
      }
      
      // 保存所有篩選結果
      setFilteredProducts(filtered);
      
      // 計算總頁數
      const total = filtered.length;
      const totalPages = Math.ceil(total / meta.limit);
      
      // 應用分頁 - 確保頁碼有效
      const validPage = Math.max(1, Math.min(pageNum, totalPages || 1));
      
      // 計算分頁的開始和結束索引
      const startIndex = (validPage - 1) * meta.limit;
      const endIndex = Math.min(startIndex + meta.limit, total);
      
      // 提取當前頁的產品
      const paginatedProducts = filtered.slice(startIndex, endIndex);
      console.log(`顯示頁碼 ${validPage}，產品索引範圍: ${startIndex}-${endIndex}，共${paginatedProducts.length}個產品`);
      
      // 更新狀態
      setProducts(paginatedProducts);
      setMeta({
        total,
        page: validPage,
        limit: meta.limit,
        totalPages: totalPages || 1
      });
    } catch (error) {
      console.error('本地篩選錯誤:', error);
      setProducts([]);
      setMeta(prev => ({
        ...prev,
        total: 0,
        totalPages: 0
      }));
    }
  };

  // 處理分頁 - 更新使用本地篩選
  const handlePageChange = (page: number) => {
    console.log('切換到頁碼:', page);
    applyFiltersLocally(filteredProducts, page);
  };

  // 處理套用篩選 - 更新使用本地篩選
  const handleApplyFilters = () => {
    console.log('套用篩選條件');
    applyFiltersLocally(allProducts, 1); // 始終從第一頁開始
  };

  // 處理重置篩選
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSortBy('newest');
    // 使用setTimeout確保狀態已更新
    setTimeout(() => {
      applyFiltersLocally(allProducts, 1);
    }, 0);
  };

  // 第一次載入時獲取產品數據和分類列表
  useEffect(() => {
    // 確保已獲取到token後再發起請求
    if (accessToken) {
      console.log('accessToken 已設置，準備獲取產品和分類');
      fetchCategories();
      fetchProducts();
    } else {
      // 不立即顯示錯誤，等待可能的自動重試
      console.warn('useEffect: 暫時缺少accessToken，等待獲取中...');
    }
  }, [accessToken]);

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

  // 開啟刪除確認對話框
  const handleDeleteClick = (productId: number) => {
    setDeletingProductId(productId);
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingProductId(null);
    setDeleteError(null);
  };

  // 確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      // 檢查令牌是否存在
      if (!accessToken) {
        handleAuthError('刪除產品時缺少認證令牌', setError, setLoading, setShowAuthWarning);
        return;
      }
      
      const response = await fetch(`/api/products/${deletingProductId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(accessToken),
        credentials: 'include'
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('刪除產品時認證失敗', setError, setLoading, setShowAuthWarning);
        setShowDeleteConfirm(false);
        setDeletingProductId(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除產品失敗');
      }

      // 更新產品列表
      setProducts(prevProducts => prevProducts.filter(product => product.id !== deletingProductId));
      setFilteredProducts(prevProducts => prevProducts.filter(product => product.id !== deletingProductId));
      setAllProducts(prevProducts => prevProducts.filter(product => product.id !== deletingProductId));
      setDeleteSuccess('產品已成功刪除');
      
      // 重設刪除狀態
      setShowDeleteConfirm(false);
      setDeletingProductId(null);
      
      // 清除成功訊息
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '刪除產品時發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">產品管理</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => fetchProducts()}
            className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            刷新列表
          </button>
          <Link 
            href="/admin/bakery/products/new" 
            className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新增產品
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

      {/* 成功訊息顯示 */}
      {deleteSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{deleteSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* 搜尋與篩選區 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">搜尋產品</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="輸入產品名稱或ID"
                className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">分類</label>
            <select
              id="category"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={loadingCategories}
            >
              <option value="">所有分類</option>
              {loadingCategories ? (
                <option disabled>載入中...</option>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option disabled>沒有可用分類</option>
              )}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
            <select
              id="status"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">所有狀態</option>
              <option value="active">上架中</option>
              <option value="inactive">下架中</option>
              <option value="out_of_stock">缺貨中</option>
              <option value="low_stock">庫存不足</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select
              id="sort"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">最新上架</option>
              <option value="price_asc">價格低至高</option>
              <option value="price_desc">價格高至低</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-3">
          <button 
            onClick={handleResetFilters}
            className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重置篩選
          </button>
          <button 
            onClick={handleApplyFilters}
            className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            套用篩選
          </button>
        </div>
      </div>

      {/* 產品表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">載入中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">沒有找到符合條件的產品</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    產品
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分類
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    價格
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    規格
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    動作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                          {product.images ? (
                            <Image 
                              src={`${Array.isArray(product.images) ? product.images[0] : product.images}?t=${imageTimestamps[product.id] || Date.now()}`} 
                              alt={product.name} 
                              width={40} 
                              height={40} 
                              className="rounded-md object-cover" 
                            />
                          ) : (
                            '無圖片'
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category?.name || '未分類'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.discount_price ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">${product.price}</span>
                            ${product.discount_price}
                          </>
                        ) : (
                          product.price
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {product.specification ? (
                          <span title={product.specification}>
                            {product.specification.length > 30 
                              ? `${product.specification.substring(0, 30)}...` 
                              : product.specification}
                          </span>
                        ) : (
                          <span className="text-gray-400">無規格資訊</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(product.status)}`}>
                        {translateStatus(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/bakery/products/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編輯
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(product.id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                        <Link 
                          href={`/admin/bakery/products/${product.id}`}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          檢視
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 分頁控制 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={meta.page === 1}
              onClick={() => handlePageChange(meta.page - 1)}
            >
              上一頁
            </button>
            <button 
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={meta.page === meta.totalPages}
              onClick={() => handlePageChange(meta.page + 1)}
            >
              下一頁
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                顯示第 <span className="font-medium">{meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</span> 到&nbsp;
                <span className="font-medium">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span> 項結果，共 <span className="font-medium">{meta.total}</span> 項
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  disabled={meta.page === 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  <span className="sr-only">上一頁</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* 動態產生頁碼按鈕 */}
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === meta.page
                        ? 'border-amber-500 bg-amber-50 text-amber-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  <span className="sr-only">下一頁</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景遮罩 */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCancelDelete}></div>
            
            {/* 對話框 */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">確認刪除產品</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        您確定要刪除此產品嗎？此操作無法撤銷，且產品資料將永久刪除。
                      </p>
                      {deleteError && (
                        <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isDeleting ? '刪除中...' : '確認刪除'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
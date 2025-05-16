'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// 定義分類類型
interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// 定義產品類型
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  category_id: number;
  images: string[] | string;
  status: string;
  specification: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // 表單狀態
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    discount_price: null,
    category_id: 0,
    images: [],
    specification: '',
    status: 'active'
  });

  // 新增檔案上傳狀態
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');
  const [existingImagePath, setExistingImagePath] = useState<string>('');

  // 分類列表
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 載入狀態
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 在狀態定義部分添加新的狀態變量
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPreviewAnimation, setShowPreviewAnimation] = useState(false);

  // 載入產品資料和分類資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 載入產品資料
        const productResponse = await fetch(`/api/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error('無法獲取產品資料');
        }
        const productData = await productResponse.json();
        
        // 處理圖片格式，確保為陣列或字串
        let productImages = [];
        let singleImagePath = '';
        if (productData.images) {
          if (Array.isArray(productData.images)) {
            productImages = productData.images;
            if (productImages.length > 0) {
              singleImagePath = productImages[0];
            }
          } else if (typeof productData.images === 'string') {
            // 如果是非空字串，設置為現有圖片路徑
            singleImagePath = productData.images.trim();
            productImages = singleImagePath !== '' ? [singleImagePath] : [];
          }
        }

        // 如果有現有圖片，設置到狀態
        if (singleImagePath) {
          // 添加時間戳參數防止瀏覽器快取
          setExistingImagePath(`${singleImagePath}?t=${Date.now()}`);
          
          // 提取文件名，方便之後參考
          const fileNameMatch = singleImagePath.match(/\/([^\/]+)$/);
          if (fileNameMatch && fileNameMatch[1]) {
            console.log(`現有圖片檔案名稱: ${fileNameMatch[1]}`);
          }
        }
        
        // 轉換產品資料格式以符合表單需求
        setFormData({
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price),
          discount_price: productData.discount_price ? parseFloat(productData.discount_price) : null,
          category_id: productData.category?.id || productData.category_id,
          images: singleImagePath, // 確保始終設置為字串形式
          specification: productData.specification || '',
          status: productData.status
        });

        // 載入分類資料
        const categoryResponse = await fetch('/api/categories');
        if (!categoryResponse.ok) {
          throw new Error('無法獲取分類資料');
        }
        const categoryData = await categoryResponse.json();
        setCategories(categoryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  // 處理表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 處理數字類型
    if (name === 'price') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === 'discount_price') {
      setFormData({ ...formData, [name]: value ? parseFloat(value) : null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 驗證檔案
  const validateFile = (file: File): boolean => {
    // 檢查檔案類型，只允許JPG檔案
    if (file.type !== 'image/jpeg') {
      setError('請僅上傳JPG格式的圖片檔案');
      return false;
    }
    
    // 檢查檔案大小
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
      setError('圖片檔案過大，請上傳小於10MB的圖片');
      return false;
    }
    
    // 檢查檔案是否為空
    if (file.size === 0) {
      setError('無效的圖片檔案（檔案大小為0）');
      return false;
    }
    
    return true;
  };

  // 修改處理圖片預覽函數
  const processImagePreview = async (file: File) => {
    try {
      // 設定檔案名稱為產品名稱（不含產品ID，實現同名覆蓋）
      const fileName = `${formData.name?.trim().replace(/\s+/g, '_')}-${productId}.jpg`;
      // 基本路徑，用於保存到資料庫
      const basePath = `/bakery/${fileName}`;
      // 添加時間戳參數防止瀏覽器快取
      const cacheBustPath = `${basePath}?t=${Date.now()}`;
      
      // 使用 FileReader 創建本地預覽 URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
          
          // 顯示動畫效果
          setShowPreviewAnimation(true);
          setTimeout(() => setShowPreviewAnimation(false), 1000);
        }
      };
      reader.readAsDataURL(file);
      
      // 保存上傳的文件信息
      setUploadedImage(file);
      setUploadedImagePath(cacheBustPath);
      
      // 更新表單數據中的圖片路徑（使用不含時間戳的路徑保存到資料庫）
      setFormData(prev => ({
        ...prev,
        images: basePath
      }));
      
      setError(null);
      setSuccessMessage('圖片已準備好上傳，將在儲存產品時一併處理');
    } catch (error) {
      console.error('處理圖片預覽失敗:', error);
      setError('處理圖片預覽失敗，請重試');
    }
  };

  // 處理檔案上傳
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (validateFile(file)) {
        processImagePreview(file);
      }
    }
    
    // 無論如何都清空檔案輸入框，以便可以再次選擇相同的檔案
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 處理拖放
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.add('border-amber-500');
      dropAreaRef.current.classList.remove('border-dashed');
      dropAreaRef.current.classList.add('border-solid');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove('border-amber-500');
      dropAreaRef.current.classList.add('border-dashed');
      dropAreaRef.current.classList.remove('border-solid');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove('border-amber-500');
      dropAreaRef.current.classList.add('border-dashed');
      dropAreaRef.current.classList.remove('border-solid');
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (validateFile(file)) {
        processImagePreview(file);
      }
    }
  }, []);

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // 如果有上傳圖片，先處理圖片上傳
      if (uploadedImage) {
        const formDataUpload = new FormData();
        const fileName = `${formData.name?.trim().replace(/\s+/g, '_')}-${productId}.jpg`;
        
        formDataUpload.append('file', uploadedImage, fileName);
        formDataUpload.append('destination', 'public/bakery');
        
        // 發送圖片上傳請求
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.message || '圖片上傳失敗');
        }
        
        // 確保在上傳成功後，更新 formData 中的圖片路徑（不含時間戳）
        const basePath = `/bakery/${fileName}`;
        setFormData(prev => ({
          ...prev,
          images: basePath
        }));
      } else if (existingImagePath && !uploadedImagePath) {
        // 如果有現有圖片但沒有選擇新圖片，確保使用現有圖片路徑（去除時間戳參數）
        const cleanPath = existingImagePath.split('?')[0];
        setFormData(prev => ({
          ...prev,
          images: cleanPath
        }));
      }
      
      // 準備要提交的數據
      const dataToSubmit = { ...formData };
      
      // 發送 PUT 請求更新產品資料
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新產品失敗');
      }
      
      const result = await response.json();
      setSuccessMessage('產品更新成功！');
      
      // 延遲後導航回產品列表
      setTimeout(() => {
        router.push('/admin/bakery/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">編輯產品</h1>
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          返回
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本資訊 */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">基本資訊</h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  產品名稱<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  價格<span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="discount_price" className="block text-sm font-medium text-gray-700">
                  優惠價格
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="discount_price"
                    id="discount_price"
                    min="0"
                    step="0.01"
                    value={formData.discount_price || ''}
                    onChange={handleInputChange}
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  分類<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="category_id"
                    name="category_id"
                    required
                    value={formData.category_id || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">請選擇分類</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  狀態<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status || 'active'}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="active">上架中</option>
                    <option value="inactive">下架中</option>
                    <option value="out_of_stock">缺貨中</option>
                    <option value="low_stock">庫存不足</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  產品描述<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="specification" className="block text-sm font-medium text-gray-700">
                  產品規格
                </label>
                <div className="mt-1">
                  <textarea
                    id="specification"
                    name="specification"
                    rows={3}
                    value={formData.specification || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="請輸入產品規格，例如：尺寸、重量、材質等"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">填寫產品的詳細規格資訊，幫助顧客更好地了解產品</p>
              </div>
            </div>
          </div>

          {/* 產品圖片 */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">產品圖片</h2>
            
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上傳產品圖片
              </label>
              <div 
                ref={dropAreaRef}
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-all duration-200"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  {(uploadedImagePath || existingImagePath) ? (
                    <div className="flex flex-col items-center">
                      <div className={`mb-2 h-32 w-32 overflow-hidden rounded-md transition-all duration-300 ${showPreviewAnimation ? 'ring-4 ring-amber-400 scale-105' : ''}`}>
                        <Image
                          src={previewUrl || uploadedImagePath || existingImagePath}
                          alt="產品圖片"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-900 font-medium">
                        {uploadedImage ? (
                          <span className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${showPreviewAnimation ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                            已選擇新圖片
                          </span>
                        ) : '目前圖片'}
                      </p>
                      {uploadedImage && (
                        <p className="text-xs text-gray-500 mt-1">{uploadedImage.name}</p>
                      )}
                      <button 
                        type="button"
                        className="mt-3 text-xs text-red-600 hover:text-red-800"
                        onClick={() => {
                          if (uploadedImage) {
                            // 如果有上傳新圖片，取消上傳並恢復原有圖片
                            setUploadedImage(null);
                            setUploadedImagePath('');
                            setPreviewUrl('');
                            if (existingImagePath) {
                              // 使用現有圖片（但保留時間戳參數）
                              setFormData(prev => ({ ...prev, images: existingImagePath.split('?')[0] }));
                            } else {
                              setFormData(prev => ({ ...prev, images: '' }));
                            }
                          } else if (existingImagePath) {
                            // 如果是要移除現有圖片
                            setExistingImagePath('');
                            setFormData(prev => ({ ...prev, images: '' }));
                          }
                        }}
                      >
                        {uploadedImage ? '取消更換圖片' : '移除圖片'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500 text-center"
                        >
                          <span>上傳圖片</span>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            name="file-upload"
                            type="file"
                            accept="image/jpeg"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 font-bold">僅支援JPG圖片格式</p>
                      <p className="text-xs text-gray-500">圖片僅使用產品名稱作為檔案名，同名會覆蓋</p>
                      <p className="text-xs text-gray-500">建議尺寸：300x200像素</p>
                    </>
                  )}
                </div>
              </div>
              {uploadedImagePath && (
                <p className="mt-2 text-sm text-green-600">
                  新圖片將以「{formData.name?.trim().replace(/\s+/g, '_')}-{productId}.jpg」保存
                  {existingImagePath && " (將覆蓋現有圖片)"}
                </p>
              )}
            </div>
          </div>

          {/* 表單操作按鈕 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 mr-3"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {submitting ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
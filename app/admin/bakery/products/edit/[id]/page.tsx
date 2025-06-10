'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  initializeAuth, 
  getAuthHeaders, 
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide
} from '../../../utils/authService';

// 定義產品圖片介面
interface ProductImage {
  url: string;
  sort: number;
  file?: File;
  noCacheUrl?: string; // 添加可選的無快取URL
}

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
  categoryId: number;
  images: string[] | string;
  status: string;
  specification: string | null;
  unit_code: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  productImages?: ProductImage[];
}

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // 表單狀態
  const [formData, setFormData] = useState<Partial<Product>>({
    id: 0,
    name: '',
    description: '',
    price: 0,
    discount_price: null,
    categoryId: 0,
    images: [],
    specification: '',
    unit_code: '',
    status: 'active',
    productImages: []
  });

  // 新增檔案上傳狀態
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  
  // 分類列表
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 載入狀態
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 在狀態定義部分添加新的狀態變量
  const [showPreviewAnimation, setShowPreviewAnimation] = useState(false);
  
  // 在表單狀態中添加上傳狀態追蹤
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: boolean}>({});
  
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

  // 載入產品資料和分類資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 檢查令牌是否存在
        if (!accessToken) {
          handleAuthError('獲取產品資料時缺少認證令牌', setError, setLoading, setShowAuthWarning);
          return;
        }

        // 載入產品資料
        const productResponse = await fetch(`/api/products/${productId}`, {
          headers: getAuthHeaders(accessToken),
          credentials: 'include'
        });
        
        // 處理認證錯誤
        if (productResponse.status === 401) {
          handleAuthError('獲取產品資料時認證失敗', setError, setLoading, setShowAuthWarning);
          return;
        }
        
        if (!productResponse.ok) {
          throw new Error('無法獲取產品資料');
        }
        const productData = await productResponse.json();
        
        // 處理圖片數據
        let productImages: ProductImage[] = [];
        
        if (productData.productImages && Array.isArray(productData.productImages)) {
          // 對API返回的productImages進行排序處理，確保按sort從小到大排序
          productImages = [...productData.productImages]
            .map((img: any) => ({
              url: img.imageUrl || img.url,
              sort: Number(img.sort) || 0,
              // 添加時間戳到URL以防止快取
              noCacheUrl: `${img.imageUrl || img.url}?t=${Date.now()}`
            }))
            .sort((a: ProductImage, b: ProductImage) => a.sort - b.sort);
          
          console.log('從API獲取的圖片排序:', productImages.map(img => img.sort));
          
          // 設置預覽URLs，使用帶時間戳的URL，並確保沒有undefined值
          const urls = productImages.map(img => img.noCacheUrl || img.url).filter(url => url) as string[];
          setPreviewUrls(urls);
        } else if (productData.images) {
          // 兼容舊格式：處理單一圖片或圖片數組
          if (Array.isArray(productData.images)) {
            productImages = productData.images.map((url: string, index: number) => {
              // 添加時間戳到URL以防止快取
              const noCacheUrl = `${url}?t=${Date.now()}`;
              return {
                url,
                noCacheUrl,
                sort: index + 1
              };
            });
            // 設置預覽URLs，使用帶時間戳的URL
            setPreviewUrls(productImages.map(img => img.noCacheUrl) as string[]);
          } else if (typeof productData.images === 'string' && productData.images.trim()) {
            const url = productData.images;
            // 添加時間戳到URL以防止快取
            const noCacheUrl = `${url}?t=${Date.now()}`;
            productImages = [{
              url,
              noCacheUrl,
              sort: 1
            }];
            // 設置預覽URLs，使用帶時間戳的URL
            setPreviewUrls([noCacheUrl]);
          }
        }
        
        // 轉換產品資料格式以符合表單需求
        setFormData({
          id: productData.id,
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price),
          discount_price: productData.discount_price ? parseFloat(productData.discount_price) : null,
          categoryId: productData.category?.id || productData.categoryId,
          images: productData.images, // 保留舊格式以兼容
          productImages: productImages, // 新格式
          specification: productData.specification || '',
          unit_code: productData.unit_code || '',
          status: productData.status
        });

        // 載入分類資料
        const categoryResponse = await fetch('/api/categories', {
          headers: getAuthHeaders(accessToken),
          credentials: 'include'
        });
        
        // 處理認證錯誤
        if (categoryResponse.status === 401) {
          handleAuthError('獲取分類資料時認證失敗', setError, setLoading, setShowAuthWarning);
          return;
        }
        
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

    if (productId && accessToken) {
      fetchData();
    }
  }, [productId, accessToken]);

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

  // 處理圖片上傳 - 改進支援多圖片預覽
  const processImagePreview = async (file: File) => {
    try {
      // 使用 FileReader 創建本地預覽 URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newPreviewUrl = e.target.result as string;
          
          setPreviewUrls(prevUrls => [...prevUrls, newPreviewUrl]);
          
          // 添加新圖片到uploadedImages
          setUploadedImages(prevImages => [...prevImages, file]);
          
          // 準備上傳圖片
          uploadImage(file, (formData.productImages?.length || 0));
        }
      };
      reader.readAsDataURL(file);
      
      setError(null);
      setSuccessMessage('圖片處理中，請稍後...');
    } catch (error) {
      console.error('處理圖片預覽失敗:', error);
      setError('處理圖片預覽失敗，請重試');
    }
  };

  // 修改上傳圖片功能
  const uploadImage = async (file: File, index: number) => {
    try {
      // 先添加一個臨時的圖片對象用於預覽，使用blob URL
      const tempImageObj: ProductImage = {
        url: URL.createObjectURL(file), // 臨時URL，實際上傳時會替換
        sort: (formData.productImages?.length || 0) + 1, // 新圖片的排序
        file: file // 保存文件引用，用於後續上傳
      };
      
      setFormData(prev => ({
        ...prev,
        productImages: [...(prev.productImages || []), tempImageObj]
      }));
      
      // 顯示動畫效果
      setShowPreviewAnimation(true);
      setTimeout(() => setShowPreviewAnimation(false), 1000);
      
      // 設定此圖片為上傳中
      setUploadingImages(true);
      setUploadProgress(prev => ({...prev, [index]: false}));
      
      // 立即開始上傳圖片
      const fileName = `${formData.name?.trim().replace(/\s+/g, '_')}-${productId}-${index + 1}.jpg`;
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file, fileName);
      formDataUpload.append('destination', 'uploads/bakery');
      
      // 發送圖片上傳請求
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      
      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.message || `圖片上傳失敗`);
      }
      
      // 獲取上傳後的URL
      const uploadResult = await uploadResponse.json();
      console.log(uploadResult);
      const finalUrl = uploadResult.url || `/api/images/bakery/${fileName}`;
      // 添加時間戳到URL以防止快取
      const noCacheUrl = `${finalUrl}?t=${Date.now()}`;
      
      // 更新表單數據中的圖片URL為實際的伺服器URL
      setFormData(prev => {
        const updatedImages = [...(prev.productImages || [])];
        if (updatedImages[index]) {
          updatedImages[index] = {
            ...updatedImages[index],
            url: finalUrl,
            noCacheUrl: noCacheUrl, // 添加無快取URL
            file: undefined // 清除文件引用，因為已上傳完成
          };
        }
        return {
          ...prev,
          productImages: updatedImages
        };
      });
      
      // 更新預覽URLs
      setPreviewUrls(prev => {
        const newUrls = [...prev];
        if (newUrls[index]) {
          newUrls[index] = noCacheUrl; // 使用無快取URL
        }
        return newUrls;
      });
      
      // 標記此圖片上傳完成
      setUploadProgress(prev => ({...prev, [index]: true}));
      
      // 檢查是否所有圖片都已上傳完成
      const allUploaded = Object.values({...uploadProgress, [index]: true}).every(status => status === true);
      if (allUploaded) {
        setUploadingImages(false);
      }
      
      setSuccessMessage('圖片上傳成功');
      setTimeout(() => setSuccessMessage(''), 2000);
      
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      setError('上傳圖片失敗，請重試');
      
      // 標記上傳失敗，但不阻止其他圖片上傳
      setUploadProgress(prev => ({...prev, [index]: true}));
      
      // 檢查是否所有圖片處理完成（成功或失敗）
      const allProcessed = Object.values(uploadProgress).every(status => status === true);
      if (allProcessed) {
        setUploadingImages(false);
      }
    }
  };

  // 處理檔案上傳
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // 處理所有選中的文件
      const files = Array.from(e.target.files);
      
      // 重設上傳進度
      setUploadProgress({});
      setUploadingImages(true);
      
      // 逐一處理每個文件
      files.forEach((file, i) => {
        if (validateFile(file)) {
          // 使用 FileReader 創建本地預覽 URL
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const newPreviewUrl = e.target.result as string;
              setPreviewUrls(prevUrls => [...prevUrls, newPreviewUrl]);
              setUploadedImages(prevImages => [...prevImages, file]);
              
              // 計算當前索引，考慮已有的圖片數量
              const currentIndex = (formData.productImages?.length || 0) + i;
              // 準備上傳圖片
              uploadImage(file, currentIndex);
            }
          };
          reader.readAsDataURL(file);
        }
      });
      
      setError(null);
      setSuccessMessage('圖片處理中，請稍後...');
    }
    
    // 無論如何都清空檔案輸入框，以便可以再次選擇相同的檔案
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 處理圖片排序
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  // 處理拖放
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (index !== undefined) {
      setTargetIndex(index);
    }
    
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, index?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove('border-amber-500');
      dropAreaRef.current.classList.add('border-dashed');
      dropAreaRef.current.classList.remove('border-solid');
    }
    
    // 處理圖片排序
    if (index !== undefined && draggingIndex !== null && draggingIndex !== index) {
      // 獲取當前圖片列表的排序副本
      const currentImages = [...(formData.productImages || [])].sort((a, b) => a.sort - b.sort);
      
      // 使用當前索引獲取實際拖動的項目和目標位置
      const draggedItem = currentImages[draggingIndex];
      
      // 移除拖曳的項目
      currentImages.splice(draggingIndex, 1);
      
      // 插入到目標位置
      currentImages.splice(index, 0, draggedItem);
      
      // 重新計算排序號，確保連續且從1開始
      const updatedImages = currentImages.map((img, idx) => ({
        ...img,
        sort: idx + 1
      }));
      
      console.log('拖拽後的圖片排序:', updatedImages.map(img => img.sort));
      
      // 更新formData
      setFormData(prev => ({
        ...prev,
        productImages: updatedImages
      }));
      
      // 同時更新預覽URLs順序
      const sortedPreviewUrls = [...previewUrls];
      const draggedUrl = sortedPreviewUrls[draggingIndex];
      sortedPreviewUrls.splice(draggingIndex, 1);
      sortedPreviewUrls.splice(index, 0, draggedUrl);
      setPreviewUrls(sortedPreviewUrls);
      
      // 更新上傳的圖片檔案順序
      if (uploadedImages.length > 0) {
        const newUploadedImages = [...uploadedImages];
        if (draggingIndex < newUploadedImages.length) {
          const draggedFile = newUploadedImages[draggingIndex];
          newUploadedImages.splice(draggingIndex, 1);
          newUploadedImages.splice(Math.min(index, newUploadedImages.length), 0, draggedFile);
          setUploadedImages(newUploadedImages);
        }
      }
      
      // 顯示排序更新成功消息
      setSuccessMessage('圖片排序已更新');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
    
    // 處理從外部拖曳的新圖片
    if (index === undefined && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (validateFile(file)) {
        processImagePreview(file);
      }
    }
    
    setDraggingIndex(null);
    setTargetIndex(null);
  }, [draggingIndex, formData.productImages, previewUrls, uploadedImages]);

  // 移除圖片
  const handleRemoveImage = (index: number) => {
    // 更新formData
    const newProductImages = [...(formData.productImages || [])];
    newProductImages.splice(index, 1);
    
    // 更新排序號
    const updatedImages = newProductImages.map((img, idx) => ({
      ...img,
      sort: idx + 1
    }));
    
    setFormData(prev => ({
      ...prev,
      productImages: updatedImages
    }));
    
    // 更新預覽URLs
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
    
    // 更新上傳的圖片檔案
    if (index < uploadedImages.length) {
      const newUploadedImages = [...uploadedImages];
      newUploadedImages.splice(index, 1);
      setUploadedImages(newUploadedImages);
    }
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // 檢查令牌是否存在
      if (!accessToken) {
        handleAuthError('更新產品時缺少認證令牌', setError, setLoading, setShowAuthWarning);
        return;
      }
      
      // 檢查是否有圖片正在上傳中
      if (uploadingImages) {
        setError('請等待所有圖片上傳完成後再儲存');
        setSubmitting(false);
        return;
      }
      
      // 檢查是否有Blob URL需要上傳
      const hasBlobUrls = (formData.productImages || []).some(
        image => typeof image.url === 'string' && image.url.startsWith('blob:')
      );
      
      if (hasBlobUrls) {
        setError('有圖片尚未完成上傳，請等待所有圖片上傳完成後再儲存');
        setSubmitting(false);
        return;
      }
      
      // 處理所有圖片，確保排序正確
      // 先按照當前顯示的順序獲取圖片
      const orderedImages = [...(formData.productImages || [])].sort((a, b) => a.sort - b.sort);
      
      // 然後重新指定排序號
      const validImages = orderedImages.map((image, index) => {
        const newSort = index + 1;
        return {
          url: image.url,
          sort: newSort
        };
      });
      
      console.log('提交前的圖片排序:', validImages.map(img => img.sort));
      
      // 構建要提交的資料
      const requestBody: {
        name: string;
        description: string;
        price: number;
        discount_price: number | null;
        categoryId: number | null;
        status: string;
        specification: string;
        unit_code: string;
        productImages: {url: string, sort: number}[];
      } = {
        name: formData.name || '',
        description: formData.description || '',
        price: formData.price || 0,
        discount_price: formData.discount_price || null,
        categoryId: formData.categoryId || null,
        status: formData.status || 'active',
        specification: formData.specification || '',
        unit_code: formData.unit_code || '',
        productImages: validImages
      };
      
      // 發送請求
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('更新產品時認證失敗', setError, setLoading, setShowAuthWarning);
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '更新產品失敗');
      }
      
      setSuccessMessage('產品已成功更新');
      
      // 延遲後跳轉回產品列表
      setTimeout(() => {
        router.push('/admin/bakery/products');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
      setSuccessMessage(null);
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">編輯產品</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
        >
          返回
        </button>
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

      {/* 成功消息 */}
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
              <div className="sm:col-span-3">
                <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                  產品編號<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="id"
                    id="id"
                    required
                    value={formData.id || ''}
                    readOnly
                    className="shadow-sm bg-gray-100 focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
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
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  分類<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    value={formData.categoryId || ''}
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

              <div className="sm:col-span-3">
                <label htmlFor="unit_code" className="block text-sm font-medium text-gray-700">
                  單位代號
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="unit_code"
                    id="unit_code"
                    value={formData.unit_code || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        unit_code: e.target.value.toUpperCase()
                      }));
                    }}
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
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
                onDragOver={(e) => handleDragOver(e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e)}
              >
                <div className="space-y-1 text-center w-full">
                  {(formData.productImages && formData.productImages.length > 0) ? (
                    <div className="flex flex-col items-center w-full">
                      <p className="text-sm text-gray-900 font-medium mb-3">
                        已上傳 {formData.productImages.length} 張圖片
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4 w-full max-w-3xl">
                        {formData.productImages && [...formData.productImages]
                          .sort((a, b) => a.sort - b.sort) // 確保按sort屬性排序顯示
                          .map((image, displayIndex) => (
                            <div
                              key={`img-${image.sort}-${displayIndex}-${Date.now()}`} // 添加時間戳使key更唯一
                              className={`relative border rounded-md overflow-hidden group transition-all duration-200 ${
                                draggingIndex === displayIndex ? 'opacity-50' : 'opacity-100'
                              } ${
                                targetIndex === displayIndex ? 'border-amber-500 border-2' : 'border-gray-200'
                              }`}
                              draggable
                              onDragStart={() => handleDragStart(displayIndex)}
                              onDragOver={(e) => handleDragOver(e, displayIndex)}
                              onDrop={(e) => handleDrop(e, displayIndex)}
                            >
                              <div className="relative pt-[100%]">
                                <Image
                                  src={image.noCacheUrl || previewUrls[displayIndex] || `${image.url}?t=${Date.now()}`} // 優先使用無快取URL
                                  alt={`產品圖片 ${displayIndex + 1}`}
                                  fill
                                  className="object-cover"
                                  unoptimized={true} // 禁用Next.js的圖片優化，避免額外的快取層
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                                  <div className="hidden group-hover:flex items-center gap-1 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                    </svg>
                                    <span>拖曳排序</span>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow-sm invisible group-hover:visible">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(displayIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 flex justify-between">
                                <span>排序: {image.sort}</span>
                                <span>位置: {displayIndex + 1}</span>
                              </div>
                            </div>
                          ))}
                        
                        {/* 添加新圖片按鈕 */}
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors duration-200"
                          style={{ aspectRatio: '1/1' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="text-center p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="mt-2 text-sm text-gray-500 block">添加圖片</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">拖曳圖片可調整順序</p>
                      <p className="text-xs text-gray-500">圖片將使用產品名稱作為檔案名稱</p>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                      />
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
                            multiple
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 font-bold">僅支援JPG圖片格式</p>
                      <p className="text-xs text-gray-500">可一次選擇多張圖片上傳</p>
                      <p className="text-xs text-gray-500">圖片將使用產品名稱作為檔案名稱</p>
                      <p className="text-xs text-gray-500">建議尺寸：300x300像素</p>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">可上傳多張產品圖片，第一張圖片(排序1)將作為主圖顯示</p>
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
              disabled={submitting || uploadingImages}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${(submitting || uploadingImages) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {submitting ? '儲存中...' : uploadingImages ? '圖片上傳中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
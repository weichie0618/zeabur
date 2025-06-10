'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

// 定義動畫樣式
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slideUp 0.4s ease-out forwards;
  }
`;

export default function NewProduct() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // 新增檔案上傳狀態
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  
  // 預覽相關狀態
  const [showPreviewAnimation, setShowPreviewAnimation] = useState(false);
  
  // 分類列表
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // 表單狀態 - 只保留API所需欄位
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    discount_price: '',
    categoryId: '',
    status: 'active', // 預設為 active
    specification: '', // 新增產品規格欄位
    unit_code: '', // 新增單位代號欄位
    productImages: [] as ProductImage[] // 改為productImages陣列並指定類型
  });

  // 表單錯誤狀態
  const [formErrors, setFormErrors] = useState({
    id: false,
    name: false,
    price: false,
    categoryId: false
  });

  // 新增上傳狀態追蹤
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: boolean}>({});

  // 載入分類資料
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('無法獲取分類資料');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('載入分類失敗:', error);
        setErrorMessage('無法載入產品分類，請重新整理頁面');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // 處理輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    // 將欄位ID映射到API欄位
    let apiField = id;
    switch (id) {
      case 'product-name':
        apiField = 'name';
        break;
      case 'product-category':
        apiField = 'categoryId';
        break;
      case 'product-description':
        apiField = 'description';
        break;
      case 'product-price':
        apiField = 'price';
        break;
      case 'product-discount-price':
        apiField = 'discount_price';
        break;
      case 'product-status':
        apiField = 'status';
        break;
      case 'product-specification':
        apiField = 'specification';
        break;
      case 'unit_code':
        apiField = 'unit_code';
        break;
      default:
        apiField = id;
    }
    
    setFormData(prev => ({
      ...prev,
      [apiField]: value
    }));
    
    // 清除對應的錯誤狀態
    if (apiField === 'name' || apiField === 'price' || apiField === 'categoryId') {
      setFormErrors(prev => ({
        ...prev,
        [apiField]: false
      }));
    }
  };

  // 驗證檔案
  const validateFile = (file: File): boolean => {
    // 檢查檔案類型，只允許JPG檔案
    if (file.type !== 'image/jpeg') {
      setErrorMessage('請僅上傳JPG格式的圖片檔案');
      return false;
    }
    
    // 檢查檔案大小
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
      setErrorMessage('圖片檔案過大，請上傳小於10MB的圖片');
      return false;
    }
    
    // 檢查檔案是否為空
    if (file.size === 0) {
      setErrorMessage('無效的圖片檔案（檔案大小為0）');
      return false;
    }
    
    // 檢查產品名稱是否已填寫
    if (!formData.name.trim()) {
      setErrorMessage('請先填寫產品名稱，再上傳圖片');
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
          uploadImage(file, formData.productImages.length);
        }
      };
      reader.readAsDataURL(file);
      
      setErrorMessage('');
      setSuccessMessage('圖片處理中，請稍後...');
    } catch (error) {
      console.error('處理圖片預覽失敗:', error);
      setErrorMessage('處理圖片預覽失敗，請重試');
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
              const currentIndex = formData.productImages.length + i;
              // 準備上傳圖片
              uploadImage(file, currentIndex);
            }
          };
          reader.readAsDataURL(file);
        }
      });
      
      setErrorMessage('');
      setSuccessMessage('圖片處理中，請稍後...');
    }
    
    // 無論如何都清空檔案輸入框，以便可以再次選擇相同的檔案
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 修改上傳圖片功能
  const uploadImage = async (file: File, index: number) => {
    try {
      // 先添加一個臨時的圖片對象用於預覽，使用blob URL
      const tempImageObj: ProductImage = {
        url: URL.createObjectURL(file), // 臨時URL，實際上傳時會替換
        sort: formData.productImages.length + 1, // 新圖片的排序
        file: file // 保存文件引用，用於後續上傳
      };
      
      // 更新formData
      const updatedImages = [...formData.productImages, tempImageObj];
      
      // 確保排序正確
      const sortedImages = updatedImages.map((img, idx) => ({
        ...img,
        sort: idx + 1
      }));
      
      setFormData(prev => ({
        ...prev,
        productImages: sortedImages
      }));
      
      // 顯示動畫效果
      setShowPreviewAnimation(true);
      setTimeout(() => setShowPreviewAnimation(false), 1000);
      
      // 設定此圖片為上傳中
      setUploadingImages(true);
      setUploadProgress(prev => ({...prev, [index]: false}));
      
      // 立即開始上傳圖片
      const fileName = `${formData.name.trim().replace(/\s+/g, '_')}-${formData.id}-${index + 1}.jpg`;
      
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
      setErrorMessage('上傳圖片失敗，請重試');
      
      // 標記上傳失敗，但不阻止其他圖片上傳
      setUploadProgress(prev => ({...prev, [index]: true}));
      
      // 檢查是否所有圖片處理完成（成功或失敗）
      const allProcessed = Object.values(uploadProgress).every(status => status === true);
      if (allProcessed) {
        setUploadingImages(false);
      }
    }
  };

  // 處理圖片排序
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

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
      const currentImages = [...formData.productImages].sort((a, b) => a.sort - b.sort);
      
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
      const newUploadedImages = [...uploadedImages];
      const draggedFile = newUploadedImages[draggingIndex];
      newUploadedImages.splice(draggingIndex, 1);
      newUploadedImages.splice(Math.min(index, newUploadedImages.length), 0, draggedFile);
      setUploadedImages(newUploadedImages);
      
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
    const newProductImages = [...formData.productImages];
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
    const newUploadedImages = [...uploadedImages];
    newUploadedImages.splice(index, 1);
    setUploadedImages(newUploadedImages);
  };

  // 表單驗證
  const validateForm = () => {
    const errors = {
      id: !formData.id.trim(),
      name: !formData.name.trim(),
      price: !formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0,
      categoryId: !formData.categoryId
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('請填寫所有必填欄位');
      return;
    }
    
    // 檢查是否有圖片正在上傳中
    if (uploadingImages) {
      setErrorMessage('請等待所有圖片上傳完成後再儲存');
      return;
    }
    
    // 檢查是否有Blob URL需要上傳
    const hasBlobUrls = formData.productImages.some(
      image => image.url.startsWith('blob:')
    );
    
    if (hasBlobUrls) {
      setErrorMessage('有圖片尚未完成上傳，請等待所有圖片上傳完成後再儲存');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // 處理所有圖片，確保排序正確
      // 先按照當前顯示的順序獲取圖片
      const orderedImages = [...formData.productImages].sort((a, b) => a.sort - b.sort);
      
      // 然後重新指定排序號
      const validImages = orderedImages.map((image, index) => {
        const newSort = index + 1;
        return {
          url: image.url,
          sort: newSort
        };
      });
      
      console.log('提交前的圖片排序:', validImages.map(img => img.sort));
      
      // 準備API請求資料
      const apiData = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        categoryId: Number(formData.categoryId),
        productImages: validImages,
        specification: formData.specification || undefined, // 添加產品規格
        unit_code: formData.unit_code || undefined, // 添加單位代號
        status: formData.status || 'active'
      };
      
      // 發送API請求
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(apiData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage('產品新增成功');
        setShowSuccessModal(true);
        // 彈窗顯示後2秒再跳轉
        setTimeout(() => {
          router.push('/admin/bakery/products');
        }, 2000);
      } else {
        setErrorMessage(result.message || '產品新增失敗');
      }
    } catch (error) {
      console.error('新增產品時發生錯誤:', error);
      setErrorMessage('伺服器錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 關閉成功提示彈窗並導航
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/admin/bakery/products');
  };

  return (
    <div className="space-y-6">
      {/* 添加動畫樣式 */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">新增產品</h1>
        <Link
          href="/admin/bakery/products"
          className="inline-flex items-center text-sm text-gray-600 hover:text-amber-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回產品列表
        </Link>
      </div>

      {/* 成功提示彈窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity animate-fade-in"></div>
          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl transform transition-all animate-slide-up">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 animate-bounce">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">產品新增成功！</h3>
              <p className="mt-2 text-sm text-gray-500">
                您的產品「{formData.name}」已成功新增到系統中，即將返回產品列表頁面
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCloseSuccessModal}
                  className="inline-flex justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-150 ease-in-out"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">產品資訊</h2>
          <p className="mt-1 text-sm text-gray-500">請填寫以下表單來新增產品</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* 基本資訊區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">基本資訊</h3>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-id" className="block text-sm font-medium text-gray-700">
                  產品編號<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-id"
                    placeholder="輸入產品編號"
                    className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 ${formErrors.id ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    value={formData.id}
                    onChange={(e) => {
                      const { value } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        id: value
                      }));
                      if (value.trim()) {
                        setFormErrors(prev => ({
                          ...prev,
                          id: false
                        }));
                      }
                    }}
                    required
                  />
                  {formErrors.id && <p className="mt-1 text-sm text-red-600">請輸入產品編號</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
                  產品名稱<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-name"
                    placeholder="輸入產品名稱"
                    className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 ${formErrors.name ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">請輸入產品名稱</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-category" className="block text-sm font-medium text-gray-700">
                  產品分類<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="product-category"
                      className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 ${formErrors.categoryId ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    disabled={loadingCategories}
                  >
                    <option value="">選擇分類</option>
                    {loadingCategories ? (
                      <option value="" disabled>載入中...</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                  {formErrors.categoryId && <p className="mt-1 text-sm text-red-600">請選擇產品分類</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">
                  產品描述
                </label>
                <div className="mt-1">
                  <textarea
                    id="product-description"
                    rows={4}
                    placeholder="輸入產品描述"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 border-gray-300 rounded-md"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500">簡單描述這個產品的特點和賣點</p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="product-specification" className="block text-sm font-medium text-gray-700">
                  產品規格
                </label>
                <div className="mt-1">
                  <textarea
                    id="product-specification"
                    rows={3}
                    placeholder="輸入產品規格，例如：尺寸、重量、材質等"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 border-gray-300 rounded-md"
                    value={formData.specification}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500">填寫產品的詳細規格資訊，幫助顧客更好地了解產品</p>
              </div>

              {/* 價格區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4 pt-4 border-t border-gray-100">價格與狀態</h3>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">
                  售價<span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="product-price"
                    placeholder="0.00"
                    className={`focus:ring-amber-500 focus:border-amber-500 block w-full pl-7 pr-12 sm:text-base py-3 ${formErrors.price ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.price && <p className="mt-1 text-sm text-red-600">請輸入有效的產品售價</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-discount-price" className="block text-sm font-medium text-gray-700">
                  折扣價格
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="product-discount-price"
                    placeholder="0.00"
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-7 pr-12 sm:text-base py-3 border-gray-300 rounded-md"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">若有折扣，請填寫折扣後的價格</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-status" className="block text-sm font-medium text-gray-700">
                  產品狀態
                </label>
                <div className="mt-1">
                  <select
                    id="product-status"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={handleInputChange}
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
                    id="unit_code"
                    placeholder="輸入單位代號"
                    required
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-base py-3 border-gray-300 rounded-md"
                    value={formData.unit_code}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        unit_code: e.target.value.toUpperCase()
                      }));
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">例如：PCS、BOX、PKG、SET</p>
              </div>

              {/* 產品圖片區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4 pt-4 border-t border-gray-100">產品圖片</h3>
              </div>

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
                    {formData.productImages.length > 0 ? (
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
                <p className="mt-2 text-sm text-gray-600">可上傳多張產品圖片，第一張圖片將作為主圖顯示</p>
              </div>
            </div>

            <div className="mt-10 pt-5 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                onClick={() => router.push('/admin/bakery/products')}
                disabled={isSubmitting || uploadingImages}
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-amber-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center"
                disabled={isSubmitting || uploadingImages}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? '處理中...' : uploadingImages ? '圖片上傳中...' : '儲存產品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 

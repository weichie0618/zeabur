'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');
  
  // 預覽相關狀態
  const [previewUrl, setPreviewUrl] = useState<string>('');
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
    images: '' // 新增儲存圖片路徑
  });

  // 表單錯誤狀態
  const [formErrors, setFormErrors] = useState({
    id: false,
    name: false,
    price: false,
    categoryId: false
  });

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

  // 處理圖片上傳 - 改進支援圖片預覽
  const processImagePreview = async (file: File) => {
    try {
      // 設定檔案名稱為產品名稱和ID
      const fileName = `${formData.name.trim().replace(/\s+/g, '_')}-${formData.id}.jpg`;
      
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
      // 更新API路徑格式
      setUploadedImagePath(`/api/images/bakery/${fileName}`);
      
      // 更新表單數據中的圖片路徑
      setFormData(prev => ({
        ...prev,
        images: `/api/images/bakery/${fileName}`
      }));
      
      setErrorMessage('');
      setSuccessMessage('圖片已準備好上傳，將在儲存產品時一併處理');
    } catch (error) {
      console.error('處理圖片預覽失敗:', error);
      setErrorMessage('處理圖片預覽失敗，請重試');
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
    
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // 如果有上傳圖片，先處理圖片上傳
      if (uploadedImage) {
        const formDataUpload = new FormData();
        const fileName = `${formData.name.trim().replace(/\s+/g, '_')}-${formData.id}.jpg`;
        
        formDataUpload.append('file', uploadedImage, fileName);
        // 更新目標路徑為uploads/bakery
        formDataUpload.append('destination', 'uploads/bakery');
        
        // 發送圖片上傳請求
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.message || '圖片上傳失敗');
        }
      }
      
      // 準備API請求資料
      const apiData = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        categoryId: Number(formData.categoryId),
        images: uploadedImagePath, // 更新為上傳後的圖片路徑
        specification: formData.specification || undefined, // 添加產品規格
        unit_code: formData.unit_code || undefined, // 添加單位代號
        status: formData.status || 'active'
      };
      
      // 發送API請求
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    {uploadedImagePath ? (
                      <div className="flex flex-col items-center">
                        <div className={`mb-2 h-32 w-32 overflow-hidden rounded-md transition-all duration-300 ${showPreviewAnimation ? 'ring-4 ring-amber-400 scale-105' : ''}`}>
                          <Image
                            src={previewUrl || uploadedImagePath}
                            alt="產品圖片"
                            width={128}
                            height={128}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-900 font-medium">
                          <span className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${showPreviewAnimation ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                            已選擇圖片
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{uploadedImage?.name}</p>
                        <button 
                          type="button"
                          className="mt-3 text-xs text-red-600 hover:text-red-800"
                          onClick={() => {
                            setUploadedImage(null);
                            setUploadedImagePath('');
                            setPreviewUrl('');
                            setFormData(prev => ({ ...prev, images: '' }));
                          }}
                        >
                          移除圖片
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
                        <p className="text-xs text-gray-500">圖片將使用產品名稱作為檔案名稱</p>
                        <p className="text-xs text-gray-500">建議尺寸：300x200像素</p>
                      </>
                    )}
                  </div>
                </div>
                {uploadedImagePath && (
                  <p className="mt-2 text-sm text-green-600">圖片將保存為: {uploadedImagePath}</p>
                )}
              </div>
            </div>

            <div className="mt-10 pt-5 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                onClick={() => router.push('/admin/bakery/products')}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-amber-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? '處理中...' : '儲存產品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import { FaChevronUp } from 'react-icons/fa';
import { Product } from '../data/products';

// 需要從原始專案中匯入的類型
interface ApplicationFormType {
  name: string;
  phone: string;
  companyName: string;
  companyId: string;
  industry: string;
  email: string;
  address: string;
  selectedProducts: string[];
  captcha?: string;
  comments?: string;
}

interface Props {
  selectedProducts: string[];
  productsData: Product[];
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ApplicationForm({ selectedProducts, productsData, onBack, onSuccess }: Props) {
  const [form, setForm] = useState<ApplicationFormType>({
    name: '',
    phone: '',
    companyName: '',
    companyId: '',
    industry: '',
    email: '',
    address: '',
    selectedProducts,
    comments: ''
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ApplicationFormType, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 驗證碼相關狀態
  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaCanvas, setCaptchaCanvas] = useState<HTMLCanvasElement | null>(null);

  // 獲取選擇的產品資訊
  const selectedProductsData = useMemo(() => 
    productsData.filter(p => selectedProducts.includes(p.id)),
    [productsData, selectedProducts]
  );

  // 監聽滾動事件，以顯示/隱藏"回到頂部"按鈕
  useEffect(() => {
    // 去抖動函數
    const debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };

    const handleScroll = debounce(() => {
      setShowScrollTop(window.scrollY > 300);
    }, 100); // 100ms去抖動時間
    
    window.addEventListener('scroll', handleScroll as EventListener);
    return () => window.removeEventListener('scroll', handleScroll as EventListener);
  }, []);

  // 當選擇的產品更改時，更新表單
  useEffect(() => {
    setForm(prev => ({ ...prev, selectedProducts }));
  }, [selectedProducts]);

  // 生成隨機驗證碼
  const generateCaptcha = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 設置背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 隨機生成4-6位驗證碼
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const length = Math.floor(Math.random() * 3) + 4;
      let captchaText = '';
      
      for (let i = 0; i < length; i++) {
        const charIndex = Math.floor(Math.random() * chars.length);
        captchaText += chars.charAt(charIndex);
        
        // 繪製字符
        ctx.font = `${Math.floor(Math.random() * 10) + 20}px Arial`;
        ctx.fillStyle = `rgb(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)})`;
        ctx.fillText(
          chars.charAt(charIndex), 
          20 + i * 20, 
          30 + Math.random() * 10
        );
      }
      
      // 添加干擾線
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }
      
      setCaptcha(captchaText);
      setCaptchaCanvas(canvas);
    }
  }, []);

  // 初始化驗證碼
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // 表單處理
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // 清除該欄位的錯誤訊息
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  // 驗證碼處理
  const handleCaptchaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserCaptcha(e.target.value);
    setCaptchaError('');
  }, []);

  // 刷新驗證碼
  const refreshCaptcha = useCallback(() => {
    generateCaptcha();
    setUserCaptcha('');
  }, [generateCaptcha]);

  // 滾動到指定欄位
  const scrollToField = (fieldId: string) => {
    const element = document.getElementById(fieldId);
    if (element) {
      // 滾動到元素位置，留一些頂部空間
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 為欄位添加閃爍高亮效果
      element.classList.add('field-highlight');
      // 移除高亮效果
      setTimeout(() => {
        element.classList.remove('field-highlight');
      }, 2000);
      // 嘗試為欄位設置焦點
      element.focus();
    }
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationFormType, string>> = {};
    let firstErrorField: string | null = null;
    
    // 驗證各欄位
    if (!form.name) {
      newErrors.name = '請輸入姓名';
      firstErrorField = firstErrorField || 'name';
    }
    
    // 電話號碼驗證
    if (!form.phone) {
      newErrors.phone = '請輸入聯絡電話';
      firstErrorField = firstErrorField || 'phone';
    } else if (!/^(09|\+886|0)[0-9]{8,9}$/.test(form.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = '請輸入有效的電話號碼格式';
      firstErrorField = firstErrorField || 'phone';
    }
    
    if (!form.companyName) {
      newErrors.companyName = '請輸入公司名稱';
      firstErrorField = firstErrorField || 'companyName';
    }
    
    // 統編驗證
    if (!form.companyId) {
      newErrors.companyId = '請輸入公司統編';
      firstErrorField = firstErrorField || 'companyId';
    } else if (!/^\d{8}$/.test(form.companyId)) {
      newErrors.companyId = '統一編號必須為8位數字';
      firstErrorField = firstErrorField || 'companyId';
    }
    
    if (!form.industry) {
      newErrors.industry = '請選擇行業別';
      firstErrorField = firstErrorField || 'industry';
    }
    
    if (!form.email) {
      newErrors.email = '請輸入電子郵件';
      firstErrorField = firstErrorField || 'email';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = '電子郵件格式不正確';
      firstErrorField = firstErrorField || 'email';
    }
    
    if (!form.address) {
      newErrors.address = '請輸入收件地址';
      firstErrorField = firstErrorField || 'address';
    }
    
    // 驗證碼驗證
    if (!userCaptcha) {
      newErrors.captcha = '請輸入驗證碼';
      setCaptchaError('請輸入驗證碼');
      firstErrorField = firstErrorField || 'captcha';
    } else if (userCaptcha.toLowerCase() !== captcha.toLowerCase()) {
      newErrors.captcha = '驗證碼不正確';
      setCaptchaError('驗證碼不正確');
      firstErrorField = firstErrorField || 'captcha';
    } else {
      setCaptchaError('');
    }
    
    setFormErrors(newErrors);
    
    // 如果有錯誤，滾動到第一個錯誤欄位
    if (firstErrorField) {
      scrollToField(firstErrorField);
      return false;
    }
    
    return true;
  };

  // 表單提交
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防止重複提交
    if (isSubmitting) {
      return;
    }
    
    // 驗證表單
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // 呼叫API提交表單數據
        const response = await fetch('/api/sample-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });
        
        // 檢查回應
        if (!response.ok) {
          throw new Error(`伺服器回應錯誤: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('樣品申請成功:', result);
          setIsSubmitted(true);
          
          // 通知父組件提交成功，更新step為3
          if (onSuccess) {
            onSuccess();
          }
          
          // 顯示警告信息（如果有）
          if (result.warning) {
            console.warn('申請提交警告:', result.warning);
          }
        } else {
          // 處理API返回的錯誤
          throw new Error(result.error || '提交申請時發生錯誤');
        }
      } catch (error) {
        console.error('提交失敗:', error);
        alert(`提交申請失敗: ${error instanceof Error ? error.message : '請稍後再試'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 回到頂部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 獲取已選產品名稱
  const getSelectedProductNames = () => {
    return form.selectedProducts.map(id => {
      const product = productsData.find(p => p.id === id);
      return product ? product.name.split('｜')[1] : '';
    });
  };

  if (isSubmitted) {
    return null; // 不再渲染成功頁面
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-1/2">
        <form id="application-form" onSubmit={handleFormSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">填寫您的資料</h2>
          
          <div className="form-group">
            <label htmlFor="name" className="form-label">姓名</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
              placeholder="請輸入您的姓名"
            />
            {formErrors.name && <p className="form-error">{formErrors.name}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone" className="form-label">聯絡電話</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={`form-input ${formErrors.phone ? 'border-red-500' : ''}`}
              placeholder="請輸入您的聯絡電話"
            />
            {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="companyName" className="form-label">公司名稱</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              className={`form-input ${formErrors.companyName ? 'border-red-500' : ''}`}
              placeholder="請輸入公司名稱"
            />
            {formErrors.companyName && <p className="form-error">{formErrors.companyName}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="companyId" className="form-label">公司統編</label>
            <input
              type="text"
              id="companyId"
              name="companyId"
              value={form.companyId}
              onChange={handleChange}
              className={`form-input ${formErrors.companyId ? 'border-red-500' : ''}`}
              placeholder="請輸入公司統一編號"
            />
            {formErrors.companyId && <p className="form-error">{formErrors.companyId}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="industry" className="form-label">行業別</label>
            <select
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className={`form-input ${formErrors.industry ? 'border-red-500' : ''}`}
            >
              <option value="">請選擇行業別</option>
              <option value="烘焙坊／麵包店">烘焙坊／麵包店</option>
              <option value="咖啡廳／茶館">咖啡廳／茶館</option>
              <option value="超級市場／量販店">超級市場／量販店</option>
              <option value="便利商店">便利商店</option>
              <option value="餐廳／早午餐店">餐廳／早午餐店</option>
              <option value="飯店／旅館">飯店／旅館</option>
              <option value="學校／公司福利社">學校／公司福利社</option>
              <option value="網路電商平台">網路電商平台</option>
              <option value="市集／夜市／攤販">市集／夜市／攤販</option>
              <option value="外燴／餐飲供應商">外燴／餐飲供應商</option>
              <option value="航空公司／高鐵／長途巴士">航空公司／高鐵／長途巴士</option>
              <option value="醫院／療養院">醫院／療養院</option>
              <option value="其他">其他</option>
            </select>
            {formErrors.industry && <p className="form-error">{formErrors.industry}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">電子郵件</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`form-input ${formErrors.email ? 'border-red-500' : ''}`}
              placeholder="請輸入電子郵件地址"
            />
            {formErrors.email && <p className="form-error">{formErrors.email}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="address" className="form-label">收件地址</label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className={`form-input ${formErrors.address ? 'border-red-500' : ''}`}
              placeholder="請輸入完整收件地址"
              rows={3}
            ></textarea>
            {formErrors.address && <p className="form-error">{formErrors.address}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="comments" className="form-label">備註說明</label>
            <textarea
              id="comments"
              name="comments"
              value={form.comments || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="如有其他特殊需求，請在此說明"
              rows={3}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="captcha" className="form-label">驗證碼</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  id="captcha"
                  name="captcha"
                  value={userCaptcha}
                  onChange={handleCaptchaChange}
                  className={`form-input ${captchaError ? 'border-red-500' : ''}`}
                  placeholder="請輸入驗證碼"
                />
                {captchaError && <p className="form-error">{captchaError}</p>}
              </div>
              <div className="flex items-start gap-2">
                {captchaCanvas && (
                  <div 
                    className="bg-white border border-gray-200 rounded-md overflow-hidden cursor-pointer" 
                    onClick={refreshCaptcha}
                  >
                    <img 
                      src={captchaCanvas.toDataURL ? captchaCanvas.toDataURL() : ''} 
                      alt="驗證碼" 
                      className="h-12"
                    />
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={refreshCaptcha}
                  className="text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                >
                  看不清楚？換一張
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-1">請輸入上方圖片中的字符，不區分大小寫</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button 
              type="button" 
              onClick={onBack}
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-1"
              disabled={isSubmitting}
            >
              返回修改樣品
            </button>
            <button
              type="submit"
              className={`form-button flex-1 relative ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">提交樣品申請</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="loader"></div>
                    <span className="ml-2 text-white">處理中...</span>
                  </div>
                </>
              ) : (
                '提交樣品申請'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* 處理中覆蓋層 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold mb-2">請稍候</h3>
            <p className="text-gray-600">系統正在處理您的樣品申請...</p>
            <p className="text-gray-500 text-sm mt-4">請勿關閉頁面或重新整理</p>
          </div>
        </div>
      )}
      
      <div className="w-full lg:w-1/2">
        <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
          <h2 className="text-xl font-semibold mb-4">已選擇的樣品</h2>
          <div className="border-t border-gray-200 pt-4">
            {selectedProducts.length > 0 ? (
              <div className="space-y-4">
                {selectedProducts.map((id, index) => {
                  const product = productsData.find(p => p.id === id);
                  if (!product) return null;
                  
                  return (
                    <div key={id} className="flex gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100">
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index < 4}
                          loading={index < 4 ? "eager" : "lazy"}
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-sm font-medium line-clamp-2">{product.name.split('｜')[1]}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">尚未選擇任何樣品</p>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between font-bold text-lg">
              <span>樣品總數:</span>
              <span>{selectedProducts.length} 個</span>
            </div>
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop} 
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50"
        >
          <FaChevronUp />
        </button>
      )}
    </div>
  );
} 
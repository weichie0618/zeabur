'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useLiff } from '@/lib/LiffProvider';
import { useUserPoints } from '../../contexts/PointsContext';

// 表單驗證狀態接口
interface FormValidation {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  pickupDateTime?: boolean; // 新增自取日期時間驗證
}

// 訂單資料接口
interface OrderData {
  items: {
    product_id: number;
    quantity: number;
  }[];
  customer_details: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  shipping_method: string;
  payment_method: string;
  salesperson_code?: string;
  points_used?: number; // 新增使用的點數
}

// 配送方式類型
type ShippingMethod = 'takkyubin_payment' | 'takkyubin_cod' | 'pickup';

// 客戶資料介面
interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  lineId?: string;
  customerId?: string;
  tempAddress?: string; // 添加暫存地址欄位
  taxId?: string; // 添加統編欄位
  carrier?: string; // 添加載具欄位
  pickupDateTime?: string; // 添加自取日期時間欄位
  discountCode?: string; // 新增優惠碼欄位
}

export default function CheckoutPage() {
  const router = useRouter();
  const { liff, profile, isLoggedIn, isLoading: liffLoading, customerData, updateCustomerData } = useLiff();
  const { points: userPoints, loading: pointsLoading, refreshPoints } = useUserPoints(); // 使用點數hook
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('takkyubin_payment');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cod' | 'line_pay'>('line_pay');
  const [pointsToUse, setPointsToUse] = useState<number>(0); // 新增點數使用數量
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '', // 新增統編
    carrier: '', // 新增載具
    pickupDateTime: '', // 新增自取日期時間
    invoiceType: 'taxId' as 'taxId' | 'carrier', // 新增發票類型選擇
    discountCode: '' // 新增優惠碼欄位
  });
  const [validation, setValidation] = useState<FormValidation>({
    name: true,
    email: true,
    phone: true,
    address: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  
  // 新增優惠碼相關狀態
  const [discountValidation, setDiscountValidation] = useState<{
    isValid: boolean;
    message: string;
    discount?: number;
    discount_type?: string;
    discount_value?: number;
  } | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  // 新增modal狀態管理
  const [discountModal, setDiscountModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [modalMessage, setModalMessage] = useState('');



  // 新增錯誤追蹤狀態
  const [debugErrors, setDebugErrors] = useState<string[]>([]);

  // 處理優惠碼modal開關
  const toggleDiscountModal = () => {
    setDiscountModal(!discountModal);
    // 重置狀態
    setModalStatus('idle');
    setModalMessage('');
  };

  // 從 localStorage 獲取客戶資料的輔助函數
  const getCustomerDataFromLocalStorage = (): CustomerData | null => {
    try {
      const savedCustomerData = localStorage.getItem('customerData');
      if (savedCustomerData) {
        const parsedData = JSON.parse(savedCustomerData) as CustomerData;
        console.log('從 localStorage 讀取到客戶資料:', parsedData);
        
        // 調試輸出 lineId 資訊
        if (parsedData && parsedData.lineId) {
          console.log('從 localStorage 讀取到 LINE ID:', parsedData.lineId);
        } else {
          console.warn('localStorage 中的客戶資料不包含 LINE ID');
        }
        
        return parsedData;
      }
    } catch (e) {
      console.error('解析本地客戶資料失敗', e);
    }
    return null;
  };

  // 從 localStorage 獲取購物車資料
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('bakeryCart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('無法載入購物車資料', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
    
    // 嘗試從 localStorage 加載客戶數據
    const localCustomerData = getCustomerDataFromLocalStorage();
    if (localCustomerData) {
      setFormData(prev => ({
        ...prev,
        customerName: localCustomerData.name || prev.customerName,
        email: localCustomerData.email || prev.email,
        phone: localCustomerData.phone || prev.phone,
        address: localCustomerData.address || prev.address,
        // 使用非類型安全的方式訪問屬性
        taxId: (localCustomerData as any).taxId || prev.taxId,
        carrier: (localCustomerData as any).carrier || prev.carrier,
        // 根據已有資料設定預設發票類型
        invoiceType: (localCustomerData as any).taxId ? 'taxId' : 
                    (localCustomerData as any).carrier ? 'carrier' : prev.invoiceType,
        discountCode: (localCustomerData as any).discountCode || prev.discountCode // 新增優惠碼
      }));
    }
  }, []);

  // 如果有LIFF用戶資料，自動填充表單
  useEffect(() => {
    if (isLoggedIn && profile && !liffLoading) {
      console.log('從 LIFF 獲取到用戶資料:', profile);
      console.log('LINE 用戶 ID:', profile.userId || '未獲取到 ID');
      setFormData(prev => ({
        ...prev,
        customerName: profile.displayName || prev.customerName,
        email: profile.email || prev.email,
      }));
    }
  }, [isLoggedIn, profile, liffLoading]);

  // 如果有客戶資料，自動填充表單
  useEffect(() => {
    // 先檢查從 LiffProvider 中獲取的客戶資料
    if (customerData) {
      console.log('從 LiffProvider 中獲取的客戶資料:', customerData);
      setFormData(prev => ({
        ...prev,
        customerName: customerData.name || prev.customerName,
        email: customerData.email || prev.email,
        phone: customerData.phone || prev.phone,
        address: customerData.address || prev.address,
        // 使用非類型安全的方式訪問屬性
        taxId: (customerData as any).taxId || prev.taxId,
        carrier: (customerData as any).carrier || prev.carrier,
        // 根據已有資料設定預設發票類型
        invoiceType: (customerData as any).taxId ? 'taxId' : 
                    (customerData as any).carrier ? 'carrier' : prev.invoiceType,
        discountCode: (customerData as any).discountCode || prev.discountCode // 新增優惠碼
      }));
      console.log('已從 LiffProvider 中獲取的客戶資料自動填充表單', customerData);
      return;
    }

    // 如果沒有從 LiffProvider 獲取資料，則檢查本地儲存
    if (isLoggedIn && !liffLoading && profile && profile.userId) {
      console.log('LINE 用戶已登入，ID:', profile.userId);
      
      const localCustomerData = getCustomerDataFromLocalStorage();
      if (localCustomerData) {
        setFormData(prev => ({
          ...prev,
          customerName: localCustomerData.name || prev.customerName,
          email: localCustomerData.email || prev.email,
          phone: localCustomerData.phone || prev.phone,
          address: localCustomerData.address || prev.address,
          // 使用非類型安全的方式訪問屬性
          taxId: (localCustomerData as any).taxId || prev.taxId,
          carrier: (localCustomerData as any).carrier || prev.carrier,
          // 根據已有資料設定預設發票類型
          invoiceType: (localCustomerData as any).taxId ? 'taxId' : 
                      (localCustomerData as any).carrier ? 'carrier' : prev.invoiceType,
          discountCode: (localCustomerData as any).discountCode || prev.discountCode // 新增優惠碼
        }));
        console.log('已從儲存的客戶資料中自動填充表單', localCustomerData);
      }
    }
  }, [isLoggedIn, liffLoading, profile, customerData]);

  // 購物車為空時，導回首頁
  useEffect(() => {
    if (!loading && cart.length === 0) {
      router.push('/client/bakery');
    }
  }, [cart, loading, router]);

  // 使用 useMemo 優化計算商品小計
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // 計算運費
  const shippingFee = useMemo(() => {
    // 自取不需要運費
    if (shippingMethod === 'pickup') {
      return 0;
    }
    
    // 訂單金額超過3500免運費，否則運費200元
    return subtotal >= 3500 ? 0 : 200;
  }, [shippingMethod, subtotal]);

  // 計算折扣金額
  const discountAmount = useMemo(() => {
    console.log('開始計算折扣 - 輸入數據:', {
      discountValidation,
      subtotal,
      isValid: discountValidation?.isValid,
      discountType: discountValidation?.discount_type,
      discountValue: discountValidation?.discount_value
    });
    
    if (!discountValidation || !discountValidation.isValid || !discountValidation.discount_value) {
      console.log('無效折扣或折扣值為0，返回折扣金額: 0');
      return 0;
    }

    // 轉換discount_value為數字類型
    const discountValue = typeof discountValidation.discount_value === 'string' 
      ? parseFloat(discountValidation.discount_value) 
      : discountValidation.discount_value;
    
    // 根據折扣類型計算折扣金額
    const discountType = (discountValidation.discount_type || '').toUpperCase();
    if (discountType === 'PERCENTAGE') {
      // 百分比折扣計算並無條件捨去小數點
      const calculatedDiscount = Math.floor((subtotal * discountValue) / 100);
      console.log('百分比折扣計算:', {
        formula: `Math.floor(${subtotal} × ${discountValue}% ÷ 100)`,
        subtotal,
        discountPercentage: discountValue,
        result: calculatedDiscount
      });
      return calculatedDiscount;
    } else {
      // FIXED_AMOUNT 類型
      const fixedDiscount = Math.min(subtotal, discountValue);
      console.log('固定金額折扣計算:', {
        discountValue: discountValue,
        subtotal,
        appliedDiscount: fixedDiscount,
        limited: fixedDiscount < discountValue ? '是 (已限制不超過小計)' : '否'
      });
      return fixedDiscount; // 確保折扣不超過小計
    }
  }, [discountValidation, subtotal]);

  // 計算點數折抵金額
  const pointsDiscount = useMemo(() => {
    // 點數1:1抵扣，但不能超過總金額（不含點數折抵前）
    const maxDiscount = subtotal - discountAmount + shippingFee;
    return Math.min(pointsToUse, maxDiscount);
  }, [pointsToUse, subtotal, discountAmount, shippingFee]);

  // 計算總金額（含點數折抵）
  const total = useMemo(() => {
    const calculatedTotal = subtotal - discountAmount + shippingFee - pointsDiscount;
    console.log('訂單金額計算:', {
      subtotal,
      discountAmount,
      shippingFee,
      pointsDiscount,
      total: calculatedTotal
    });
    return Math.max(0, calculatedTotal); // 確保總金額不為負數
  }, [subtotal, discountAmount, shippingFee, pointsDiscount]);



  // 計算預設自取日期時間（D+3，不含週六，固定15:00）
  const calculateDefaultPickupDateTime = (): string => {
    const today = new Date();
    let futureDate = new Date(today);
    
    // 先加3天
    futureDate.setDate(today.getDate() + 3);
    
    // 檢查是否為週六 (6 代表週六)
    if (futureDate.getDay() === 6) {
      // 如果是週六，再加2天變成週一
      futureDate.setDate(futureDate.getDate() + 2);
    }
    
    // 設定時間為 15:00
    futureDate.setHours(15, 0, 0, 0);
    
    // 格式化為 YYYY-MM-DDTHH:MM 格式，以便用於 datetime-local 輸入框
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const hours = String(futureDate.getHours()).padStart(2, '0');
    const minutes = String(futureDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 表單值變更處理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 正常更新欄位
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 重置此欄位的驗證狀態
    setValidation({
      ...validation,
      [name.replace('customer', '').toLowerCase()]: true
    });
  };

  // 處理發票類型選擇
  const handleInvoiceTypeChange = (type: 'taxId' | 'carrier') => {
    // 只有在對應欄位有值時才允許選擇
    if ((type === 'taxId' && formData.taxId) || (type === 'carrier' && formData.carrier)) {
      setFormData({
        ...formData,
        invoiceType: type
      });
    }
  };

  // 配送方式變更處理
  const handleShippingMethodChange = (method: ShippingMethod) => {
    // 暫存當前配送方式以便比較
    const prevMethod = shippingMethod;
    
    // 更新配送方式
    setShippingMethod(method);
    
    // 根據選擇的配送方式設置預設付款方式
    if (method === 'pickup') {
      // 自取默認為 LINE Pay
      setPaymentMethod('line_pay');
    } else if (method === 'takkyubin_payment') {
      // 黑貓宅配默認為 LINE Pay 
      setPaymentMethod('line_pay');
    }
    
    // 如果切換到自取，重置地址驗證狀態和地址欄位
    if (method === 'pickup') {
      // 如果從其他配送方式切換到自取，暫存地址資訊並清空地址欄位
      if (prevMethod !== 'pickup' && formData.address) {
        // 將地址暫存到localStorage中的tempAddress欄位
        try {
          // 取得現有的客戶資料
          const localData = getCustomerDataFromLocalStorage() || {};
          // 添加暫存地址
          localStorage.setItem('customerData', JSON.stringify({
            ...localData,
            tempAddress: formData.address
          }));
          
          // 清空表單中的地址欄位，設置預設自取日期時間
          setFormData(prev => ({
            ...prev,
            address: '',
            pickupDateTime: calculateDefaultPickupDateTime() // 設置預設自取日期時間
          }));
        } catch (error) {
          console.error('暫存地址失敗', error);
        }
      } else if (prevMethod !== 'pickup' && !formData.pickupDateTime) {
        // 如果沒有地址需要暫存，但需要設置預設自取日期時間
        setFormData(prev => ({
          ...prev,
          pickupDateTime: calculateDefaultPickupDateTime()
        }));
      }
      
      // 重置地址驗證狀態，啟用自取日期時間驗證
      setValidation(prev => ({
        ...prev,
        address: true,
        pickupDateTime: true
      }));
    } else if (prevMethod === 'pickup') {
      // 從自取切換到其他配送方式，嘗試恢復之前暫存的地址
      try {
        const localData = getCustomerDataFromLocalStorage();
        if (localData && localData.tempAddress) {
          // 恢復之前的地址
          setFormData(prev => ({
            ...prev,
            address: localData.tempAddress || '',
            pickupDateTime: '' // 清空自取日期時間
          }));
          
          // 可以選擇性地從localStorage中移除暫存地址
          const updatedData = {...localData};
          delete updatedData.tempAddress;
          localStorage.setItem('customerData', JSON.stringify(updatedData));
        } else if (localData && localData.address) {
          // 如果沒有暫存地址但有正常保存的地址，使用它
          setFormData(prev => ({
            ...prev,
            address: localData.address || '',
            pickupDateTime: '' // 清空自取日期時間
          }));
        }
      } catch (error) {
        console.error('恢復地址失敗', error);
      }
    }
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newValidation = {
      name: !!formData.customerName,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      phone: /^09\d{8}$/.test(formData.phone),
      // 如果是自取，則驗證自取日期時間而非地址
      address: shippingMethod === 'pickup' ? true : !!formData.address,
      // 如果是自取，則檢查自取日期時間是否已填寫
      pickupDateTime: shippingMethod === 'pickup' ? !!formData.pickupDateTime : true
    };

    setValidation(newValidation);
    return Object.values(newValidation).every(v => v);
  };

  // 格式化口味選擇為文本
  const formatSelectedFlavors = (selectedFlavors?: {[key: string]: number}): string => {
    if (!selectedFlavors || Object.keys(selectedFlavors).length === 0) return '';
    
    return Object.entries(selectedFlavors)
      .filter(([_, count]) => count > 0)
      .map(([flavor, count]) => `${flavor} x${count}`)
      .join('、');
  };

  // 處理點數輸入變化
  const handlePointsChange = (value: number) => {
    // 計算可折抵的最大金額（小計 - 優惠碼折扣 + 運費）
    const maxDiscountAmount = subtotal - discountAmount + shippingFee;
    const maxPoints = Math.min(userPoints, maxDiscountAmount);
    const validPoints = Math.max(0, Math.min(value, maxPoints));
    setPointsToUse(validPoints);
  };

  // 使用全部可用點數
  const useAllPoints = () => {
    // 計算可折抵的最大金額（小計 - 優惠碼折扣 + 運費）
    const maxDiscountAmount = subtotal - discountAmount + shippingFee;
    const maxPoints = Math.min(userPoints, maxDiscountAmount);
    setPointsToUse(maxPoints);
  };

  // 監控總計變化，自動調整點數使用量
  useEffect(() => {
    if (pointsToUse > 0) {
      // 計算當前可折抵的最大金額
      const maxDiscountAmount = subtotal - discountAmount + shippingFee;
      const maxPoints = Math.min(userPoints, maxDiscountAmount);
      
      // 如果當前使用的點數超過最大可用點數，自動調整
      if (pointsToUse > maxPoints) {
        setPointsToUse(maxPoints);
        console.log('自動調整點數使用量:', {
          original: pointsToUse,
          adjusted: maxPoints,
          reason: '總計金額變更導致可用點數減少'
        });
      }
    }
  }, [subtotal, discountAmount, shippingFee, userPoints, pointsToUse]);

  // 新增驗證優惠碼的函數
  const validateDiscountCode = async () => {
    // 清除之前的驗證結果
    setDiscountValidation(null);
    
    // 檢查是否有輸入優惠碼
    if (!formData.discountCode) {
      return;
    }
    
    try {
      setIsValidatingDiscount(true);
      setModalStatus('loading'); // 設置Modal狀態為處理中
      
      // 從 LIFF SDK 或 localStorage 獲取 LINE ID
      let lineUserId: string | null = null;
      
      // 首先嘗試從 LIFF SDK 獲取
      if (isLoggedIn && profile && profile.userId) {
        lineUserId = profile.userId;
      } else {
        // 嘗試從 localStorage 獲取
        const localCustomerData = getCustomerDataFromLocalStorage();
        if (localCustomerData && localCustomerData.lineId) {
          lineUserId = localCustomerData.lineId;
        }
      }
      
      // 如果在開發環境且沒有獲取到 LINE ID，使用臨時 ID
      if (!lineUserId && process.env.NODE_ENV === 'development') {
        lineUserId = 'dev_' + Date.now();
      }
      
      if (!lineUserId) {
        setModalStatus('error');
        setModalMessage('無法獲取您的 LINE ID，請確保已登入 LINE');
        throw new Error('無法獲取您的 LINE ID，請確保已登入 LINE');
      }
      
      // 呼叫後端 API 驗證優惠碼
      const response = await fetch(`/api/discounts/validate/${formData.discountCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: lineUserId
        }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setDiscountValidation({
          isValid: true,
          message: '優惠碼有效',
          discount: data.discount_code.discount_value,
          discount_type: data.discount_code.discount_type,
          discount_value: data.discount_code.discount_value
        });
        setModalStatus('success');
        setModalMessage('優惠碼折扣已套用');
        
        // 成功時延遲關閉modal
        setTimeout(() => {
          setDiscountModal(false);
        }, 1500);
      } else {
        setDiscountValidation({
          isValid: false,
          message: data.message || '優惠碼無效'
        });
        setModalStatus('error');
        setModalMessage(data.message || '優惠碼無效');
        
        // 錯誤時延遲關閉modal
        setTimeout(() => {
          setDiscountModal(false);
        }, 1500);
      }
    } catch (error: any) {
      setDiscountValidation({
        isValid: false,
        message: error.message || '驗證優惠碼時發生錯誤'
      });
      setModalStatus('error');
      setModalMessage(error.message || '驗證優惠碼時發生錯誤');
      
      // 錯誤時延遲關閉modal
      setTimeout(() => {
        setDiscountModal(false);
      }, 1500);
    } finally {
      setIsValidatingDiscount(false);
    }
  };
  
  // 優惠碼輸入完畢後自動驗證
  useEffect(() => {
    // 註釋或移除此段自動驗證邏輯，改為使用者手動點擊驗證
    // const timer = setTimeout(() => {
    //   if (formData.discountCode && formData.discountCode.length >= 3) {
    //     validateDiscountCode();
    //   }
    // }, 500);
    
    // return () => clearTimeout(timer);
  }, [formData.discountCode]);

  // 處理結帳提交
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFormError('請填寫所有必填欄位並確保格式正確');
      return;
    }

    // 檢查是否在 LINE 應用內 - 開發環境下忽略此檢查
    // if (liff && !liff.isInClient() && process.env.NODE_ENV !== 'development') {
    //   setFormError('請在 LINE 應用內完成訂單，以確保能正確關聯您的 LINE 帳號');
    //   return;
    // }

    // 從 LIFF SDK 或 localStorage 獲取 LINE ID
    let lineUserId: string | null = null;
    
    // 首先嘗試從 LIFF SDK 獲取
    if (isLoggedIn && profile && profile.userId) {
      lineUserId = profile.userId;
      console.log('從 LIFF SDK 成功獲取 LINE 用戶 ID:', lineUserId);
    } else {
      console.warn('無法從 LIFF SDK 獲取 LINE 用戶 ID，嘗試從 localStorage 讀取');
      
      // 嘗試從 localStorage 獲取
      const localCustomerData = getCustomerDataFromLocalStorage();
      if (localCustomerData && localCustomerData.lineId) {
        lineUserId = localCustomerData.lineId;
        console.log('從 localStorage 成功獲取 LINE 用戶 ID:', lineUserId);
      }
    }
    
    // 如果仍然無法獲取 LINE ID，設置默認值或在開發環境中繼續 - 僅用於開發目的
    if (!lineUserId && process.env.NODE_ENV === 'development') {
      lineUserId = 'dev_' + Date.now();
      console.warn('開發環境下使用臨時 LINE ID:', lineUserId);
    } else if (!lineUserId) {
      console.error('未能獲取 LINE 用戶 ID (LIFF 和 localStorage 均失敗)');
      
      // 顯示適當的錯誤訊息
      if (!isLoggedIn) {
        setFormError('您尚未登入 LINE，請重新登入後再試');
      } else if (!profile) {
        setFormError('無法獲取您的 LINE 個人資料，請確認已授權應用存取您的資料');
      } else {
        setFormError('無法獲取您的 LINE 用戶 ID，請確保您已在 LINE 應用中登入並授權');
      }
      
      // 如果 LIFF 物件存在，嘗試重新登入
      if (liff && !isLoggedIn) {
        setTimeout(() => {
          try {
            liff.login();
          } catch (error) {
            console.error('LIFF 登入失敗', error);
          }
        }, 2000);
      }
      
      return;
    }

    setFormError(null);
    setSubmitting(true);
    setPaymentStatus('processing');

    // 將當前客戶資料保存到 Context 和 localStorage
    const customerDataToSave = {
      name: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      taxId: formData.taxId,
      carrier: formData.carrier,
      pickupDateTime: formData.pickupDateTime,
      invoiceType: formData.invoiceType,
      discountCode: formData.discountCode, // 保存優惠碼
      points_used: pointsToUse // 新增點數使用數量
    };
    
    // 使用 LiffProvider 提供的方法更新客戶資料
    updateCustomerData(customerDataToSave);
    console.log('結帳頁面: 已更新客戶資料', customerDataToSave);

    // 獲取運費與付款方式
    // 處理不同配送方式下的付款方式
    let paymentMethodForApi = '';
    
    // 根據配送方式和付款選擇設定對應的API值
    if (paymentMethod === 'line_pay') {
      paymentMethodForApi = 'line_pay';// linepay
    } else if (shippingMethod === 'pickup' && paymentMethod === 'cod') {
      paymentMethodForApi = 'cash';  // 自取現場付款
    } else if (paymentMethod === 'bank_transfer') {
      paymentMethodForApi = 'bank_transfer';// 匯款
    } 
    // else if (paymentMethod === 'cod') {
    //   paymentMethodForApi = 'cod';  // 貨到付款
    // }

    // 嘗試從 localStorage 獲取客戶資料
    const localCustomerData = getCustomerDataFromLocalStorage();
    console.log('結帳頁面: 從 localStorage 獲取的客戶資料:', localCustomerData);

    // 處理自取地址，包含預計自取日期時間
    const addressForApi = shippingMethod === 'pickup' 
      ? `自取 - 預計自取時間: ${formData.pickupDateTime}` 
      : formData.address;

    // 準備訂單資料（根據新的 API 規格調整）
    const orderData = {
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        // 添加口味資訊到訂單項目備註中
        order_item_notes: formatSelectedFlavors(item.selectedFlavors) || '',
        unit_code: item.unit_code
      })),
      customer_info: {
        name: formData.customerName,
        email: formData.email,
        phone: formData.phone
      },
      shipping_address: {
        recipientName: formData.customerName,
        phone: formData.phone,
        address1: addressForApi,
        city: "", // 可以根據需求添加這些字段
        postal_code: ""
      },
      // 新增配送方式與付款方式
      shipping_method: shippingMethod,
      payment_method: paymentMethodForApi,
      shipping_fee: shippingFee,
      // 自取時間資訊（如果是自取）
      pickup_datetime: shippingMethod === 'pickup' ? formData.pickupDateTime : '',
      // 選填項目
      salesperson_code: localCustomerData?.customerId || "", 
      // 使用獲取到的 LINE 用戶 ID
      lineid: lineUserId,
      // 新增統編和載具資訊，只傳送選中的類型
      taxId: formData.invoiceType === 'taxId' ? formData.taxId : '',
      carrier: formData.invoiceType === 'carrier' ? formData.carrier : '',
      // 新增優惠碼
      discount_code: formData.discountCode || '',
      points_used: pointsToUse // 新增點數使用數量
    };

    // LINE 用戶資訊記錄（用於調試）
    console.log('LINE 用戶資訊已添加至訂單:', {
      userId: lineUserId,
      displayName: profile?.displayName || '未獲取'
    });

    try {
      // 呼叫後端 API 建立訂單
      const response = await fetch('/api/orders/create/bakery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '建立訂單失敗');
      }

      // 處理LINE Pay支付
      if (paymentMethod === 'line_pay') {
        // 檢查是否需要跳過支付（例如：使用點數完全折抵）
        if (data.skip_payment) {
          console.log('使用點數完全折抵，跳過支付流程');
          
          // 跳轉到確認頁面，不進行支付流程
          // 導向訂單確認頁面
          const orderItems = data.order.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            order_item_notes: item.order_item_notes || ''
          }));
          
          // 將訂單數據編碼為 URL 安全的字符串
          const encodedItems = encodeURIComponent(JSON.stringify(orderItems));
          
          // 清空購物車
          localStorage.removeItem('bakeryCart');
          setPaymentStatus('success');
          
          // 獲取API返回的運費（如果有）
          const shippingFeeFromAPI = data.order.shipping_fee || shippingFee;
          
          // 添加自取日期時間參數
          const pickupDateTimeParam = shippingMethod === 'pickup' ? `&pickupDateTime=${encodeURIComponent(formData.pickupDateTime)}` : '';
          
          // 添加折扣金額參數
          const discountParam = discountAmount > 0 ? `&discount=${discountAmount}` : '';
          
          // 添加 skip_payment 參數，標識這是零付款情況
          const skipPaymentParam = '&skip_payment=true&payment_status=completed';
          
          router.push(`/client/checkout/confirmation?orderNumber=${data.order.order_number}&orderId=${data.order.id}&totalAmount=${data.order.total_amount}&items=${encodedItems}&shippingMethod=${shippingMethod}&paymentMethod=${paymentMethod}&shippingFee=${shippingFeeFromAPI}${pickupDateTimeParam}${discountParam}${skipPaymentParam}`);
          return;
        }
        
        // 正常的 LINE Pay 支付流程
        // 發送 LINE FLEX 訊息（如果在 LINE App 中）
        const activeLiff = liff;
        if (activeLiff && activeLiff.isInClient && activeLiff.isInClient() && activeLiff.sendMessages) {
          try {
            // 構建 FLEX 訊息
            const flexMessage = [{
              type: 'text',
              text: data.order.order_number // 添加普通文字訊息
            }, {
              type: "flex",
              altText: `訂單編號 ${data.order.order_number} 建立成功，LINE Pay支付`,
              contents: {
                type: "bubble",
                header: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "訂單已建立",
                      size: "xl",
                      align: "center",
                      weight: "bold",
                      color: "#ffffff"
                    }
                  ],
                  backgroundColor: "#06C755",  // LINE Pay綠色
                  paddingAll: "md"
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#E6F7ED",  // 淺綠色背景
                      paddingAll: "md",
                      cornerRadius: "md",
                      contents: [
                        {
                          type: "text",
                          text: "LINE Pay 付款",
                          size: "md",
                          weight: "bold",
                          align: "center",
                          color: "#06C755",
                          wrap: true
                        }
                      ]
                    },
                    {
                      type: "separator",
                      margin: "md"
                    },
                    {
                      type: "text",
                      text: `訂單編號：${data.order.order_number || "未提供"}`,
                      size: "sm",
                      color: "#333333",
                      margin: "md"
                    },
                    {
                      type: "text",
                      text: "訂單明細",
                      weight: "bold",
                      color: "#06C755",
                      margin: "lg",
                      size: "md"
                    },
                    ...(data.order.items && data.order.items.length > 0 ? data.order.items.map((item: any) => ({
                      type: "box",
                      layout: "vertical",
                      margin: "md",
                      contents: [
                        {
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            {
                              type: "text",
                              text: `${item.product_name.replace(/\r\n/g, '')} x${item.quantity}`,
                              size: "sm",
                              color: "#555555",
                              flex: 5,
                              margin: "sm"
                            },
                            {
                              type: "text",
                              text: `$${item.subtotal}`,
                              size: "sm",
                              align: "end",
                              color: "#111111",
                              flex: 2
                            }
                          ]
                        },
                        // 添加口味備註的顯示
                        ...(item.order_item_notes ? [{
                          type: "text",
                          text: `[口味: ${item.order_item_notes}]`,
                          size: "xs",
                          color: "#888888",
                          margin: "sm",
                          wrap: true
                        }] : [])
                      ]
                    })) : [{
                      type: "text",
                      text: "無法獲取訂單明細",
                      size: "sm",
                      color: "#555555",
                      align: "center"
                    }]),
                    
                    // 運費顯示（如果有運費）
                    ...(data.order.shipping_fee && data.order.shipping_fee > 0 ? [{
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "運費",
                          size: "sm",
                          color: "#333333"
                        },
                        {
                          type: "text",
                          text: `$${data.order.shipping_fee}`,
                          size: "sm",
                          align: "end",
                          color: "#111111"
                        }
                      ]
                    }] : []),
                    
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "總計",
                          size: "sm",
                          weight: "bold",
                          color: "#333333"
                        },
                        {
                          type: "text",
                          text: `$${data.order.total_amount}`,
                          size: "sm",
                          align: "end",
                          weight: "bold",
                          color: "#111111"
                        }
                      ]
                    },
                    
                    {
                      type: "separator",
                      margin: "lg"
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#E6F7ED",
                      paddingAll: "md",
                      cornerRadius: "md",
                      margin: "lg",
                      contents: [
                        {
                          type: "text",
                          text: shippingMethod === 'pickup' ? "自取資訊" : "配送資訊",
                          weight: "bold",
                          color: "#06C755",
                          size: "md",
                          align: "center"
                        },
                        {
                          type: "text",
                          text: shippingMethod === 'pickup' 
                            ? "桃園市蘆竹區油管路一段696號"
                            : "商品將以黑貓宅急便低溫冷凍配送",
                          size: "sm",
                          color: "#444444",
                          align: "center",
                          margin: "sm",
                          wrap: true
                        },
                        // 自取日期時間顯示
                        ...(shippingMethod === 'pickup' && formData.pickupDateTime ? [{
                          type: "text",
                          text: "預計自取時間",
                          weight: "bold",
                          color: "#06C755",
                          size: "sm",
                          align: "center",
                          margin: "md"
                        }, {
                          type: "text",
                          text: (() => {
                            try {
                              const dt = new Date(formData.pickupDateTime);
                              const year = dt.getFullYear();
                              const month = String(dt.getMonth() + 1).padStart(2, '0');
                              const day = String(dt.getDate()).padStart(2, '0');
                              const hours = String(dt.getHours()).padStart(2, '0');
                              const minutes = String(dt.getMinutes()).padStart(2, '0');
                              return `${year}年${month}月${day}日 ${hours}:${minutes}`;
                            } catch (e) {
                              return formData.pickupDateTime;
                            }
                          })(),
                          size: "sm",
                          color: "#06C755",
                          align: "center",
                          margin: "sm",
                          weight: "bold"
                        }] : [])
                      ]
                    },
                    {
                      type: "text",
                      text: "若有任何問題，請透過LINE與我們聯繫\n謝謝！",
                      size: "xs",
                      color: "#888888",
                      align: "center",
                      wrap: true,
                      margin: "md"
                    }
                  ]
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "感謝您的訂購",
                      size: "sm",
                      align: "center",
                      color: "#aaaaaa"
                    }
                  ]
                }
              }
            }];

            // 發送 FLEX 訊息
            await activeLiff.sendMessages(flexMessage);
            console.log('LINE Pay FLEX 訊息已發送');
          } catch (error) {
            console.error('發送 LINE FLEX 訊息失敗', error);
            // 即使發送訊息失敗，仍然繼續處理支付流程
          }
        }

        // 重定向到LINE Pay支付頁面
        if (data.linepay && data.linepay.paymentUrl) {
          // 根據是否在手機 app 中選擇適當的 LINE Pay URL
          
          localStorage.removeItem('bakeryCart');
          
          try {
            if (activeLiff && activeLiff.isInClient && activeLiff.isInClient()) {
              // 在 LINE App 中，使用 app URL
              const paymentUrl = 'https://joinmeet.sunnyhausbakery.com.tw/client/payment-redirect?url=' + encodeURIComponent(data.linepay.paymentUrl.app);
              console.log('LINE App 中，嘗試開啟支付頁面:', paymentUrl);
              
              // 檢查 openWindow 方法是否存在
              if (activeLiff.openWindow) {
                activeLiff.openWindow({
                  url: paymentUrl,
                  external: true
                });
                
                // 可選：延遲關閉 LIFF 窗口（給用戶時間看到跳轉）
                setTimeout(() => {
                  if (activeLiff.closeWindow) {
                    console.log('關閉 LIFF 窗口');
                    activeLiff.closeWindow();
                  }
                }, 1000); // 1秒後關閉
              } 
            } else {
              // 在瀏覽器中，使用 web URL
              const paymentUrl = 'https://joinmeet.sunnyhausbakery.com.tw/client/payment-redirect?url=' + encodeURIComponent(data.linepay.paymentUrl.web);
              console.log('瀏覽器中，嘗試開啟支付頁面:', paymentUrl);
              
              if (activeLiff && activeLiff.openWindow) {
                activeLiff.openWindow({
                  url: paymentUrl,
                  external: true
                });
                
                // 可選：延遲關閉 LIFF 窗口（給用戶時間看到跳轉）
                setTimeout(() => {
                  if (activeLiff.closeWindow) {
                    console.log('關閉 LIFF 窗口');
                    activeLiff.closeWindow();
                  }
                }, 1000); // 1秒後關閉
              }
            }
          } catch (error: any) {
            const errorMsg = `支付頁面重定向失敗: ${error.message || error}`;
            console.error(errorMsg, error);
            setDebugErrors(prev => [...prev, errorMsg]);
            
            // 嘗試備用方案：直接重定向
          
          }
          return;
        } else {
          throw new Error('無法獲取LINE Pay支付連結');
        }
      }

      // 導向訂單確認頁面
      const orderItems = data.order.items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        order_item_notes: item.order_item_notes || ''
      }));
      
      // 將訂單數據編碼為 URL 安全的字符串
      const encodedItems = encodeURIComponent(JSON.stringify(orderItems));
      
      // 清空購物車 - 僅在訂單成功建立後執行
      localStorage.removeItem('bakeryCart');
      setPaymentStatus('success');
      
      // 獲取API返回的運費（如果有）
      const shippingFeeFromAPI = data.order.shipping_fee || shippingFee;
      
      // 添加自取日期時間參數
      const pickupDateTimeParam = shippingMethod === 'pickup' ? `&pickupDateTime=${encodeURIComponent(formData.pickupDateTime)}` : '';
      
      // 添加折扣金額參數
      const discountParam = discountAmount > 0 ? `&discount=${discountAmount}` : '';
      
      router.push(`/client/checkout/confirmation?orderNumber=${data.order.order_number}&orderId=${data.order.id}&totalAmount=${data.order.total_amount}&items=${encodedItems}&shippingMethod=${shippingMethod}&paymentMethod=${paymentMethod}&shippingFee=${shippingFeeFromAPI}${pickupDateTimeParam}${discountParam}`);
    } catch (error: any) {
      const errorMsg = `結帳失敗: ${error.message || error}`;
      console.error('結帳失敗', error);
      setDebugErrors(prev => [...prev, errorMsg]);
      setFormError('結帳過程中發生錯誤，請稍後再試');
      setPaymentStatus('failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 頁面初次載入或配送方式變更時，設置預設自取日期時間
  useEffect(() => {
    // 如果是自取模式且沒有設置自取日期時間，則設置預設值
    if (shippingMethod === 'pickup' && !formData.pickupDateTime) {
      setFormData(prev => ({
        ...prev,
        pickupDateTime: calculateDefaultPickupDateTime()
      }));
    }
  }, [shippingMethod, formData.pickupDateTime]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">結帳</h1>
        <div className="h-1 w-20 bg-amber-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側 - 購物車商品概覽與顧客資料輸入表單 */}
        <div className="lg:col-span-2">
          {/* 手機版先顯示配送方式 */}
          <div className="lg:hidden bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">配送與付款</h2>
            
            {/* 配送方式選擇 */}
            <div className="mb-5">
              <h3 className="font-medium text-gray-700 mb-3">選擇配送方式</h3>
              <div className="space-y-3">
                {/* 黑貓宅配 */}
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${shippingMethod === 'takkyubin_payment' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleShippingMethodChange('takkyubin_payment')}
                >
                  <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                    {shippingMethod === 'takkyubin_payment' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">黑貓宅配(冷凍)</div>
                    <div className="text-sm text-gray-500">全台配送，商品以低溫冷凍宅配</div>
                  </div>
                </div>
                
                {/* 自取 */}
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${shippingMethod === 'pickup' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleShippingMethodChange('pickup')}
                >
                  <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                    {shippingMethod === 'pickup' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">自取</div>
                    <div className="text-sm text-gray-500">桃園市蘆竹區油管路一段696號</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 付款方式選擇 */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">選擇付款方式</h3>
              <div className="space-y-3">
                {/* 黑貓宅配的付款選項 */}
                {shippingMethod === 'takkyubin_payment' && (
                  <>
                    {/* LINE Pay */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'line_pay' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('line_pay')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'line_pay' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium flex items-center">
                          <span className="ml-1 px-2 py-0.5 bg-green-600 text-white rounded-md text-sm font-bold">LINE Pay</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">使用LINE Pay線上支付</div>
                      </div>
                    </div>
                    
                    {/* 匯款 */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'bank_transfer' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('bank_transfer')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'bank_transfer' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">ATM 轉帳/匯款</div>
                        <div className="text-sm text-gray-500 mt-1">完成訂單後顯示匯款資訊</div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* 自取的付款選項 */}
                {shippingMethod === 'pickup' && (
                  <>
                    {/* LINE Pay */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'line_pay' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('line_pay')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'line_pay' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium flex items-center"> 
                          <span className="ml-1 px-2 py-0.5 bg-green-600 text-white rounded-md text-sm font-bold">LINE Pay</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">使用LINE Pay線上支付</div>
                      </div>
                    </div>
                    
                    {/* 取貨時付款 */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'cod' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">取貨時付款</div>
                        <div className="text-sm text-gray-500 mt-1">現場取貨時付款</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* 總覽區域 */}
            {paymentMethod && (
              <div className="p-4 mt-5 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">配送方式:</span>
                  <span className="font-medium">{shippingMethod === 'pickup' ? '自取' : '黑貓宅配'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">付款方式:</span>
                  <span className="font-medium">
                    {paymentMethod === 'line_pay' && 'LINE Pay'}
                    {paymentMethod === 'bank_transfer' && 'ATM 轉帳/匯款'}
                    {paymentMethod === 'cod' && '取貨時付款'}
                  </span>
                </div>
              </div>
            )}
            
            {/* 移除手機版優惠折扣碼按鈕 */}
          </div>

          {/* 商品列表 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">訂購商品</h2>
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.id} className="py-4 flex items-center">
                  <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                    <Image 
                      src={item.images} 
                      alt={item.name} 
                      fill 
                      style={{ objectFit: 'cover' }} 
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">數量: {item.quantity}</p>
                    {item.selectedFlavors && (
                      <p className="text-xs text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-full mt-1">
                        {formatSelectedFlavors(item.selectedFlavors)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.price * item.quantity)}</p>
                    <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">小計</span>
                <span className="font-medium">${subtotal}</span>
              </div>

              {/* 優惠碼折扣顯示 */}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center mt-2 text-green-600">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 17h.01M17 7h.01M17 17h.01M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                    </svg>
                    優惠碼折扣
                  </span>
                  <span>- ${discountAmount.toFixed(0)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 font-medium">運費</span>
                <span className="font-medium">
                  
                  {shippingMethod !== 'pickup' && shippingFee > 0 && (
                    <span className="text-xs text-gray-500 ml-2">（訂單需滿$3,500免運費）</span>
                  )}
                  {shippingMethod === 'pickup' ? '免運費' : (
                    shippingFee === 0 ? '免運費' : `$${shippingFee}`
                  )}
                </span>
              </div>

              {pointsDiscount > 0 && (
                <div className="flex justify-between items-center mt-2 text-blue-600">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    點數折抵
                  </span>
                  <span>- ${pointsDiscount.toFixed(0)}</span>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 text-lg">
                <span className="font-bold">總計</span>
                <span className="font-bold text-amber-600">${total}</span>
              </div>
            </div>
          </div>

          {/* 移動優惠折扣碼按鈕到商品列表下方 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <button 
              type="button"
              onClick={toggleDiscountModal}
              className="w-full flex items-center justify-center py-3 px-4 border border-amber-500 text-amber-600 rounded-md hover:bg-amber-50 transition-colors focus:outline-none md:focus-visible:outline-2 md:focus-visible:outline-amber-500 touch-manipulation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 17h.01M17 7h.01M17 17h.01M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
              </svg>
              輸入優惠折扣碼
            </button>

            {/* 點數折抵區域 */}
            {isLoggedIn && (
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                {/* 簡化標題 */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">使用點數</h3>
                </div>

                <div className="p-4">
                  {userPoints > 0 ? (
                    <div className="space-y-3">
                      {/* 可用點數與全部使用按鈕同行 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600">
                          可用: {pointsLoading ? '載入中...' : `${userPoints.toLocaleString()} 點`}
                        </div>
                        <button
                          type="button"
                          onClick={useAllPoints}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 active:scale-95"
                        >
                         
                          全部使用
                        </button>
                      </div>
                      
                      {/* 點數輸入 */}
                      <div className="relative">
                        <div className="relative flex items-center">
                          {/* <div className="absolute left-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div> */}
                          <input
                            type="number"
                            value={pointsToUse}
                            onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                            min="0"
                            max={Math.min(userPoints, subtotal - discountAmount + shippingFee)}
                            className="w-full pl-11 pr-16 py-3 text-lg font-medium border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:from-white focus:to-blue-50 transition-all duration-200 placeholder-gray-400"
                            placeholder="0"
                          />
                          <div className="absolute right-3 flex items-center">
                            <span className="text-blue-600 font-semibold text-sm bg-blue-100 px-2 py-1 rounded-full">
                              點
                            </span>
                          </div>
                        </div>

                      </div>
                      
                     
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 可用點數顯示 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600">
                          可用: {pointsLoading ? '載入中...' : '0 點'}
                        </div>
                      </div>
                      
                      {/* 點數輸入框 - 禁用狀態 */}
                      <div className="relative">
                        <div className="relative flex items-center">
                          <div className="absolute left-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <input
                            type="number"
                            value={0}
                            disabled
                            className="w-full pl-11 pr-16 py-3 text-lg font-medium border-2 border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-500"
                            placeholder="0"
                          />
                          <div className="absolute right-3 flex items-center">
                            <span className="text-gray-500 font-semibold text-sm bg-gray-200 px-2 py-1 rounded-full">
                              點
                            </span>
                          </div>
                        </div>

                      </div>
                      
                      {/* 點數回饋提示 */}
                      <div className="text-center py-2">
                        <p className="text-gray-400 text-xs">完成購買後可獲得 10% 點數回饋</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 顧客資料表單 */}
          <form onSubmit={handleCheckoutSubmit} className="bg-white rounded-lg shadow-md p-6" id="checkoutForm">
            <h2 className="text-xl font-semibold mb-4">顧客資料</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="customerName" className="block text-gray-700 mb-1">姓名(收件者) *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="請輸入您的姓名"
                  required
                />
                {!validation.name && <p className="text-red-500 text-sm mt-1">請輸入姓名</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-1">電子郵件 *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="example@email.com"
                  required
                />
                {!validation.email && <p className="text-red-500 text-sm mt-1">請輸入有效的電子郵件</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="phone" className="block text-gray-700 mb-1">手機號碼 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${!validation.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="09XXXXXXXX"
                  required
                />
                {!validation.phone && <p className="text-red-500 text-sm mt-1">請輸入有效的手機號碼（格式：09XXXXXXXX）</p>}
              </div>
              
              {/* 如果是自取，顯示自取日期時間；否則顯示地址欄位 */}
              {shippingMethod === 'pickup' ? (
                <div>
                  <label htmlFor="pickupDateTime" className="block text-gray-700 mb-1">預計自取日期時間 *</label>
                  <input
                    type="datetime-local"
                    id="pickupDateTime"
                    name="pickupDateTime"
                    value={formData.pickupDateTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${!validation.pickupDateTime ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {!validation.pickupDateTime && <p className="text-red-500 text-sm mt-1">請選擇預計自取日期時間</p>}
                  <p className="text-gray-500 text-sm mt-1">預設時間為下單日後3天(不含周六)下午3點</p>
                  <p className="text-gray-500 text-sm mt-1">可自行調整其他時間</p>
                  <p className="text-gray-500 text-sm">自取地址：桃園市蘆竹區油管路一段696號</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="address" className="block text-gray-700 mb-1">收件地址 *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${!validation.address ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="請輸入您的詳細地址"
                    required
                  />
                  {!validation.address && <p className="text-red-500 text-sm mt-1">請輸入收件地址</p>}
                </div>
              )}
            </div>

            {/* 增加統編和載具欄位 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="taxId" className="block text-gray-700 mb-1">統一編號 (選填)</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md border-gray-300"
                  placeholder="請輸入統一編號"
                />
                {/* 當統編和載具都有值時，顯示選擇器 */}
                {formData.taxId && formData.carrier && (
                  <div 
                    className={`flex items-center p-2 mt-2 border rounded-md cursor-pointer transition-colors ${
                      formData.invoiceType === 'taxId' 
                        ? 'border-amber-500 bg-amber-100' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleInvoiceTypeChange('taxId')}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500 mr-2 flex items-center justify-center">
                      {formData.invoiceType === 'taxId' && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">使用統一編號</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="carrier" className="block text-gray-700 mb-1">載具編號 (選填)</label>
                <input
                  type="text"
                  id="carrier"
                  name="carrier"
                  value={formData.carrier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md border-gray-300"
                  placeholder="/手機條碼載具"
                />
                {/* 當統編和載具都有值時，顯示選擇器 */}
                {formData.taxId && formData.carrier && (
                  <div 
                    className={`flex items-center p-2 mt-2 border rounded-md cursor-pointer transition-colors ${
                      formData.invoiceType === 'carrier' 
                        ? 'border-amber-500 bg-amber-100' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleInvoiceTypeChange('carrier')}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500 mr-2 flex items-center justify-center">
                      {formData.invoiceType === 'carrier' && (
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">使用載具編號</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {formData.taxId && formData.carrier && (
              <div className="mb-4 text-sm text-amber-600 mt-2">
                <p>請選擇要使用的類型（統一編號和載具編號只能擇一使用）</p>
              </div>
            )}
            
            <div className="mb-4 text-sm text-gray-500">
              <p>註：統一編號和載具編號只能擇一使用</p>
            </div>
            
            {/* 只在開發環境顯示的 Debug 信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 bg-gray-100 p-3 rounded-md text-xs">
                <div className="flex justify-between mb-2">
                  <span>Debug 模式</span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        // 檢查 localStorage 中的 LINE ID
                        const localCustomerData = getCustomerDataFromLocalStorage();
                        const localStorageLineId = localCustomerData?.lineId || '未獲取';
                        
                        console.log('目前顧客資料狀態:', {
                          formData,
                          customerData,
                          profile,
                          lineIdFromProfile: profile?.userId || '未獲取',
                          lineIdFromLocalStorage: localStorageLineId,
                          localStorage: getCustomerDataFromLocalStorage()
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      檢查數據
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        console.log('LIFF已由LiffProvider管理');
                      }}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      初始化LIFF
                    </button>
                    <button 
                      type="button"
                      onClick={async () => {
                        // 測試發送 LIFF 訊息
                        const activeLiff = liff;
                        if (!activeLiff) {
                          const error = 'LIFF 物件不存在，請確保 LIFF 已正確初始化';
                          console.error(error);
                          setDebugErrors(prev => [...prev, error]);
                          alert(error);
                          return;
                        }
                        
                        if (!activeLiff.isInClient || !activeLiff.isInClient()) {
                          const error = '目前不在 LINE 應用中，無法發送訊息';
                          console.warn(error);
                          setDebugErrors(prev => [...prev, error]);
                          alert(error);
                          return;
                        }
                        
                        if (!activeLiff.sendMessages) {
                          const error = 'sendMessages 方法不存在';
                          console.error(error);
                          setDebugErrors(prev => [...prev, error]);
                          alert(error);
                          return;
                        }
                        
                        try {
                          // 構建測試訊息
                          const testMessage = [{
                            type: 'text',
                            text: '🧪 測試訊息'
                          }, {
                            type: "flex",
                            altText: "LIFF sendMessages 測試",
                            contents: {
                              type: "bubble",
                              header: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                  {
                                    type: "text",
                                    text: "🧪 測試訊息",
                                    size: "xl",
                                    align: "center",
                                    weight: "bold",
                                    color: "#ffffff"
                                  }
                                ],
                                backgroundColor: "#06C755",
                                paddingAll: "md"
                              },
                              body: {
                                type: "box",
                                layout: "vertical",
                                spacing: "md",
                                contents: [
                                  {
                                    type: "text",
                                    text: "LIFF sendMessages() 測試成功！",
                                    size: "md",
                                    weight: "bold",
                                    align: "center",
                                    color: "#06C755",
                                    wrap: true
                                  },
                                  {
                                    type: "separator",
                                    margin: "md"
                                  },
                                  {
                                    type: "text",
                                    text: `測試時間：${new Date().toLocaleString('zh-TW')}`,
                                    size: "sm",
                                    color: "#333333",
                                    margin: "md",
                                    align: "center"
                                  },
                                  {
                                    type: "text",
                                    text: "🎯 功能測試項目：",
                                    weight: "bold",
                                    color: "#06C755",
                                    margin: "lg",
                                    size: "md"
                                  },
                                  {
                                    type: "text",
                                    text: "✅ LIFF 初始化\n✅ LINE App 環境檢測\n✅ sendMessages API\n✅ FLEX Message 格式",
                                    size: "sm",
                                    color: "#555555",
                                    margin: "sm",
                                    wrap: true
                                  }
                                ]
                              },
                              footer: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                  {
                                    type: "text",
                                    text: "開發測試完成",
                                    size: "sm",
                                    align: "center",
                                    color: "#aaaaaa"
                                  }
                                ]
                              }
                            }
                          }];
                          
                          console.log('發送測試訊息:', testMessage);
                          await activeLiff.sendMessages(testMessage);
                          console.log('✅ 測試訊息發送成功！');
                          setDebugErrors(prev => [...prev, '✅ 測試訊息發送成功！']);
                          alert('✅ 測試訊息發送成功！請檢查您的 LINE 聊天室');
                        } catch (error: any) {
                          const errorMsg = `❌ 測試訊息發送失敗: ${error.message || error}`;
                          console.error(errorMsg, error);
                          setDebugErrors(prev => [...prev, errorMsg]);
                          alert(errorMsg);
                        }
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      測試LIFF訊息
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDebugErrors([])}
                      className="text-red-600 hover:text-red-800"
                    >
                      清除錯誤
                    </button>
                  </div>
                </div>
                <div>
                  <div>Profile: {profile ? '已載入' : '未載入'}</div>
                  <div>CustomerData: {customerData ? '已載入' : '未載入'}</div>
                  <div>LINE ID (LIFF): {profile?.userId || '未獲取'}</div>
                  <div>LINE ID (localStorage): {(() => {
                    const localCustomerData = getCustomerDataFromLocalStorage();
                    return localCustomerData?.lineId || '未獲取';
                  })()}</div>
                  <div>LIFF 物件 (Provider): {liff ? '存在' : '不存在'}</div>
                  <div>在 LINE App 中: {(() => {
                    return liff && liff.isInClient ? (liff.isInClient() ? '是' : '否') : '未知';
                  })()}</div>
                  <div>sendMessages 可用: {liff && liff.sendMessages ? '是' : '否'}</div>
                  <div>openWindow 可用: {liff && liff.openWindow ? '是' : '否'}</div>
                </div>
                
                {/* 錯誤訊息顯示 */}
                {debugErrors.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-red-700 font-medium mb-1">錯誤記錄:</div>
                    <div className="max-h-32 overflow-y-auto">
                      {debugErrors.map((error, index) => (
                        <div key={index} className="text-red-600 text-xs mb-1 break-words">
                          {new Date().toLocaleTimeString()}: {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* 右側 - 配送方式與確認訂單 */}
        <div className="lg:col-span-1">
          {/* 大螢幕才顯示配送方式區塊 */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">配送與付款</h2>
            
            {/* 配送方式選擇 */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">選擇配送方式</h3>
              <div className="space-y-3">
                {/* 黑貓宅配 */}
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${shippingMethod === 'takkyubin_payment' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleShippingMethodChange('takkyubin_payment')}
                >
                  <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                    {shippingMethod === 'takkyubin_payment' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">黑貓宅配(冷凍)</div>
                    <div className="text-sm text-gray-500">全台配送，商品以低溫冷凍宅配</div>
                  </div>
                </div>
                
                {/* 自取 */}
                <div 
                  className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${shippingMethod === 'pickup' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleShippingMethodChange('pickup')}
                >
                  <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                    {shippingMethod === 'pickup' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">自取</div>
                    <div className="text-sm text-gray-500">至桃園市蘆竹區油管路一段696號<br/>自取商品</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 付款方式選擇 */}
            <div className="mb-5">
              <h3 className="font-medium text-gray-700 mb-3">選擇付款方式</h3>
              <div className="space-y-3">
                {/* 黑貓宅配的付款選項 */}
                {shippingMethod === 'takkyubin_payment' && (
                  <>
                    {/* LINE Pay */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'line_pay' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('line_pay')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'line_pay' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium flex items-center">
                          <span className="ml-1 px-2 py-0.5 bg-green-600 text-white rounded-md text-sm font-bold">LINE Pay</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">使用LINE Pay線上支付</div>
                      </div>
                    </div>
                    
                    {/* 匯款 */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'bank_transfer' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('bank_transfer')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'bank_transfer' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">ATM 轉帳/匯款</div>
                        <div className="text-sm text-gray-500 mt-1">完成訂單後顯示匯款資訊</div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* 自取的付款選項 */}
                {shippingMethod === 'pickup' && (
                  <>
                    {/* LINE Pay */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'line_pay' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('line_pay')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'line_pay' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium flex items-center"> 
                          <span className="ml-1 px-2 py-0.5 bg-green-600 text-white rounded-md text-sm font-bold">LINE Pay</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">使用LINE Pay線上支付</div>
                      </div>
                    </div>
                    
                    {/* 取貨時付款 */}
                    <div 
                      className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-amber-600">
                        {paymentMethod === 'cod' && <div className="w-3 h-3 bg-amber-600 rounded-full"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">取貨時付款</div>
                        <div className="text-sm text-gray-500 mt-1">現場取貨時付款</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* 總覽區域 */}
            {paymentMethod && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">配送方式:</span>
                  <span className="font-medium">{shippingMethod === 'pickup' ? '自取' : '黑貓宅配'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">付款方式:</span>
                  <span className="font-medium">
                    {paymentMethod === 'line_pay' && 'LINE Pay'}
                    {paymentMethod === 'bank_transfer' && 'ATM 轉帳/匯款'}
                    {paymentMethod === 'cod' && '取貨時付款'}
                  </span>
                </div>
              </div>
            )}
            
            {/* 移除桌面版優惠折扣碼按鈕 */}
            
          </div>
          
          {/* 訂單摘要 */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">訂單摘要</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">小計</span>
                <span className="font-medium">${subtotal.toFixed(0)}</span>
              </div>

              {/* 優惠碼折扣顯示 */}
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>優惠碼折扣</span>
                  <span>- ${discountAmount.toFixed(0)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">運費</span>
                <span className="font-medium">${shippingFee.toFixed(0)}</span>
              </div>

              {/* 點數折抵顯示 */}
              {pointsDiscount > 0 && (
                <div className="flex items-center justify-between text-blue-600">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    點數折抵
                  </span>
                  <span>- ${pointsDiscount.toFixed(0)}</span>
                </div>
              )}
              
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold text-lg">總計</span>
                <span className="font-bold text-xl text-amber-600">${total.toFixed(0)}</span>
              </div>
            </div>
            
            {/* 提交訂單按鈕 */}
            <button
              type="submit"
              form="checkoutForm" // 連結到表單ID
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-md font-medium transition-colors focus:outline-none md:focus-visible:outline-2 md:focus-visible:outline-white touch-manipulation disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  處理中...
                </span>
              ) : (
                '確認訂單'
              )}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              完成訂單即表示您同意我們的條款和條件
            </p>

            {/* 返回購物按鈕 */}
            <Link 
              href="/client/bakery#products" 
              className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 rounded-md flex items-center justify-center text-center mt-3 transition-colors"
              onClick={(e) => {
                // 確保不清空購物車（除非提交訂單成功）
                if (paymentStatus === 'success') {
                  // 如果訂單已成功，允許清空購物車
                  return;
                }
                
                // 在返回購物頁面前，確保購物車數據在 localStorage 中存在
                try {
                  const currentCart = localStorage.getItem('bakeryCart');
                  if (!currentCart && cart.length > 0) {
                    // 如果 localStorage 中沒有購物車數據但當前頁面有，則保存它
                    localStorage.setItem('bakeryCart', JSON.stringify(cart));
                    console.log('返回購物頁前保存購物車數據:', cart);
                  }
                } catch (error) {
                  console.error('保存購物車數據失敗:', error);
                }
              }}
            >
              返回購物
            </Link>
          </div>
        </div>
      </div>
      
      {/* 隱私權政策和服務條款連結 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          提交訂單即表示您同意我們的
          <Link href="/client/privacy-policy" className="text-amber-600 hover:text-amber-800 mx-1">隱私權政策</Link>
          和
          <Link href="/client/terms-of-service" className="text-amber-600 hover:text-amber-800 mx-1">服務條款</Link>
        </p>
      </div>
      
      {/* 優惠碼輸入 Modal */}
      {discountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            {modalStatus === 'loading' ? (
              /* 處理中狀態顯示 */
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 mb-4">
                  <svg className="animate-spin w-full h-full text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700">驗證優惠碼中...</p>
              </div>
            ) : modalStatus === 'success' ? (
              /* 成功狀態顯示 */
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 mb-4 text-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-green-600">{modalMessage}</p>
              </div>
            ) : modalStatus === 'error' ? (
              /* 錯誤狀態顯示 */
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 mb-4 text-red-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-red-600">{modalMessage}</p>
              </div>
            ) : (
              /* 默認輸入狀態 */
              <>
                <button 
                  onClick={toggleDiscountModal}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none md:focus-visible:outline-2 md:focus-visible:outline-gray-400 touch-manipulation disabled:opacity-50"
                  disabled={isValidatingDiscount}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h3 className="text-xl font-semibold mb-4">輸入優惠折扣碼</h3>
                
                <div className="mb-4">
                  <label htmlFor="discountCodeModal" className="block text-gray-700 mb-2">請輸入您的優惠碼</label>
                  <input
                    type="text"
                    id="discountCodeModal"
                    value={formData.discountCode}
                    onChange={(e) => setFormData({...formData, discountCode: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md border-gray-300"
                    placeholder="優惠碼"
                    disabled={isValidatingDiscount}
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={toggleDiscountModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none md:focus-visible:outline-2 md:focus-visible:outline-gray-500 touch-manipulation disabled:opacity-50"
                    disabled={isValidatingDiscount}
                  >
                    取消
                  </button>
                  
                  <button
                    type="button"
                    onClick={validateDiscountCode}
                    disabled={isValidatingDiscount || !formData.discountCode}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-300 transition-colors flex items-center focus:outline-none md:focus-visible:outline-2 md:focus-visible:outline-white touch-manipulation disabled:opacity-50"
                  >
                    確認
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 聲明 window.liff 類型
declare global {
  interface Window {
    liff: any;
  }
}
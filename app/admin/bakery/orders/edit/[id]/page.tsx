'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// 引入類型
import { Order, EditOrderForm } from '../../types';

// 引入API服務
import { fetchOrderDetail, updateOrder, fetchCustomers, updateOrderStatus } from '../../api';

// 引入狀態處理
import { getStatusDisplay, getStatusClass, getAvailableStatusTransitions } from '../../status';

// 引入常量
import { statusMap } from '../../constants';

// 引入工具函數
import { 
  initializeAuth, 
  handleAuthError, 
  handleRelogin, 
  setupAuthWarningAutoHide,
  formatCurrency,
  formatDate,
  getAuthHeaders,
  formatOrderData
} from '../../utils';

// 引入常量
import { 
  shippingMethodOptions,
  paymentMethodOptions,
  paymentStatusOptions,
  shippingStatusOptions
} from '../../constants';

// 引入共用組件
import AuthWarning from '../../components/AuthWarning';
import StatusUpdateModal from '../../components/StatusUpdateModal';

// 引入共用 Hook
import { useOrderStatusUpdate } from '../../hooks/useOrderStatusUpdate';

export default function EditOrder() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  
  // 顧客列表
  const [customers, setCustomers] = useState<Array<{id: string, companyName: string}>>([]);
  
  // 使用共用的狀態更新 Hook
  const { updateStatus, loading: statusUpdateLoading } = useOrderStatusUpdate({
    accessToken,
    onSuccess: (message) => {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError(error);
    }
  });
  
  // 編輯表單
  const [formData, setFormData] = useState<EditOrderForm>({
    customer_info: {
      name: '',
      email: '',
      phone: ''
    },
    shipping_address: {
      recipientName: '',
      phone: '',
      address1: '',
      city: '',
      postal_code: ''
    },
    status: '',
    payment_method: '',
    payment_status: '',
    shipping_method: '',
    shipping_status: '',
    notes: '',
    lineid: '',
    salesperson_id: '',
    carrier: '',
    taxId: '',
    shipping_fee: 0
  });
  
  // 初始化獲取認證令牌
  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 獲取顧客列表
  useEffect(() => {
    if (!accessToken) return;
    
    const loadCustomers = async () => {
      try {
        const customerData = await fetchCustomers(accessToken);
        setCustomers(customerData);
      } catch (err: any) {
        console.error('獲取顧客列表錯誤:', err.message);
        // 不顯示錯誤，因為這不是核心功能
      }
    };
    
    loadCustomers();
  }, [accessToken]);
  
  // 獲取訂單詳情
  useEffect(() => {
    if (!accessToken || !orderNumber) return;
    
    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const orderData = await fetchOrderDetail(accessToken, orderNumber);
        
        // 使用formatOrderData處理API返回的數據格式
        const formattedOrder = formatOrderData(orderData);
        setOrder(formattedOrder);
        
        // 初始化表單數據
        const newFormData: EditOrderForm = {
          customer_info: {
            name: formattedOrder.customer_name || '',
            email: formattedOrder.customer_email || '',
            phone: formattedOrder.customer_phone || ''
          },
          status: formattedOrder.status || '',
          payment_method: formattedOrder.payment_method || '',
          payment_status: formattedOrder.payment_status || '',
          shipping_method: formattedOrder.shipping_method || '',
          shipping_status: formattedOrder.shipping_status || '',
          notes: formattedOrder.notes || '',
          lineid: formattedOrder.lineid || '',
          salesperson_id: formattedOrder.salesperson_id || '',
          carrier: formattedOrder.carrier || '',
          taxId: formattedOrder.taxId || '',
          shipping_fee: formattedOrder.shipping_fee || 0
        };
        
        // 處理地址數據
        if (formattedOrder.address) {
          if (typeof formattedOrder.address === 'string') {
            newFormData.shipping_address = {
              address1: formattedOrder.address
            };
          } else {
            newFormData.shipping_address = {
              recipientName: formattedOrder.address.recipient_name || '',
              phone: formattedOrder.address.phone || '',
              address1: formattedOrder.address.address1 || '',
              city: formattedOrder.address.city || '',
              postal_code: formattedOrder.address.postal_code || ''
            };
          }
        }
        
        setFormData(newFormData);
      } catch (err: any) {
        if (err.message?.includes('認證失敗')) {
          handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
        } else {
          setError(err.message || '獲取訂單詳情失敗');
          setLoading(false);
        }
        console.error('獲取訂單詳情錯誤:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderDetails();
  }, [accessToken, orderNumber]);
  
  // 處理表單變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 處理嵌套屬性
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as Record<string, any>),
          [field]: value
        }
      }));
    } else if (name === 'shipping_fee') {
      // 處理運費，確保是數字
      setFormData(prev => ({
        ...prev,
        shipping_fee: parseFloat(value) || 0
      }));
    } else {
      // 處理普通屬性
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // 保存表單
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken || !order) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      await updateOrder(accessToken, order.id, formData);
      
      setSuccess('訂單資訊更新成功');
      
      // 3秒後跳轉回訂單詳情頁面
      setTimeout(() => {
        router.push(`/admin/bakery/orders/${orderNumber}`);
      }, 1500);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setSaving, setShowAuthWarning);
      } else {
        setError(err.message || '更新訂單失敗');
        setSaving(false);
      }
      console.error('更新訂單錯誤:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // 開啟狀態更新模態窗口
  const handleOpenStatusModal = () => {
    setShowStatusModal(true);
  };
  
  // 更新訂單狀態 - 使用共用 Hook
  const handleStatusUpdate = async (status: string, note: string) => {
    if (!order) return;
    
    const updatedOrder = await updateStatus(order, status, note);
    
    if (updatedOrder) {
      // 更新本地狀態
      setFormData(prev => ({
        ...prev,
        status: status
      }));
      
      // 更新訂單物件
      setOrder(updatedOrder);
      setShowStatusModal(false);
    }
  };
  
  // 載入中顯示
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mb-2"></div>
          <p className="text-gray-600">正在載入訂單資料...</p>
        </div>
      </div>
    );
  }
  
  // 錯誤顯示
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            錯誤: {error}
          </div>
          <div className="flex justify-between items-center">
            <Link href="/admin/bakery/orders" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              返回訂單列表
            </Link>
            {error.includes('認證失敗') && (
              <button
                onClick={() => handleRelogin()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                重新登入
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 找不到訂單
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">找不到訂單資料</p>
          </div>
          <div className="flex justify-center">
            <Link href="/admin/bakery/orders" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              返回訂單列表
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 認證警告組件 */}
      <AuthWarning 
        showWarning={!!(showAuthWarning && error?.includes('認證'))} 
        onClose={() => setShowAuthWarning(false)}
        message="未獲取到認證令牌，請重新登入系統"
      />
      
      {/* 成功訊息顯示 */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          <div className="flex justify-between">
            <p>{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-sm hover:text-green-900"
            >
              關閉
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">編輯訂單 #{order.order_number}</h1>
        <div className="flex gap-2">
          <Link 
            href={`/admin/bakery/orders/${order.order_number}`} 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            返回詳情
          </Link>
          <Link 
            href="/admin/bakery/orders" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            返回列表
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 訂單基本資訊 */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">訂單資訊</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">訂單編號</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2 bg-gray-100"
                      value={order.order_number}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">訂單總額</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2 bg-gray-100"
                      value={formatCurrency(order.total_amount)}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">訂單日期</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2 bg-gray-100"
                      value={formatDate(order.created_at)}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      訂單狀態 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 p-2 bg-gray-100"
                        value={getStatusDisplay(formData.status || '')}
                        disabled
                      />
                      <button
                        type="button"
                        onClick={handleOpenStatusModal}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        更改
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      訂單業主
                    </label>
                    <select
                      name="salesperson_id"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.salesperson_id || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- 選擇訂單業主 --</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Line ID</label>
                    <input
                      type="text"
                      name="lineid"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.lineid || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
                    <input
                      type="text"
                      name="taxId"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.taxId || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.notes || ''}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* 客戶與配送資訊 */}
              <div>
                <h4 className="font-medium text-gray-700 mb-4">客戶資訊</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      客戶姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customer_info.name"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.customer_info?.name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customer_info.phone"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.customer_info?.phone || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      name="customer_info.email"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={formData.customer_info?.email || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-700 mb-4">配送資訊</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        配送方式
                      </label>
                      <select
                        name="shipping_method"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={formData.shipping_method || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- 選擇配送方式 --</option>
                        {shippingMethodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                        物流業者
                      </label>
                      <input
                        type="text"
                        name="carrier"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={formData.carrier || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                        配送狀態
                      </label>
                      <select
                        name="shipping_status"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={formData.shipping_status || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- 選擇配送狀態 --</option>
                        {shippingStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                        收貨地址
                      </label>
                      <input
                        type="text"
                        name="shipping_address.address1"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={formData.shipping_address?.address1 || ''}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                        運費
                      </label>
                      <input
                        type="number"
                        name="shipping_fee"
                        min="0"
                        step="1"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={formData.shipping_fee || 0}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-medium text-gray-700 mb-4">付款資訊</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          付款方式
                        </label>
                        <select
                          name="payment_method"
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={formData.payment_method || ''}
                          onChange={handleChange}
                        >
                          <option value="">-- 選擇付款方式 --</option>
                          {paymentMethodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                          付款狀態
                        </label>
                        <select
                          name="payment_status"
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={formData.payment_status || ''}
                          onChange={handleChange}
                        >
                          <option value="">-- 選擇付款狀態 --</option>
                          {paymentStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <Link
                href={`/admin/bakery/orders/${order.order_number}`}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={saving}
              >
                {saving ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 狀態更新模態視窗 */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        order={order}
        onUpdateStatus={handleStatusUpdate}
        loading={statusUpdateLoading}
      />
    </div>
  );
} 
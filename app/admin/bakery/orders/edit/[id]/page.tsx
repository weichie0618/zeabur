'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  statusMap, 
  reverseStatusMap, 
  initializeAuth, 
  getAuthHeaders as getAuthHeadersFromService,
  handleAuthError as handleAuthErrorFromService,
  handleRelogin as handleReloginFromService,
  getStatusDisplay as getStatusDisplayFromService,
  getStatusClass as getStatusClassFromService,
  setupAuthWarningAutoHide
} from '../../../utils/authService';

// 訂單類型
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  notes?: string;
  lineid?: string;
  orderItems?: OrderItem[];
  address?: Address;
  line_user?: any;
  auth_user?: any;
}

// 訂單項目類型
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit_price?: number;
  product?: Product;
}

// 商品類型
interface Product {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  category?: string;
  specification?: string;
}

// 地址類型
interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  address1: string;
  city: string;
  postal_code: string;
}

// 編輯訂單表單類型
interface EditOrderForm {
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    recipientName?: string;
    phone?: string;
    address1?: string;
    city?: string;
    postal_code?: string;
  };
  status?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_method?: string;
  shipping_status?: string;
  notes?: string;
  lineid?: string;
  salesperson_id?: string;
  carrier?: string;
  taxId?: string;
  shipping_fee?: number;
  items?: Array<{
    product_id: string;
    quantity: number;
    price?: number;
  }>;
}

export default function OrderEdit() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 編輯訂單表單
  const [editOrderForm, setEditOrderForm] = useState<EditOrderForm>({
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
    shipping_status: '',
    shipping_method: '',
    notes: '',
    lineid: '',
    salesperson_id: '',
    carrier: '',
    taxId: '',
    shipping_fee: 0,
    items: []
  });
  
  // 獲取認證令牌
  const getAuthHeaders = () => {
    return getAuthHeadersFromService(accessToken);
  };
  
  // 初始化獲取認證令牌
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 處理認證錯誤
  const handleAuthError = (errorMessage: string) => {
    handleAuthErrorFromService(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleRelogin = () => {
    handleReloginFromService();
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 獲取訂單詳情
  useEffect(() => {
    if (!accessToken || !orderNumber) return;
    
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/orders/check`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            order_number: orderNumber 
          }),
          credentials: 'include',
        });
        
        if (response.status === 401) {
          handleAuthError('獲取訂單詳情時認證失敗');
          return;
        }
        
        const data = await response.json();
        
        if (response.ok && data.order) {
          const orderData = data.order;
          setOrder(orderData);
          
          // 填充表單數據
          setEditOrderForm({
            customer_info: {
              name: orderData.customer_name || '',
              email: orderData.customer_email || '',
              phone: orderData.customer_phone || ''
            },
            shipping_address: {
              recipientName: orderData.address?.recipient_name || '',
              phone: orderData.address?.phone || '',
              address1: orderData.address?.address1 || '',
              city: orderData.address?.city || '',
              postal_code: orderData.address?.postal_code || ''
            },
            status: orderData.status || '',
            payment_method: orderData.payment_method || '',
            payment_status: orderData.payment_status || '',
            shipping_method: orderData.shipping_method || '',
            shipping_status: orderData.shipping_status || '',
            notes: orderData.notes || '',
            lineid: orderData.lineid || '',
            salesperson_id: orderData.salesperson_id || '',
            carrier: orderData.carrier || '',
            taxId: orderData.taxId || '',
            shipping_fee: orderData.shipping_fee || 0,
            items: orderData.orderItems?.map((item: OrderItem) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            })) || []
          });
        } else {
          setError(data.message || '獲取訂單詳情失敗');
        }
      } catch (err: any) {
        setError(err.message || '處理訂單詳情時出錯');
        console.error('獲取訂單詳情錯誤:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [accessToken, orderNumber]);

  // 更新訂單資訊
  const handleUpdateOrder = async () => {
    if (!accessToken || !order) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editOrderForm),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('更新訂單時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('訂單更新成功');
        
        // 3秒後自動返回訂單詳情頁
        setTimeout(() => {
          router.push(`/admin/bakery/orders/${orderNumber}`);
        }, 3000);
      } else {
        setError(data.message || '更新訂單失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單更新時出錯');
      console.error('更新訂單錯誤:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 獲取訂單狀態的中文顯示
  const getStatusDisplay = (status: string): string => {
    return getStatusDisplayFromService(status);
  };
  
  // 獲取訂單狀態的樣式類
  const getStatusClass = (status: string): string => {
    return getStatusClassFromService(status);
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
                onClick={handleRelogin}
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
      {/* 頂部認證警告條 */}
      {showAuthWarning && error && error.includes('認證') && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 border-b border-red-200 text-red-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>未獲取到認證令牌，請重新登入</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAuthWarning(false)} 
              className="text-red-700 hover:text-red-900"
            >
              關閉
            </button>
            <button 
              onClick={handleRelogin}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              重新登入
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">編輯訂單 {orderNumber}</h1>
        <Link
          href={`/admin/bakery/orders/${orderNumber}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回訂單詳情
        </Link>
      </div>
      
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
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 客戶資訊 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">客戶資訊</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editOrderForm.customer_info?.name || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      customer_info: {
                        ...editOrderForm.customer_info,
                        name: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editOrderForm.customer_info?.email || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      customer_info: {
                        ...editOrderForm.customer_info,
                        email: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                  <input
                    type="tel"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editOrderForm.customer_info?.phone || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      customer_info: {
                        ...editOrderForm.customer_info,
                        phone: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* 配送地址 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">配送方式</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">取貨方式</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.shipping_address?.address1 === '自取' ? 'pickup' : (editOrderForm.shipping_method || 'takkyubin_cod')}
                  onChange={(e) => {
                    if (e.target.value === 'pickup') {
                      // 設為自取
                      setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          recipientName: editOrderForm.customer_info?.name || '',
                          phone: editOrderForm.customer_info?.phone || '',
                          address1: '自取',
                          city: '',
                          postal_code: ''
                        },
                        shipping_method: 'pickup'
                      });
                    } else {
                      // 維持現有地址或初始化空白地址
                      if (editOrderForm.shipping_address?.address1 === '自取') {
                        setEditOrderForm({
                          ...editOrderForm,
                          shipping_address: {
                            ...editOrderForm.shipping_address,
                            address1: '',
                          },
                          shipping_method: e.target.value
                        });
                      } else {
                        setEditOrderForm({
                          ...editOrderForm,
                          shipping_method: e.target.value
                        });
                      }
                    }
                  }}
                >
                  <option value="takkyubin_payment">黑貓宅急便-匯款</option>
                  <option value="takkyubin_cod">黑貓宅急便-貨到付款</option>
                  <option value="pickup">自取</option>
                </select>
              </div>
              
              {/* 如果不是自取，顯示完整的地址表單 */}
              {editOrderForm.shipping_address?.address1 !== '自取' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">收件人</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.recipientName || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          recipientName: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                    <input
                      type="tel"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.phone || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          phone: e.target.value
                        }
                      })}
                    />
                  </div>
                 
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">詳細地址</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.address1 || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          address1: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              )}
              
              {/* 如果是自取，顯示自取提示 */}
              {editOrderForm.shipping_address?.address1 === '自取' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-700 text-sm">顧客選擇自取。自取人資訊：</p>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">姓名：</span> {editOrderForm.customer_info?.name || '(未提供)'}</p>
                    <p><span className="font-medium">電話：</span> {editOrderForm.customer_info?.phone || '(未提供)'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">其他資訊</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">訂單狀態</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.status || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    status: e.target.value
                  })}
                >
                  <option value="PENDING">待處理</option>
                  <option value="PROCESSING">處理中</option>
                  <option value="SHIPPED">已出貨</option>
                  <option value="DELIVERED">已送達</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">付款方式</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.payment_method || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    payment_method: e.target.value
                  })}
                >
                  <option value="cash">現金</option>
                  <option value="credit_card">信用卡</option>
                  <option value="bank_transfer">銀行轉帳</option>
                  <option value="line_pay">Line Pay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">付款狀態</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.payment_status || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    payment_status: e.target.value
                  })}
                >
                  <option value="pending">未付款</option>
                  <option value="paid">已付款</option>
                  <option value="refunded">已退款</option>
                  <option value="failed">付款失敗</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配送狀態</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.shipping_status || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    shipping_status: e.target.value
                  })}
                >
                  <option value="pending">待出貨</option>
                  <option value="processing">準備中</option>
                  <option value="shipped">已出貨</option>
                  <option value="delivered">已送達</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業務人員ID</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.salesperson_id || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    salesperson_id: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">發票載具</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.carrier || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    carrier: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.taxId || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    taxId: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">運費</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.shipping_fee || 0}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    shipping_fee: Number(e.target.value)
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Line ID</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.lineid || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    lineid: e.target.value
                  })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">訂單備註</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2"
                  rows={3}
                  value={editOrderForm.notes || ''}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    notes: e.target.value
                  })}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Link 
              href={`/admin/bakery/orders/${order.order_number}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              取消
            </Link>
            <button
              onClick={handleUpdateOrder}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? '處理中...' : '保存更改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
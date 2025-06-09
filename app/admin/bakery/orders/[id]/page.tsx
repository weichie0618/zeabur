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
} from '../../utils/authService';

// 訂單類型
interface Order {
  id: string;
  order_number: string;
  salesperson_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  subtotal?: number; // 新增 subtotal 欄位
  created_at: string;
  updated_at?: string;
  notes?: string | null; // 允許 notes 為 null
  lineid?: string;
  orderItems?: OrderItem[];
  address?: string; // 修改為 string 類型
  line_user?: {
    id: number;
    lineId: string;
    displayName: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  auth_user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  shipping_method?: string;
  salesperson?: {
    id: string;
    companyName: string;
  };
  payment_method?: string; // 新增 payment_method 欄位
  payment_status?: string; // 新增 payment_status 欄位
  shipping_status?: string; // 新增 shipping_status 欄位
  shipping_fee?: number; // 新增 shipping_fee 欄位
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

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 商品編輯相關狀態
  const [showEditItem, setShowEditItem] = useState<boolean>(false);
  const [showAddItem, setShowAddItem] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<OrderItem | null>(null);
  const [editItemForm, setEditItemForm] = useState<{
    id?: string;
    product_id: string;
    quantity: number;
    price: number;
  }>({
    product_id: '',
    quantity: 1,
    price: 0
  });
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  
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
          setOrder(data.order);
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

  // 獲取可用商品列表
  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch('/api/products?fetchAll=true', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        setError('認證失敗，請嘗試重新登入系統');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // 過濾出狀態為 active 的商品
        const activeProducts = data.data.filter((product: any) => product.status === 'active');
        
        // 將 API 回應格式轉換為組件使用的格式
        const formattedProducts = activeProducts.map((product: any) => ({
          id: product.id.toString(),
          name: `${product.name} ${product.specification ? `(${product.specification})` : ''} - ${product.category?.name || ''}`,
          price: parseFloat(product.price),
          discount_price: product.discount_price ? parseFloat(product.discount_price) : undefined,
          category: product.category?.name || '',
          specification: product.specification || ''
        }));
        
        setAvailableProducts(formattedProducts);
        console.log(`已載入 ${formattedProducts.length} 個活動商品`);
      } else {
        console.error('獲取產品列表失敗:', data.message);
      }
    } catch (err) {
      console.error('獲取產品列表錯誤:', err);
    }
  };

  // 開啟編輯商品模態視窗
  const handleOpenEditItem = (item: OrderItem) => {
    setCurrentItem(item);
    setEditItemForm({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price || 0
    });
    setShowEditItem(true);
  };

  // 更新訂單商品
  const handleUpdateOrderItem = async () => {
    if (!accessToken || !order || !editItemForm.product_id) {
      setError('認證失敗或缺少所需資訊');
      return;
    }

    try {
      setLoading(true);
      
      const items = [];
      
      // 如果有item ID，則是更新現有商品
      if (editItemForm.id) {
        items.push({
          id: editItemForm.id,
          product_id: editItemForm.product_id,
          quantity: editItemForm.quantity,
          price: editItemForm.price
        });
      } else {
        // 否則是添加新商品（不應該走到這裡，因為有單獨的添加商品函數）
        items.push({
          product_id: editItemForm.product_id,
          quantity: editItemForm.quantity,
          price: editItemForm.price
        });
      }
      
      const response = await fetch(`/api/orders/${order.id}/items`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        setError('認證失敗，請嘗試重新登入系統');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('訂單商品更新成功');
        
        // 處理返回的訂單項目數據
        if (data.order && data.order.items) {
          data.order.items = data.order.items.map((item: any) => {
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
        }
        
        // 更新當前訂單的商品資訊
        setOrder({
          ...order,
          orderItems: data.order.items,
          total_amount: data.order.total_amount
        });
        
        // 關閉編輯模態視窗
        setShowEditItem(false);
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.message || '更新訂單商品失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單商品更新時出錯');
      console.error('更新訂單商品錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 刪除訂單商品
  const handleDeleteOrderItem = async (itemId: string) => {
    if (!accessToken || !order) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    if (!window.confirm('確定要刪除此商品嗎？')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${order.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        setError('認證失敗，請嘗試重新登入系統');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || '訂單商品刪除成功');
        
        // 確保 orderItems 的 price 字段正確設置
        if (data.order && data.order.items) {
          data.order.items = data.order.items.map((item: any) => {
            // 確保 price 欄位有值
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
        }
        
        // 更新當前訂單的商品資訊
        setOrder({
          ...order,
          orderItems: data.order.items,
          total_amount: data.order.total_amount
        });
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.message || '刪除訂單商品失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單商品刪除時出錯');
      console.error('刪除訂單商品錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 開啟添加商品模態視窗
  const handleOpenAddItem = () => {
    setEditItemForm({
      product_id: '',
      quantity: 1,
      price: 0
    });
    setShowAddItem(true);
  };

  // 添加商品到訂單
  const handleAddOrderItem = async () => {
    if (!accessToken || !order || !editItemForm.product_id) {
      setError('認證失敗或缺少商品資訊');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${order.id}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: editItemForm.product_id,
          quantity: editItemForm.quantity,
          price: editItemForm.price
        }),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        setError('認證失敗，請嘗試重新登入系統');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('商品成功添加到訂單');
        
        // 處理返回的訂單項目數據
        if (data.order && data.order.items) {
          data.order.items = data.order.items.map((item: any) => {
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
        }
        
        // 更新當前訂單的商品資訊
        setOrder({
          ...order,
          orderItems: data.order.items,
          total_amount: data.order.total_amount
        });
        
        // 關閉添加模態視窗
        setShowAddItem(false);
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.message || '添加商品到訂單失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理添加商品時出錯');
      console.error('添加商品到訂單錯誤:', err);
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
  
  // 取消訂單
  const handleCancelOrder = async () => {
    if (!accessToken || !order) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/cancel-by-number`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          order_number: order.order_number
        })
      });
      
      if (response.status === 401) {
        setError('認證失敗，請嘗試重新登入系統');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('訂單已成功取消');
        
        // 重新獲取最新訂單資料
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.message || '取消訂單失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單時出錯');
      console.error('取消訂單錯誤:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 判斷訂單是否可以取消
  const canCancelOrder = (status: string): boolean => {
    if (!status) return false;
    const upperStatus = status.toUpperCase();
    return upperStatus === 'PENDING' || upperStatus === 'PROCESSING';
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
        <h1 className="text-2xl font-semibold">訂單詳情 #{order.order_number}</h1>
        <div className="flex gap-2">
          <Link href="/admin/bakery/orders" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
            返回列表
          </Link>
          <Link 
            href={`/admin/bakery/orders/edit/${order.order_number}`} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            編輯
          </Link>
          {canCancelOrder(order.status) && (
            <button
              onClick={() => {
                if (window.confirm('確定要取消此訂單嗎？')) {
                  handleCancelOrder();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              取消訂單
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">訂單資訊</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">訂單編號：</span> {order.order_number}</p>
                <p>
                  <span className="text-gray-600">訂單業主：</span> 
                  <Link href={`/admin/bakery/owners/${order.salesperson_id}`} className="text-blue-600 hover:underline">
                    {order.salesperson_id}
                  </Link>
                </p>
                <p><span className="text-gray-600">訂單狀態：</span> <span className={getStatusClass(order.status)}>{getStatusDisplay(order.status)}</span></p>
                <p><span className="text-gray-600">訂單日期：</span> {new Date(order.created_at).toLocaleString('zh-TW').replace(/\//g, '/')}</p>
                <p><span className="text-gray-600">總金額：</span> NT${typeof order.total_amount === 'number' ? order.total_amount.toLocaleString('zh-TW') : order.total_amount}</p>
                {order.notes && (
                  <p><span className="text-gray-600">備註：</span> {order.notes}</p>
                )}
               
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">客戶資訊</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">姓名：</span> {order.line_user?.name}</p>
                <p><span className="text-gray-600">電話：</span> {order.line_user?.phone}</p>
                <p><span className="text-gray-600">電子郵件：</span> {order.line_user?.email}</p>
                {order.lineid && (
                  <p><span className="text-gray-600">Line ID：</span> {order.lineid}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 收貨地址資訊 - 優化後的布局 */}
          {order.shipping_method && (
            <div className="mb-6 border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-700 mb-2">配送資訊</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">配送方式：</span> {order.shipping_method === 'pickup' ? '自取' : '宅配'}</p>
                    {order.shipping_method === 'pickup' ? (
                      <>
                        <p><span className="text-gray-600">自取人：</span> {order.customer_name}</p>
                        <p><span className="text-gray-600">聯絡電話：</span> {order.customer_phone}</p>
                      </>
                    ) : (
                      <>
                        <p><span className="text-gray-600">收件人：</span> {order.customer_name}</p>
                        <p><span className="text-gray-600">電話：</span> {order.customer_phone}</p>
                      
                      </>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {order.payment_method && (
                      <p><span className="text-gray-600">付款方式：</span> {order.shipping_method === 'pickup' ? '現金' : order.shipping_method === 'takkyubin_payment' ? '匯款' : '貨到付款'}</p>
                    )}
                    
                    {order.shipping_fee !== undefined && (
                      <p><span className="text-gray-600">運費：</span> NT${typeof order.shipping_fee === 'number' ? order.shipping_fee.toLocaleString('zh-TW') : order.shipping_fee}</p>
                    )}
                  </div>
                </div>
               
                  <div className="mt-3 pt-3 border-t border-gray-200">
                  <p><span className="text-gray-600 font-medium">收貨地址：</span> {order.address}</p>
                    <p><span className="text-gray-600 font-medium">訂單備註：</span> {order.notes}</p>
                  </div>
                
              </div>
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">訂單項目</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      數量
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      單價
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      小計
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.orderItems && order.orderItems.map((item, index) => {
                    // 計算小計
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
                    const price = typeof item.price === 'number' ? item.price : 0;
                    const subtotal = quantity * price;
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product?.name || item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          NT${price.toLocaleString('zh-TW')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          NT${subtotal.toLocaleString('zh-TW')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={loading}
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDeleteOrderItem(item.id)}
                              className="text-red-600 hover:text-red-900 ml-2"
                              disabled={loading}
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!order.orderItems || order.orderItems.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        訂單中沒有商品
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      總計:
                    </td>
                    <td className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      NT${typeof order.total_amount === 'number' ? order.total_amount.toLocaleString('zh-TW') : order.total_amount}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={handleOpenAddItem}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        disabled={loading}
                      >
                        新增商品
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 編輯商品模態視窗 */}
      {showEditItem && currentItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">編輯商品</h3>
              <button 
                onClick={() => setShowEditItem(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.product_id}
                  onChange={(e) => {
                    const selectedProduct = availableProducts.find(p => p.id === e.target.value);
                    setEditItemForm({
                      ...editItemForm,
                      product_id: e.target.value,
                      price: selectedProduct?.price || 0
                    });
                  }}
                >
                  <option value="">-- 選擇商品 --</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - NT${typeof product.price === 'number' ? product.price.toLocaleString('zh-TW') : product.price}
                    </option>
                  ))}
                </select>
                {editItemForm.product_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    {availableProducts.find(p => p.id === editItemForm.product_id)?.specification || ''}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">數量</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.quantity}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">單價 (NT$)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.price}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    price: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">若留空，將使用商品的默認價格</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  小計: NT${typeof editItemForm.quantity === 'number' && typeof editItemForm.price === 'number' ? (editItemForm.quantity * editItemForm.price).toLocaleString('zh-TW') : '計算中...'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditItem(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleUpdateOrderItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading || !editItemForm.product_id}
              >
                {loading ? '處理中...' : '保存更改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加商品模態視窗 */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">添加商品到訂單</h3>
              <button 
                onClick={() => setShowAddItem(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">選擇商品 <span className="text-red-500">*</span></label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.product_id}
                  onChange={(e) => {
                    const selectedProduct = availableProducts.find(p => p.id === e.target.value);
                    setEditItemForm({
                      ...editItemForm,
                      product_id: e.target.value,
                      price: selectedProduct?.price || 0
                    });
                  }}
                >
                  <option value="">-- 選擇商品 --</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - NT${typeof product.price === 'number' ? product.price.toLocaleString('zh-TW') : product.price}
                    </option>
                  ))}
                </select>
                {editItemForm.product_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    {availableProducts.find(p => p.id === editItemForm.product_id)?.specification || ''}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">數量</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.quantity}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">單價 (NT$)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.price}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    price: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">若留空，將使用商品的默認價格</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  預估小計: NT${typeof editItemForm.quantity === 'number' && typeof editItemForm.price === 'number' ? (editItemForm.quantity * editItemForm.price).toLocaleString('zh-TW') : '計算中...'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleAddOrderItem}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading || !editItemForm.product_id}
              >
                {loading ? '處理中...' : '添加商品'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
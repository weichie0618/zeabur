'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// 引入類型
import { Order, OrderItem, Product } from '../types';

// 引入API服務
import { 
  fetchOrderDetail, 
  fetchAvailableProducts, 
  updateOrderItem, 
  deleteOrderItem, 
  addOrderItem,
  cancelOrder 
} from '../api';

// 引入狀態處理
import { getStatusDisplay, getStatusClass, canCancelOrder } from '../status';

// 引入工具函數
import { 
  initializeAuth, 
  handleAuthError, 
  handleRelogin, 
  setupAuthWarningAutoHide,
  formatCurrency,
  formatDate,
  formatOrderData
} from '../utils';

// 引入共用組件
import AuthWarning from '../components/AuthWarning';
import OrderItemsTable from '../components/OrderItemsTable';

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.id as string;
  
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
  
  // 初始化獲取認證令牌
  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 新增useEffect調用fetchAvailableProducts
  useEffect(() => {
    if (accessToken && (showEditItem || showAddItem)) {
      handleFetchAvailableProducts();
    }
  }, [accessToken, showEditItem, showAddItem]);
  
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

  // 獲取可用商品列表
  const handleFetchAvailableProducts = async () => {
    try {
      const products = await fetchAvailableProducts(accessToken);
      setAvailableProducts(products);
      console.log(`已載入 ${products.length} 個活動商品`);
    } catch (err: any) {
      console.error('獲取產品列表錯誤:', err);
      // 不顯示錯誤，因為這不是核心功能
    }
  };

  // 開啟編輯商品模態視窗
  const handleOpenEditItem = (item: OrderItem) => {
    setCurrentItem(item);
    
    // 修復價格處理：支持字符串格式的價格
    let itemPrice = 0;
    if (typeof item.price === 'string' && item.price !== '') {
      itemPrice = parseFloat(item.price);
    } else if (typeof item.price === 'number') {
      itemPrice = item.price;
    }
    
    setEditItemForm({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: itemPrice
    });
    setShowEditItem(true);
    // 確保商品列表已載入
    if (availableProducts.length === 0) {
      handleFetchAvailableProducts();
    }
  };

  // 更新訂單商品
  const handleUpdateOrderItem = async () => {
    if (!accessToken || !order || !editItemForm.product_id) {
      setError('認證失敗或缺少所需資訊');
      return;
    }

    try {
      setLoading(true);
      
      const items = [{
        id: editItemForm.id,
        product_id: editItemForm.product_id,
        quantity: editItemForm.quantity,
        price: editItemForm.price
      }];
      
      const data = await updateOrderItem(accessToken, order.id, items);
      
      setSuccess('訂單商品更新成功');
      
      // 使用formatOrderData處理API返回的數據格式
      const formattedOrder = formatOrderData(data.order);
      
      // 更新當前訂單的商品資訊
      setOrder({
        ...order,
        orderItems: formattedOrder.orderItems || [],
        total_amount: formattedOrder.total_amount
      });
      
      // 關閉編輯模態視窗
      setShowEditItem(false);
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(err.message || '更新訂單商品失敗');
        setLoading(false);
      }
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
      
      const data = await deleteOrderItem(accessToken, order.id, itemId);
      
      setSuccess(data.message || '訂單商品刪除成功');
      
      // 使用formatOrderData處理API返回的數據格式
      const formattedOrder = formatOrderData(data.order);
      
      // 更新當前訂單的商品資訊
      setOrder({
        ...order,
        orderItems: formattedOrder.orderItems || [],
        total_amount: formattedOrder.total_amount
      });
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(err.message || '刪除訂單商品失敗');
        setLoading(false);
      }
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
    // 確保商品列表已載入
    if (availableProducts.length === 0) {
      handleFetchAvailableProducts();
    }
  };

  // 添加商品到訂單
  const handleAddOrderItem = async () => {
    if (!accessToken || !order || !editItemForm.product_id) {
      setError('認證失敗或缺少商品資訊');
      return;
    }

    try {
      setLoading(true);
      
      const data = await addOrderItem(
        accessToken, 
        order.id, 
        editItemForm.product_id, 
        editItemForm.quantity, 
        editItemForm.price
      );
      
      setSuccess('商品成功添加到訂單');
      
      // 使用formatOrderData處理API返回的數據格式
      const formattedOrder = formatOrderData(data.order);
      
      // 更新當前訂單的商品資訊
      setOrder({
        ...order,
        orderItems: formattedOrder.orderItems || [],
        total_amount: formattedOrder.total_amount
      });
      
      // 關閉添加模態視窗
      setShowAddItem(false);
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(err.message || '添加商品到訂單失敗');
        setLoading(false);
      }
      console.error('添加商品到訂單錯誤:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 取消訂單
  const handleCancelOrder = async () => {
    if (!accessToken || !order) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    try {
      setLoading(true);
      
      await cancelOrder(accessToken, order.order_number);
      
      setSuccess('訂單已成功取消');
      
      // 重新獲取最新訂單資料
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      if (err.message?.includes('認證失敗')) {
        handleAuthError(err.message, setError, setLoading, setShowAuthWarning);
      } else {
        setError(err.message || '取消訂單失敗');
        setLoading(false);
      }
      console.error('取消訂單錯誤:', err);
    } finally {
      setLoading(false);
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
                onClick={(e) => {
                  e.preventDefault();
                  handleRelogin();
                }}
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
                <p><span className="text-gray-600">訂單日期：</span> {formatDate(order.created_at)}</p>
                <p><span className="text-gray-600">總金額：</span> {formatCurrency(order.total_amount)}</p>
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
                      <p><span className="text-gray-600">運費：</span> {formatCurrency(order.shipping_fee)}</p>
                    )}
                  </div>
                </div>
               
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p><span className="text-gray-600 font-medium">收貨地址：</span> {typeof order.address === 'string' ? order.address : order.address?.address1}</p>
                  <p><span className="text-gray-600 font-medium">訂單備註：</span> {order.notes}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">訂單項目</h4>
            <OrderItemsTable 
              items={order.orderItems || []} 
              totalAmount={order.total_amount}
              onEdit={handleOpenEditItem} 
              onDelete={handleDeleteOrderItem} 
              onAddItem={handleOpenAddItem}
            />
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
                      {product.name} - {formatCurrency(product.price)}
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
                  小計: {formatCurrency(editItemForm.quantity * editItemForm.price)}
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
                      {product.name} - {formatCurrency(product.price)}
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
                  預估小計: {formatCurrency(editItemForm.quantity * editItemForm.price)}
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
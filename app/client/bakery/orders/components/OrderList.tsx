'use client';

import React, { useState } from 'react';

// 定義訂單項目接口
interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  images?: string;
  image_url?: string;
  specification?: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  product: Product;
}

interface Address {
  id: number;
  recipient_name?: string;
  phone?: string;
  address1?: string;
  city?: string;
  postal_code?: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: string | number;
  created_at: string;
  updated_at: string;
  orderItems?: OrderItem[]; // API返回的訂單項目字段
  items?: OrderItem[]; // 兼容舊版接口
  address: Address | null;
  payment_method?: string;
  payment_status?: string;
  shipping_method?: string;
  shipping_status?: string;
  shipping_fee?: number | null; // 添加運費字段
}

interface OrderListProps {
  orders: Order[];
  loading: boolean;
}

// 訂單狀態標籤類別映射
const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

// 訂單狀態翻譯
const statusTranslation: Record<string, string> = {
  pending: '待處理',
  processing: '處理中',
  shipped: '已出貨',
  delivered: '已送達',
  cancelled: '已取消'
};

// 格式化日期
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化錯誤:', error);
    return dateString || '未知日期';
  }
};

export default function OrderList({ orders = [], loading }: OrderListProps) {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const toggleOrder = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 確保 orders 是陣列
  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <h3 className="text-lg font-semibold">沒有找到訂單</h3>
        <p className="text-gray-500 mt-1">
          請確認您輸入的電子郵件或電話號碼是否正確
        </p>
      </div>
    );
  }

  // 格式化數字為價格
  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0' : numPrice.toLocaleString();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
       {orders.length} 筆訂單
      </h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 訂單摘要 - 始終顯示 */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleOrder(order.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-5">
                  <div className="font-bold mb-1">
                    訂單 #{order.order_number}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </div>
                </div>
               
                <div className="sm:col-span-3 text-right">
                  <div className="font-bold">NT$ {formatPrice(order.total_amount)}</div>
                </div>
              </div>
              <div className="mt-3 text-right text-sm text-blue-600">
                {expandedOrder === order.id ? '收起詳情 ▲' : '查看詳情 ▼'}
              </div>
            </div>
            
            {/* 訂單詳情 - 僅在展開時顯示 */}
            {expandedOrder === order.id && (
              <div className="p-4 border-t border-gray-200">
                {/* 訂單明細 */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-3">訂單明細</h3>
                  
                  {/* 桌面版表格 - 在中大型螢幕上顯示 */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            商品
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            單價
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            數量
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            小計
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* 使用 orderItems 或 items 顯示訂單項目 */}
                        {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? 
                          order.orderItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img 
                                    src={item.product?.images || item.product?.image_url || '/placeholder-image.jpg'}
                                    alt={item.product?.name || '商品'}
                                    className="w-10 h-10 mr-3 object-cover rounded"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{item.product?.name || '未知商品'}</div>
                                    {item.product?.specification && (
                                      <div className="text-xs text-gray-500">{item.product.specification}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                NT$ {formatPrice(item.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                {item.quantity || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                                NT$ {formatPrice(parseFloat(item.price.toString()) * item.quantity)}
                              </td>
                            </tr>
                          ))
                        : Array.isArray(order.items) && order.items.length > 0 ? 
                          order.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img 
                                    src={item.product?.image_url || item.product?.images || '/placeholder-image.jpg'}
                                    alt={item.product?.name || '商品'}
                                    className="w-10 h-10 mr-3 object-cover rounded"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{item.product?.name || '未知商品'}</div>
                                    {item.product?.specification && (
                                      <div className="text-xs text-gray-500">{item.product.specification}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                NT$ {formatPrice(item.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                {item.quantity || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                                NT$ {formatPrice(parseFloat(item.price.toString()) * item.quantity)}
                              </td>
                            </tr>
                          ))
                        : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                              此訂單沒有商品項目
                            </td>
                          </tr>
                        )}
                        {/* 總計行 */}
                        {/* 添加運費顯示行 */}
                        {order.shipping_fee !== null && order.shipping_fee !== undefined && order.shipping_fee > 0 ? (
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                              運費
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                              NT$ {formatPrice(order.shipping_fee)}
                            </td>
                          </tr>
                        ) : null}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                            總計
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                            NT$ {formatPrice(order.total_amount)}
                          </td>
                        </tr>
                        
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 手機版卡片 - 僅在小型螢幕上顯示 */}
                  <div className="md:hidden space-y-3">
                    {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? 
                      order.orderItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                          <div className="flex items-start">
                            <img 
                              src={item.product?.images || item.product?.image_url || '/placeholder-image.jpg'}
                              alt={item.product?.name || '商品'}
                              className="w-16 h-16 object-cover rounded mr-3 flex-shrink-0"
                            />
                            <div className="flex-grow">
                              <h4 className="font-medium text-gray-900 mb-1">{item.product?.name || '未知商品'}</h4>
                              {item.product?.specification && (
                                <p className="text-xs text-gray-500 mb-1">{item.product.specification}</p>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                <div className="text-sm font-medium text-gray-500">
                                  單價: NT$ {formatPrice(item.price)}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                  數量: {item.quantity || 0}
                                </div>
                              </div>
                              <div className="text-right mt-2">
                                <div className="text-sm font-bold text-gray-900">
                                  小計: NT$ {formatPrice(parseFloat(item.price.toString()) * item.quantity)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : Array.isArray(order.items) && order.items.length > 0 ? 
                      order.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                          <div className="flex items-start">
                            <img 
                              src={item.product?.image_url || item.product?.images || '/placeholder-image.jpg'}
                              alt={item.product?.name || '商品'}
                              className="w-16 h-16 object-cover rounded mr-3 flex-shrink-0"
                            />
                            <div className="flex-grow">
                              <h4 className="font-medium text-gray-900 mb-1">{item.product?.name || '未知商品'}</h4>
                              {item.product?.specification && (
                                <p className="text-xs text-gray-500 mb-1">{item.product.specification}</p>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                <div className="text-sm font-medium text-gray-500">
                                  單價: NT$ {formatPrice(item.price)}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                  數量: {item.quantity || 0}
                                </div>
                              </div>
                              <div className="text-right mt-2">
                                <div className="text-sm font-bold text-gray-900">
                                  小計: NT$ {formatPrice(parseFloat(item.price.toString()) * item.quantity)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : 
                      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
                        此訂單沒有商品項目
                      </div>
                    }
                    
                    {/* 手機版總計 */}
                    <div className="bg-amber-50 rounded-lg p-4 text-right">
                      <span className="font-bold text-gray-900">總計: NT$ {formatPrice(order.total_amount)}</span>
                      {/* 手機版運費顯示 */}
                      {order.shipping_fee !== null && order.shipping_fee !== undefined && order.shipping_fee > 0 ? (
                        <div className="text-sm text-gray-600 mt-1">
                          運費: NT$ {formatPrice(order.shipping_fee)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 分隔線 */}
                <hr className="my-6" />
                
                {/* 配送資訊和訂單狀態 - 響應式調整 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/*  */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3 text-amber-700">收件人資訊</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500 inline-block w-20">姓名:</span>
                        <span className="font-medium">{order.customer_name || '未提供'}</span>
                      </p>
                      <p>
                        <span className="text-gray-500 inline-block w-20">電話:</span>
                        <span className="font-medium">{order.customer_phone || '未提供'}</span>
                      </p>
                      <p>
                        <span className="text-gray-500 inline-block w-20">電子郵件:</span>
                        <span className="font-medium">{order.customer_email || '未提供'}</span>
                      </p>
                      <p>
                        <span className="text-gray-500 inline-block w-20">配送方式:</span>
                        <span className="font-medium">{translateShippingMethod(order.shipping_method)}</span>
                      </p>
                      <p>
                        <span className="text-gray-500 inline-block w-20">{order.shipping_method === 'pickup' ? '自取地址:' : '地址:'}</span>
                        <span className="font-medium">
                          {order.shipping_method === 'pickup' ? 
                            '桃園市蘆竹區油管路一段696號'
                           : order.address ? 
                            `${order.address}`
                           : 
                            '未提供'
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 手機版操作按鈕 */}
                <div className="mt-6 md:hidden">
                  <button 
                    onClick={() => toggleOrder(order.id)}
                    className="w-full py-3 bg-amber-100 text-amber-800 rounded-lg font-medium text-center hover:bg-amber-200 transition-colors"
                  >
                    收起詳情
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 定義付款方式翻譯
function translatePaymentMethod(method?: string): string {
  const methodMap: Record<string, string> = {
    'credit_card': '信用卡',
    'cash': '現金',
    'line_pay': 'LINE Pay',
    'bank_transfer': '銀行轉帳'
  };
  return method ? (methodMap[method] || method) : '未知';
}

// 定義付款狀態翻譯
function translatePaymentStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待付款',
    'paid': '已付款',
    'failed': '付款失敗',
    'refunded': '已退款'
  };
  return status ? (statusMap[status] || status) : '未知';
}

// 定義配送方式翻譯
function translateShippingMethod(method?: string): string {
  const methodMap: Record<string, string> = {
    'home_delivery': '宅配到府',
    'store_pickup': '門市取貨',
    'convenience_store': '超商取貨',
    'takkyubin_payment': '黑貓宅配(冷凍) 匯款',
    'takkyubin_cod': '黑貓宅配(冷凍) 貨到付款',
    'pickup': '自取' // 添加自取的翻譯
  };
  return method ? (methodMap[method] || method) : '未知';
}

// 定義配送狀態翻譯
function translateShippingStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待出貨',
    'processing': '處理中',
    'shipped': '已出貨',
    'delivered': '已送達',
    'failed': '配送失敗'
  };
  return status ? (statusMap[status] || status) : '未知';
} 
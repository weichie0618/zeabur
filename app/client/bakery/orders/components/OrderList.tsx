'use client';

import React, { useState } from 'react';

// 定義訂單項目接口
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

interface Address {
  id: number;
  recipient_name: string;
  phone: string;
  address1: string;
  city: string;
  postal_code: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  address: Address;
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        找到 {orders.length} 筆訂單
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
                <div className="sm:col-span-4">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusClasses[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusTranslation[order.status] || order.status}
                  </span>
                </div>
                <div className="sm:col-span-3 text-right">
                  <div className="font-bold">NT$ {order.total_amount.toLocaleString()}</div>
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
                  <div className="overflow-x-auto">
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
                        {Array.isArray(order.items) && order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img 
                                  src={item.product?.image_url || '/placeholder-image.jpg'}
                                  alt={item.product?.name || '商品'}
                                  className="w-10 h-10 mr-3 object-cover rounded"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.product?.name || '未知商品'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              NT$ {item.price?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              {item.quantity || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                              NT$ {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {(!Array.isArray(order.items) || order.items.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                              此訂單沒有商品項目
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                            總計
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                            NT$ {order.total_amount?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 分隔線 */}
                <hr className="my-6" />
                
                {/* 配送資訊和訂單狀態 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-semibold mb-3">寄送資訊</h3>
                    <div className="space-y-2 text-sm">
                      {order.address ? (
                        <>
                          <p>收件人：{order.address.recipient_name || '未提供'}</p>
                          <p>電話：{order.address.phone || '未提供'}</p>
                          <p>地址：{order.address.postal_code} {order.address.city} {order.address.address1}</p>
                        </>
                      ) : (
                        <p>無寄送資訊</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold mb-3">訂單狀態</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        訂單狀態：
                        <span className={`ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${statusClasses[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusTranslation[order.status] || order.status || '未知狀態'}
                        </span>
                      </p>
                      <p>訂單時間：{formatDate(order.created_at)}</p>
                      <p>最後更新：{formatDate(order.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
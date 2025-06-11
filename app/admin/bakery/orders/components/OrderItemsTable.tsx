'use client';

import React from 'react';
import { OrderItem } from '../types';
import { formatCurrency } from '../utils';

interface OrderItemsTableProps {
  items: OrderItem[];
  totalAmount: number;
  onEdit?: (item: OrderItem) => void;
  onDelete?: (itemId: string) => void;
  onAddItem?: () => void;
  readOnly?: boolean;
}

/**
 * 訂單項目表格組件，用於顯示訂單中的商品項目
 */
const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  items,
  totalAmount,
  onEdit,
  onDelete,
  onAddItem,
  readOnly = false
}) => {
  return (
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
            {!readOnly && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items && items.length > 0 ? (
            items.map((item, index) => {
              // 計算小計
              const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
              const price = typeof item.price === 'number' ? item.price : 0;
              const subtotal = quantity * price;
              
              return (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.product?.name || item.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(subtotal)}
                  </td>
                  {!readOnly && onEdit && onDelete && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-red-600 hover:text-red-900 ml-2"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={readOnly ? 4 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                訂單中沒有商品
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={readOnly ? 3 : 3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
              總計:
            </td>
            <td className="px-6 py-3 text-left text-sm font-medium text-gray-900">
              {formatCurrency(totalAmount)}
            </td>
            {!readOnly && onAddItem && (
              <td className="px-6 py-3">
                <button
                  onClick={onAddItem}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  新增商品
                </button>
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default OrderItemsTable; 
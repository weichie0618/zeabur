'use client';

import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// 定義優惠券類型
interface Coupon {
  id: number;
  code: string;
  discount: number;
  isPercentage: boolean;
  minPurchase: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  isActive: boolean;
  description: string;
}

// 模擬優惠券資料
const initialCoupons: Coupon[] = [
  {
    id: 1,
    code: 'WELCOME10',
    discount: 10,
    isPercentage: true,
    minPurchase: 500,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    usageLimit: 1,
    isActive: true,
    description: '新客戶首次購物優惠',
  },
  {
    id: 2,
    code: 'SUMMER20',
    discount: 20,
    isPercentage: true,
    minPurchase: 1000,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    usageLimit: 100,
    isActive: true,
    description: '夏季促銷活動',
  },
  {
    id: 3,
    code: 'FREESHIP',
    discount: 100,
    isPercentage: false,
    minPurchase: 2000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    usageLimit: 0,
    isActive: true,
    description: '訂單滿2000元免運費',
  },
  {
    id: 4,
    code: 'HOLIDAY100',
    discount: 100,
    isPercentage: false,
    minPurchase: 1500,
    startDate: '2023-12-01',
    endDate: '2024-01-31',
    usageLimit: 200,
    isActive: false,
    description: '節慶優惠',
  },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // 篩選優惠券
  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理刪除優惠券
  const handleDeleteCoupon = (id: number) => {
    if (window.confirm('確定要刪除這個優惠券嗎？')) {
      setCoupons(coupons.filter(coupon => coupon.id !== id));
    }
  };

  // 處理編輯優惠券
  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowAddForm(true);
  };

  // 處理優惠券狀態切換
  const toggleCouponStatus = (id: number) => {
    setCoupons(coupons.map(coupon => 
      coupon.id === id ? { ...coupon, isActive: !coupon.isActive } : coupon
    ));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">優惠券管理</h1>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setShowAddForm(true);
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          新增優惠券
        </button>
      </div>
      
      {/* 搜尋欄 */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="搜尋優惠券..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>
      
      {/* 優惠券列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">優惠碼</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">折扣</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最低消費</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用限制</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      <div className="text-sm text-gray-500">{coupon.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.isPercentage ? `${coupon.discount}%` : `NT$${coupon.discount}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    NT${coupon.minPurchase}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.startDate} 至 {coupon.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.usageLimit === 0 ? '無限制' : `${coupon.usageLimit}次`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        coupon.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {coupon.isActive ? '啟用中' : '已停用'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditCoupon(coupon)}
                      className="text-amber-600 hover:text-amber-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    沒有找到符合條件的優惠券
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 新增/編輯優惠券模態框 - 可以根據需要實現 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingCoupon ? '編輯優惠券' : '新增優惠券'}
            </h2>
            <div className="mb-4">
              <p className="text-gray-500">優惠券表單在此實現</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
              >
                取消
              </button>
              <button
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md"
              >
                {editingCoupon ? '更新' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
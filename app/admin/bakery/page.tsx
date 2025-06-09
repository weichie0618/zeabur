'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  initializeAuth, 
  getAuthHeaders, 
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide
} from './utils/authService';

export default function AdminDashboard() {
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 初始化認證
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 模擬數據
  const stats = [
    { title: '今日銷售額', value: '$0', change: '0%', changeType: 'positive' },
    { title: '本月訂單數', value: '0', change: '0%', changeType: 'positive' },
    { title: '平均客單價', value: '$0', change: '0%', changeType: 'negative' },
    { title: '新客戶數', value: '0', change: '0%', changeType: 'positive' },
  ];

  // 模擬最近訂單
  const recentOrders = [
    { id: '', customer: '', date: '', amount: '$0', status: '', salesPerson: '' },
    { id: '', customer: '', date: '', amount: '$0', status: '', salesPerson: '' },
    { id: '', customer: '', date: '', amount: '$0', status: '', salesPerson: '' },
    { id: '', customer: '', date: '', amount: '$0', status: '', salesPerson: '' },
    { id: '', customer: '', date: '', amount: '$0', status: '', salesPerson: '' },
  ];

  // 模擬熱門產品
  const topProducts = [
    { name: '', sold: 0, revenue: '$0', growth: '0%' },
    { name: '', sold: 0, revenue: '$0', growth: '0%' },
    { name: '', sold: 0, revenue: '$0', growth: '0%' },
    { name: '', sold: 0, revenue: '$0', growth: '0%' },
    { name: '', sold: 0, revenue: '$0', growth: '0%' },
  ];

  // 模擬庫存警告
  const lowStockItems = [
    { name: '', stock: 0, minStock: 0 },
    { name: '', stock: 0, minStock: 0 },
    { name: '', stock: 0, minStock: 0 },
  ];

  // 模擬業務表現數據
  const salesPeople = [
    { id: '', name: '', sales: '$0', orders: 0, customers: 0, achievement: '0%' },
    { id: '', name: '', sales: '$0', orders: 0, customers: 0, achievement: '0%' },
    { id: '', name: '', sales: '$0', orders: 0, customers: 0, achievement: '0%' },
    { id: '', name: '', sales: '$0', orders: 0, customers: 0, achievement: '0%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">管理者儀表板</h1>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>今日</option>
            <option>本週</option>
            <option>本月</option>
            <option>本年</option>
          </select>
          {/* <button className="bg-amber-600 text-white px-4 py-1.5 rounded-md hover:bg-amber-700 text-sm font-medium">
            下載報表
          </button> */}
        </div>
      </div>
      
      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || '認證失敗，請重新登入系統'}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleRelogin();
                  }}
                  className="ml-2 font-medium text-red-700 underline"
                >
                  立即登入
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">{stat.title}</p>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <div className="flex items-center mt-2">
              <span className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-gray-500 text-sm ml-1">較上期</span>
            </div>
          </div>
        ))}
      </div>

      {/* 圖表和數據區 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 銷售趨勢圖 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">銷售趨勢</h2>
            <select className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              <option>過去7天</option>
              <option>過去30天</option>
              <option>過去90天</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-400">這裡將顯示銷售趨勢圖表</p>
          </div>
        </div>
        
        {/* 客戶分析 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">客戶分析</h2>
            <select className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              <option>所有客戶</option>
              <option>新客戶</option>
              <option>回購客戶</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-400">這裡將顯示客戶分析圖表</p>
          </div>
        </div>
      </div>

      {/* 業務表現區塊 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">業務表現</h2>
          <Link href="/admin/bakery/sales-people" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            管理業務
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業務編號
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  銷售額
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單數
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶數
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  目標達成率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesPeople.map((person, index) => (
                <tr key={`sales-person-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                    <Link href={`/admin/bakery/sales-people/${person.id}`}>
                      {person.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {person.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {person.sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.customers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">{person.achievement}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full" 
                          style={{ width: person.achievement }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最近訂單和熱門產品 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近訂單 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium">最近訂單</h2>
            <Link href="/admin/bakery/orders" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              查看全部
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單編號
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客戶
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    業務
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order, index) => (
                  <tr key={`order-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/admin/bakery/orders/${order.id}`}>
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.salesPerson}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === '已完成' ? 'bg-green-100 text-green-800' :
                        order.status === '待出貨' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 熱門產品 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium">熱門產品</h2>
            <Link href="/admin/bakery/products" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              查看全部
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    產品名稱
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    銷售量
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    銷售額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    成長率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sold} 件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${product.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      
    </div>
  );
} 
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function SalesDashboard() {
  const { user } = useAuth();
  
  // 模擬數據
  const stats = [
    { title: '今日銷售額', value: '$2,426', change: '+8.5%', changeType: 'positive' },
    { title: '本月訂單數', value: '48', change: '+4.2%', changeType: 'positive' },
    { title: '客戶數量', value: '32', change: '+2.5%', changeType: 'positive' },
    { title: '達成率', value: '68%', change: '+5.0%', changeType: 'positive' },
  ];

  // 模擬最近訂單
  const recentOrders = [
    { id: 'ORD-6723', customer: '陳小明', date: '2024/05/14 08:45', amount: '$245', status: '待出貨' },
    { id: 'ORD-6720', customer: '張小玲', date: '2024/05/13 15:22', amount: '$68', status: '待出貨' },
    { id: 'ORD-6714', customer: '王大同', date: '2024/05/10 12:30', amount: '$135', status: '已完成' },
    { id: 'ORD-6708', customer: '林美華', date: '2024/05/08 09:15', amount: '$82', status: '已完成' },
    { id: 'ORD-6701', customer: '李文昌', date: '2024/05/05 14:47', amount: '$175', status: '已完成' },
  ];

  // 模擬待跟進客戶
  const followUpCustomers = [
    { name: '陳小明', lastContact: '2024/05/01', note: '對新推出的麵包產品有興趣', priority: 'high' },
    { name: '王大同', lastContact: '2024/04/28', note: '詢問大型訂單的折扣', priority: 'medium' },
    { name: '林美華', lastContact: '2024/04/20', note: '需要跟進生日蛋糕系列', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">業務儀表板</h1>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>今日</option>
            <option>本週</option>
            <option>本月</option>
            <option>本年</option>
          </select>
        </div>
      </div>

      {/* 歡迎訊息 */}
      <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
        <h2 className="text-lg font-medium text-amber-800">歡迎回來，{user?.name || '業務夥伴'}！</h2>
        <p className="mt-1 text-amber-700">
          今天是新的一天，您有 <span className="font-semibold">3</span> 個待跟進客戶和 <span className="font-semibold">2</span> 個待處理訂單。
        </p>
      </div>

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

      {/* 最近訂單 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">最近訂單</h2>
          <Link href="/sales/orders" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
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
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                    <Link href={`/sales/orders/${order.id}`}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === '已完成' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link href={`/sales/orders/${order.id}`} className="text-amber-600 hover:text-amber-900">
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 待跟進客戶 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">待跟進客戶</h2>
          <Link href="/sales/customers" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            管理客戶
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶名稱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最後聯繫
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  備註
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  優先級
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {followUpCustomers.map((customer) => (
                <tr key={customer.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastContact}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {customer.note}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.priority === 'high' ? 'bg-red-100 text-red-800' :
                      customer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {customer.priority === 'high' ? '高' :
                       customer.priority === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link href={`/sales/customers/${customer.name}`} className="text-amber-600 hover:text-amber-900 mr-3">
                      聯繫
                    </Link>
                    <Link href={`/sales/customers/${customer.name}`} className="text-amber-600 hover:text-amber-900">
                      檢視
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
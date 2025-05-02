import React from 'react';
import Link from 'next/link';

// 模擬訂單數據
const orders = [
  { 
    id: 'ORD-6723', 
    customer: { name: '陳小明', email: 'chen@example.com', phone: '0912-345-678' }, 
    date: '2024/05/14 08:45', 
    items: 3, 
    amount: 245, 
    status: '待出貨',
    paymentMethod: '信用卡',
    shippingMethod: '宅配'
  },
  { 
    id: 'ORD-6722', 
    customer: { name: '林美華', email: 'lin@example.com', phone: '0923-456-789' }, 
    date: '2024/05/14 06:12', 
    items: 1, 
    amount: 125, 
    status: '已完成',
    paymentMethod: 'LINE Pay',
    shippingMethod: '店面取貨'
  },
  { 
    id: 'ORD-6721', 
    customer: { name: '王大同', email: 'wang@example.com', phone: '0934-567-890' }, 
    date: '2024/05/13 21:30', 
    items: 5, 
    amount: 350, 
    status: '已完成',
    paymentMethod: '信用卡',
    shippingMethod: '宅配'
  },
  { 
    id: 'ORD-6720', 
    customer: { name: '張小玲', email: 'chang@example.com', phone: '0945-678-901' }, 
    date: '2024/05/13 15:22', 
    items: 2, 
    amount: 68, 
    status: '待出貨',
    paymentMethod: '貨到付款',
    shippingMethod: '宅配'
  },
  { 
    id: 'ORD-6719', 
    customer: { name: '李文昌', email: 'lee@example.com', phone: '0956-789-012' }, 
    date: '2024/05/13 11:47', 
    items: 4, 
    amount: 192, 
    status: '處理中',
    paymentMethod: '銀行轉帳',
    shippingMethod: '店面取貨'
  },
  { 
    id: 'ORD-6718', 
    customer: { name: '許小芬', email: 'hsu@example.com', phone: '0967-890-123' }, 
    date: '2024/05/12 19:33', 
    items: 2, 
    amount: 145, 
    status: '已取消',
    paymentMethod: '信用卡',
    shippingMethod: '宅配'
  },
  { 
    id: 'ORD-6717', 
    customer: { name: '楊大明', email: 'yang@example.com', phone: '0978-901-234' }, 
    date: '2024/05/12 14:20', 
    items: 6, 
    amount: 420, 
    status: '已完成',
    paymentMethod: '信用卡',
    shippingMethod: '宅配'
  },
  { 
    id: 'ORD-6716', 
    customer: { name: '吳小珍', email: 'wu@example.com', phone: '0989-012-345' }, 
    date: '2024/05/12 10:08', 
    items: 3, 
    amount: 165, 
    status: '已完成',
    paymentMethod: 'LINE Pay',
    shippingMethod: '店面取貨'
  },
];

export default function OrdersManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
        <button 
          className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          匯出訂單
        </button>
      </div>

      {/* 訂單統計區 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">總訂單數</div>
              <div className="text-xl font-semibold">365</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">處理中訂單</div>
              <div className="text-xl font-semibold">12</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">待出貨訂單</div>
              <div className="text-xl font-semibold">8</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">已完成訂單</div>
              <div className="text-xl font-semibold">342</div>
            </div>
          </div>
        </div>
      </div>

      {/* 過濾器區域 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">搜尋訂單</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="訂單編號或客戶名稱"
                className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">訂單狀態</label>
            <select
              id="status"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">所有狀態</option>
              <option value="處理中">處理中</option>
              <option value="待出貨">待出貨</option>
              <option value="已出貨">已出貨</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
              <option value="已退款">已退款</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">訂單日期</label>
            <select
              id="date"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">所有時間</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="this_week">本週</option>
              <option value="this_month">本月</option>
              <option value="last_month">上個月</option>
              <option value="custom">自訂日期範圍</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            套用篩選
          </button>
        </div>
      </div>

      {/* 訂單表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單編號
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶資訊
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品數量
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總金額
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  付款方式
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  動作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                    <Link href={`/admin/bakery/orders/${order.id}`}>
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-sm text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items} 項
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === '已完成' ? 'bg-green-100 text-green-800' :
                      order.status === '待出貨' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === '處理中' ? 'bg-blue-100 text-blue-800' :
                      order.status === '已取消' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link 
                        href={`/admin/bakery/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        查看
                      </Link>
                      <button className="text-amber-600 hover:text-amber-900">
                        編輯
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        列印
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 分頁控制 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              上一頁
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              下一頁
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                顯示第 <span className="font-medium">1</span> 到 <span className="font-medium">8</span> 項結果，共 <span className="font-medium">97</span> 項
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">上一頁</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-amber-500 bg-amber-50 text-sm font-medium text-amber-600">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  13
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">下一頁</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
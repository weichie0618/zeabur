import React from 'react';
import Link from 'next/link';

export default function SalesOrdersPage() {
  // 模擬當前業務的訂單數據
  const orders = [
    { 
      id: 'ORD-6723', 
      customer: '陳小明', 
      date: '2024/05/14 08:45', 
      amount: '$245', 
      status: '待出貨',
      products: [
        { name: '法式牛角麵包', quantity: 5, price: '$45' },
        { name: '提拉米蘇', quantity: 1, price: '$120' }
      ]
    },
    { 
      id: 'ORD-6721', 
      customer: '王大同', 
      date: '2024/05/13 21:30', 
      amount: '$350', 
      status: '已完成',
      products: [
        { name: '藍莓乳酪蛋糕', quantity: 2, price: '$140' },
        { name: '提拉米蘇', quantity: 1, price: '$120' }
      ]
    },
    { 
      id: 'ORD-6720', 
      customer: '張小玲', 
      date: '2024/05/13 15:22', 
      amount: '$68', 
      status: '待出貨',
      products: [
        { name: '肉鬆麵包', quantity: 2, price: '$34' }
      ]
    },
    { 
      id: 'ORD-6712', 
      customer: '王大同', 
      date: '2024/05/10 11:22', 
      amount: '$350', 
      status: '已完成',
      products: [
        { name: '藍莓乳酪蛋糕', quantity: 1, price: '$140' },
        { name: '草莓蛋糕', quantity: 1, price: '$210' }
      ]
    },
    { 
      id: 'ORD-6708', 
      customer: '張小玲', 
      date: '2024/05/08 09:18', 
      amount: '$68', 
      status: '待出貨',
      products: [
        { name: '肉鬆麵包', quantity: 2, price: '$34' }
      ]
    },
    { 
      id: 'ORD-6702', 
      customer: '李文昌', 
      date: '2024/05/05 14:47', 
      amount: '$192', 
      status: '處理中',
      products: [
        { name: '提拉米蘇', quantity: 1, price: '$120' },
        { name: '法式牛角麵包', quantity: 2, price: '$36' }
      ]
    },
    { 
      id: 'ORD-6685', 
      customer: '陳曉芳', 
      date: '2024/04/28 10:12', 
      amount: '$425', 
      status: '已完成',
      products: [
        { name: '草莓蛋糕', quantity: 1, price: '$210' },
        { name: '提拉米蘇', quantity: 1, price: '$120' },
        { name: '法式牛角麵包', quantity: 5, price: '$95' }
      ]
    },
    { 
      id: 'ORD-6672', 
      customer: '林美華', 
      date: '2024/04/22 16:32', 
      amount: '$125', 
      status: '已完成',
      products: [
        { name: '提拉米蘇', quantity: 1, price: '$125' }
      ]
    },
  ];

  // 每個訂單狀態的數量統計
  const statusCounts = {
    pending: 3,    // 待處理
    shipping: 2,   // 待出貨
    completed: 5,  // 已完成
    cancelled: 1   // 已取消
  };

  // 最近 7 天的每日訂單數
  const recentOrderCounts = [
    { date: '05/14', orders: 2 },
    { date: '05/13', orders: 3 },
    { date: '05/12', orders: 0 },
    { date: '05/11', orders: 1 },
    { date: '05/10', orders: 2 },
    { date: '05/09', orders: 1 },
    { date: '05/08', orders: 2 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-gray-500 mt-1">管理您的客戶訂單</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 space-x-0 sm:space-x-3">
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="搜尋訂單或客戶" 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <Link href="/sales/orders/new" className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 text-sm font-medium inline-flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新增訂單
          </Link>
        </div>
      </div>

      {/* 訂單統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">待處理訂單</p>
              <p className="text-lg sm:text-xl font-bold">{statusCounts.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">待出貨訂單</p>
              <p className="text-lg sm:text-xl font-bold">{statusCounts.shipping}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">已完成訂單</p>
              <p className="text-lg sm:text-xl font-bold">{statusCounts.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 mr-3 sm:mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">已取消訂單</p>
              <p className="text-lg sm:text-xl font-bold">{statusCounts.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 過濾器 */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <select className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>所有狀態</option>
            <option>待處理</option>
            <option>待出貨</option>
            <option>已完成</option>
            <option>已取消</option>
          </select>
          <select className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>所有時間</option>
            <option>今日</option>
            <option>本週</option>
            <option>本月</option>
            <option>上個月</option>
          </select>
          <select className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>所有客戶</option>
            <option>新客戶</option>
            <option>回購客戶</option>
          </select>
          <select className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>所有產品</option>
            <option>麵包類</option>
            <option>蛋糕類</option>
            <option>甜點類</option>
          </select>
          <button className="bg-amber-100 text-amber-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md hover:bg-amber-200 text-xs sm:text-sm font-medium">
            重置過濾器
          </button>
        </div>
      </div>

      {/* 訂單列表 - 桌面版 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hidden md:block">
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                    <Link href={`/sales/orders/${order.id}`}>
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Link href={`/sales/customers/${order.customer}`} className="hover:underline">
                      {order.customer}
                    </Link>
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
                      order.status === '待出貨' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === '處理中' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        查看
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-amber-600 hover:text-amber-900">
                        編輯
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-gray-600 hover:text-gray-900">
                        打印
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            顯示 <span className="font-medium">1</span> 到 <span className="font-medium">8</span> 共 <span className="font-medium">35</span> 筆結果
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled>
              上一頁
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              下一頁
            </button>
          </div>
        </div>
      </div>

      {/* 訂單列表 - 行動版 */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <Link href={`/sales/orders/${order.id}`} className="text-amber-600 font-medium text-sm">
                {order.id}
              </Link>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                order.status === '已完成' ? 'bg-green-100 text-green-800' :
                order.status === '待出貨' ? 'bg-yellow-100 text-yellow-800' :
                order.status === '處理中' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">客戶:</span>
                <Link href={`/sales/customers/${order.customer}`} className="text-gray-900 font-medium">
                  {order.customer}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">日期:</span>
                <span className="text-gray-900">{order.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">金額:</span>
                <span className="text-gray-900 font-medium">{order.amount}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
              <button className="text-indigo-600 text-xs font-medium">查看</button>
              <button className="text-amber-600 text-xs font-medium">編輯</button>
              <button className="text-gray-600 text-xs font-medium">打印</button>
            </div>
          </div>
        ))}
        
        <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            顯示 8/35 筆
          </div>
          <div className="flex space-x-2">
            <button className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled>
              上一頁
            </button>
            <button className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
              下一頁
            </button>
          </div>
        </div>
      </div>

      {/* 訂單趨勢圖 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">最近訂單趨勢</h2>
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <div className="w-full flex items-end justify-between space-x-1 sm:space-x-2 px-2 sm:px-8">
            {recentOrderCounts.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="flex-1 w-8 sm:w-12 bg-amber-500 rounded-t" style={{ height: `${day.orders * 30}px` }}></div>
                <div className="mt-2 text-xs text-gray-500">{day.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
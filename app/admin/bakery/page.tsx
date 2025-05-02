import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  // 模擬數據
  const stats = [
    { title: '今日銷售額', value: '$12,426', change: '+12.5%', changeType: 'positive' },
    { title: '本月訂單數', value: '152', change: '+8.2%', changeType: 'positive' },
    { title: '平均客單價', value: '$82', change: '-2.5%', changeType: 'negative' },
    { title: '新客戶數', value: '48', change: '+24.0%', changeType: 'positive' },
  ];

  // 模擬最近訂單
  const recentOrders = [
    { id: 'ORD-6723', customer: '陳小明', date: '2024/05/14 08:45', amount: '$245', status: '待出貨' },
    { id: 'ORD-6722', customer: '林美華', date: '2024/05/14 06:12', amount: '$125', status: '已完成' },
    { id: 'ORD-6721', customer: '王大同', date: '2024/05/13 21:30', amount: '$350', status: '已完成' },
    { id: 'ORD-6720', customer: '張小玲', date: '2024/05/13 15:22', amount: '$68', status: '待出貨' },
    { id: 'ORD-6719', customer: '李文昌', date: '2024/05/13 11:47', amount: '$192', status: '處理中' },
  ];

  // 模擬熱門產品
  const topProducts = [
    { name: '法式牛角麵包', sold: 145, revenue: '$9,425', growth: '+12%' },
    { name: '提拉米蘇', sold: 98, revenue: '$14,700', growth: '+5%' },
    { name: '藍莓乳酪蛋糕', sold: 82, revenue: '$9,840', growth: '+18%' },
    { name: '草莓蛋糕', sold: 65, revenue: '$17,550', growth: '-3%' },
    { name: '肉鬆麵包', sold: 53, revenue: '$3,180', growth: '+8%' },
  ];

  // 模擬庫存警告
  const lowStockItems = [
    { name: '鮮奶油蛋糕', stock: 3, minStock: 5 },
    { name: '抹茶拿鐵', stock: 2, minStock: 10 },
    { name: '巧克力餅乾', stock: 4, minStock: 15 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">儀表板</h1>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>今日</option>
            <option>本週</option>
            <option>本月</option>
            <option>本年</option>
          </select>
          <button className="bg-amber-600 text-white px-4 py-1.5 rounded-md hover:bg-amber-700 text-sm font-medium">
            下載報表
          </button>
        </div>
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
                    狀態
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
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

      {/* 庫存警告 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">庫存警告</h2>
        </div>
        <div className="p-6">
          {lowStockItems.length === 0 ? (
            <p className="text-gray-500">目前沒有庫存不足的產品</p>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{item.name}</h3>
                      <p className="text-xs text-red-700">
                        目前庫存: <span className="font-bold">{item.stock}</span> (最低安全存量: {item.minStock})
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`/admin/bakery/products/restock`} 
                    className="bg-white border border-red-300 text-red-700 px-3 py-1 rounded text-xs font-medium hover:bg-red-50"
                  >
                    補貨
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
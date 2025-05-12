import React from 'react';
import Link from 'next/link';

export default function SalesDashboard() {
  // 模擬當前業務的銷售數據
  const salesStats = [
    { title: '本月銷售額', value: '$8,245', change: '+15.3%', changeType: 'positive' },
    { title: '本月訂單數', value: '42', change: '+8.7%', changeType: 'positive' },
    { title: '本月客戶數', value: '18', change: '+5.2%', changeType: 'positive' },
    { title: '目標達成率', value: '78%', change: '+2.5%', changeType: 'positive' },
  ];

  // 模擬業務的最近訂單
  const recentOrders = [
    { id: 'ORD-6723', customer: '陳小明', date: '2024/05/14 08:45', amount: '$245', status: '待出貨' },
    { id: 'ORD-6718', customer: '林美華', date: '2024/05/12 16:32', amount: '$125', status: '已完成' },
    { id: 'ORD-6712', customer: '王大同', date: '2024/05/10 11:22', amount: '$350', status: '已完成' },
    { id: 'ORD-6708', customer: '張小玲', date: '2024/05/08 09:18', amount: '$68', status: '待出貨' },
    { id: 'ORD-6702', customer: '李文昌', date: '2024/05/05 14:47', amount: '$192', status: '處理中' },
  ];

  // 模擬業務的熱門產品
  const topProducts = [
    { name: '法式牛角麵包', sold: 24, revenue: '$1,560', growth: '+8%' },
    { name: '提拉米蘇', sold: 18, revenue: '$2,700', growth: '+12%' },
    { name: '藍莓乳酪蛋糕', sold: 15, revenue: '$1,800', growth: '+5%' },
    { name: '草莓蛋糕', sold: 12, revenue: '$3,240', growth: '-2%' },
    { name: '肉鬆麵包', sold: 10, revenue: '$600', growth: '+4%' },
  ];

  // 模擬獎金目標
  const commissionTiers = [
    { level: '基礎', threshold: '$5,000', commission: '5%', progress: '100%' },
    { level: '銀級', threshold: '$10,000', commission: '7%', progress: '82%' },
    { level: '金級', threshold: '$15,000', commission: '10%', progress: '55%' },
    { level: '白金', threshold: '$20,000', commission: '12%', progress: '41%' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">業務儀表板</h1>
          <p className="text-gray-500 mt-1">王小明 - 業務專員 #S-023</p>
        </div>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>本週</option>
            <option>本月</option>
            <option>本季</option>
            <option>本年</option>
          </select>
          <button className="bg-amber-600 text-white px-4 py-1.5 rounded-md hover:bg-amber-700 text-sm font-medium">
            下載報表
          </button>
        </div>
      </div>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesStats.map((stat, index) => (
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
            <h2 className="text-lg font-medium">個人銷售趨勢</h2>
            <select className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              <option>過去7天</option>
              <option>過去30天</option>
              <option>過去90天</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-400">這裡將顯示個人銷售趨勢圖表</p>
          </div>
        </div>
        
        {/* 獎金追蹤 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">獎金目標追蹤</h2>
            <div className="text-amber-600 font-medium">
              預估佣金: $748
            </div>
          </div>
          <div className="space-y-4">
            {commissionTiers.map((tier, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tier.level} ({tier.threshold}, {tier.commission})</span>
                  <span>{tier.progress}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-amber-600 h-2.5 rounded-full" 
                    style={{ width: tier.progress }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近訂單和熱門產品 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近訂單 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium">您的最近訂單</h2>
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
        
        {/* 您銷售的熱門產品 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium">您銷售的熱門產品</h2>
            <Link href="/sales/products" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
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

      {/* 客戶跟進提醒 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">客戶跟進提醒</h2>
          <Link href="/sales/customers" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            查看全部客戶
          </Link>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">李文昌 - 3天未回覆</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>上次詢問產品定價，需要提供批發價格表。</p>
              </div>
              <div className="mt-3">
                <button className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  標記已跟進
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">張小玲 - 生日提醒</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>客戶生日將於5天後（5月20日），考慮準備生日驚喜或特別優惠。</p>
              </div>
              <div className="mt-3">
                <button className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  安排提醒
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
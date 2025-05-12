import React from 'react';
import Link from 'next/link';

export default function SalesPeopleManagement() {
  // 模擬業務人員數據
  const salesPeople = [
    { 
      id: 'S-023', 
      name: '王小明', 
      email: 'wang@example.com',
      phone: '0912-345-678',
      joinDate: '2023/01/15',
      status: '在職',
      sales: '$8,245', 
      orders: 42, 
      customers: 18, 
      achievement: '78%',
      commissionRate: '5-12%'
    },
    { 
      id: 'S-015', 
      name: '李小華', 
      email: 'lee@example.com',
      phone: '0923-456-789',
      joinDate: '2022/09/05',
      status: '在職',
      sales: '$6,120', 
      orders: 35, 
      customers: 15, 
      achievement: '61%',
      commissionRate: '5-10%'
    },
    { 
      id: 'S-031', 
      name: '陳大勇', 
      email: 'chen@example.com',
      phone: '0934-567-890',
      joinDate: '2023/05/20',
      status: '在職',
      sales: '$5,840', 
      orders: 28, 
      customers: 12, 
      achievement: '58%',
      commissionRate: '5-8%'
    },
    { 
      id: 'S-008', 
      name: '林小菁', 
      email: 'lin@example.com',
      phone: '0945-678-901',
      joinDate: '2022/06/10',
      status: '在職',
      sales: '$4,950', 
      orders: 23, 
      customers: 10, 
      achievement: '49%',
      commissionRate: '5-8%'
    },
    { 
      id: 'S-042', 
      name: '張美玲', 
      email: 'chang@example.com',
      phone: '0956-789-012',
      joinDate: '2023/11/08',
      status: '試用期',
      sales: '$2,150', 
      orders: 12, 
      customers: 6, 
      achievement: '32%',
      commissionRate: '3-5%'
    },
    { 
      id: 'S-019', 
      name: '黃志明', 
      email: 'huang@example.com',
      phone: '0967-890-123',
      joinDate: '2022/08/22',
      status: '休假中',
      sales: '$0', 
      orders: 0, 
      customers: 25, 
      achievement: '0%',
      commissionRate: '5-10%'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">業務人員管理</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="搜尋業務人員" 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option>所有狀態</option>
            <option>在職</option>
            <option>試用期</option>
            <option>休假中</option>
          </select>
          <Link href="/admin/bakery/sales-people/new" className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 text-sm font-medium inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新增業務
          </Link>
        </div>
      </div>

      {/* 業務列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業務編號
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名/聯絡資訊
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加入日期
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  本月業績
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  達成率
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  佣金比例
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesPeople.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                    <Link href={`/admin/bakery/sales-people/${person.id}`}>
                      {person.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                          {person.name.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{person.name}</div>
                        <div className="text-sm text-gray-500">{person.email}</div>
                        <div className="text-sm text-gray-500">{person.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.joinDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      person.status === '在職' ? 'bg-green-100 text-green-800' :
                      person.status === '試用期' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.sales}</div>
                    <div className="text-sm text-gray-500">{person.orders} 訂單 / {person.customers} 客戶</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">{person.achievement}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            parseInt(person.achievement) > 75 ? 'bg-green-600' :
                            parseInt(person.achievement) > 50 ? 'bg-amber-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: person.achievement }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {person.commissionRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/admin/bakery/sales-people/${person.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                        編輯
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link href={`/admin/bakery/sales-people/${person.id}/targets`} className="text-amber-600 hover:text-amber-900">
                        設定目標
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link href={`/admin/bakery/sales-people/${person.id}/commissions`} className="text-green-600 hover:text-green-900">
                        佣金記錄
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 業績統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 團隊績效 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-6">團隊績效</h2>
          <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-400">這裡將顯示團隊績效圖表</p>
          </div>
        </div>
        
        {/* 佣金支出 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-6">本月佣金統計</h2>
          <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-400">這裡將顯示佣金統計圖表</p>
          </div>
        </div>
      </div>

      {/* 業績目標設定 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">業績目標設定</h2>
          <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            調整目標設定
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">銅級目標</h3>
            <p className="text-sm text-gray-500 mb-1">月銷售額: $5,000</p>
            <p className="text-sm text-gray-500 mb-1">佣金比例: 5%</p>
            <p className="text-sm text-gray-500">達成業務: 5 人</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">銀級目標</h3>
            <p className="text-sm text-gray-500 mb-1">月銷售額: $10,000</p>
            <p className="text-sm text-gray-500 mb-1">佣金比例: 7%</p>
            <p className="text-sm text-gray-500">達成業務: 2 人</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-2">金級目標</h3>
            <p className="text-sm text-gray-500 mb-1">月銷售額: $15,000</p>
            <p className="text-sm text-gray-500 mb-1">佣金比例: 10%</p>
            <p className="text-sm text-gray-500">達成業務: 0 人</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
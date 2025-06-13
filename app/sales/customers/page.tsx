'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

// 定義客戶類型
interface Customer {
  id: number;
  lineId: string;          // LINE用戶ID
  customerId: string;      // 客戶編號
  displayName: string;     // LINE顯示名稱
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  carrier: string | null;  // 載具號碼
  taxId: string | null;    // 統一編號
  createdAt: string;
  updatedAt: string;
  customer?: {
    companyName: string | null;
  };
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    lineUsers: Customer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  };
}

export default function SalesCustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  // 篩選相關狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // 新增公司名稱列表狀態
  const [companyNames, setCompanyNames] = useState<string[]>([]);

  // 保存所有未篩選的客戶數據
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // 模擬客戶數據
  useEffect(() => {
    // 模擬 API 請求延遲
    const timer = setTimeout(() => {
      const mockCustomers: Customer[] = [
        {
          id: 1,
          lineId: 'user123',
          customerId: 'CUST001',
          displayName: '張小明',
          name: '張小明',
          email: 'zhang@example.com',
          phone: '0912345678',
          address: '台北市信義區松仁路100號',
          carrier: null,
          taxId: null,
          createdAt: '2023-01-15T08:30:00Z',
          updatedAt: '2023-12-30T14:20:00Z',
          customer: {
            companyName: '日和麵包坊'
          }
        },
        {
          id: 2,
          lineId: 'user456',
          customerId: 'CUST002',
          displayName: '王大明',
          name: '王大明',
          email: 'wang@example.com',
          phone: '0923456789',
          address: '台北市大安區忠孝東路四段100號',
          carrier: 'AB12345678',
          taxId: null,
          createdAt: '2023-03-20T10:15:00Z',
          updatedAt: '2023-11-15T09:45:00Z',
          customer: {
            companyName: '陽光咖啡'
          }
        },
        {
          id: 3,
          lineId: 'user789',
          customerId: 'CUST003',
          displayName: '林小華',
          name: '林小華',
          email: 'lin@example.com',
          phone: '0934567890',
          address: '新北市板橋區文化路一段100號',
          carrier: null,
          taxId: '12345678',
          createdAt: '2023-05-08T14:20:00Z',
          updatedAt: '2023-10-25T16:30:00Z',
          customer: {
            companyName: '甜心烘焙坊'
          }
        },
        {
          id: 4,
          lineId: 'user101',
          customerId: 'CUST004',
          displayName: '陳美美',
          name: '陳美美',
          email: 'chen@example.com',
          phone: '0945678901',
          address: '台中市西區英才路500號',
          carrier: 'CD87654321',
          taxId: null,
          createdAt: '2023-07-12T09:10:00Z',
          updatedAt: '2023-09-18T11:25:00Z',
          customer: {
            companyName: '日和麵包坊'
          }
        },
        {
          id: 5,
          lineId: 'user202',
          customerId: 'CUST005',
          displayName: '李大同',
          name: '李大同',
          email: 'li@example.com',
          phone: '0956789012',
          address: '高雄市前金區中正四路100號',
          carrier: null,
          taxId: '87654321',
          createdAt: '2023-08-25T16:45:00Z',
          updatedAt: '2023-12-10T10:15:00Z',
          customer: {
            companyName: '陽光咖啡'
          }
        },
        {
          id: 6,
          lineId: 'user303',
          customerId: 'CUST006',
          displayName: '吳小芳',
          name: '吳小芳',
          email: 'wu@example.com',
          phone: '0967890123',
          address: '台南市東區中華東路三段200號',
          carrier: 'EF13579246',
          taxId: null,
          createdAt: '2023-09-30T13:25:00Z',
          updatedAt: '2023-12-28T15:40:00Z',
          customer: {
            companyName: '甜心烘焙坊'
          }
        }
      ];
      
      setCustomers(mockCustomers);
      setAllCustomers(mockCustomers);
      
      // 設置分頁信息
      setMeta({
        total: mockCustomers.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(mockCustomers.length / 10)
      });
      
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 獲取唯一的公司名稱列表
  useEffect(() => {
    if (customers.length > 0) {
      // 獲取所有不重複的公司名稱
      const uniqueCompanies = Array.from(new Set(
        customers
          .filter(customer => customer.customer?.companyName)
          .map(customer => customer.customer?.companyName || '')
      )).filter(name => name !== '');
      
      // 按字母順序排序
      uniqueCompanies.sort();
      setCompanyNames(uniqueCompanies);
    }
  }, [customers]);

  // 頁面變化處理
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= meta.totalPages) {
      setMeta({
        ...meta,
        page: page
      });
    }
  };

  // 應用篩選
  const handleApplyFilters = () => {
    setLoading(true);
    
    try {
      // 從所有客戶數據中進行篩選
      let filteredCustomers = [...allCustomers];
      
      // 根據搜索關鍵字篩選
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer => {
          // 根據不同欄位進行搜索
          return (
            (customer.lineId && customer.lineId.toLowerCase().includes(query)) ||
            (customer.displayName && customer.displayName.toLowerCase().includes(query)) ||
            (customer.name && customer.name.toLowerCase().includes(query)) ||
            (customer.email && customer.email.toLowerCase().includes(query)) ||
            (customer.phone && customer.phone.includes(query)) ||
            (customer.customerId && customer.customerId.includes(query))
          );
        });
      }
      
      // 根據公司名稱篩選
      if (selectedCompany) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.customer?.companyName === selectedCompany
        );
      }
      
      // 排序
      filteredCustomers.sort((a, b) => {
        const fieldA = a[sortBy as keyof Customer];
        const fieldB = b[sortBy as keyof Customer];
        
        // 處理複雜的嵌套欄位
        if (sortBy === 'companyName') {
          const companyA = a.customer?.companyName || '';
          const companyB = b.customer?.companyName || '';
          return sortOrder === 'ASC' 
            ? companyA.localeCompare(companyB)
            : companyB.localeCompare(companyA);
        }
        
        // 處理一般欄位
        if (fieldA === undefined || fieldB === undefined) return 0;
        
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortOrder === 'ASC' 
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }
        
        // 數字或日期比較
        return sortOrder === 'ASC'
          ? (fieldA as any) - (fieldB as any)
          : (fieldB as any) - (fieldA as any);
      });
      
      // 更新客戶列表和分頁信息
      setCustomers(filteredCustomers);
      
      // 更新分頁信息
      const totalFiltered = filteredCustomers.length;
      const totalPages = Math.ceil(totalFiltered / meta.limit);
      
      setMeta({
        ...meta,
        total: totalFiltered,
        totalPages: totalPages > 0 ? totalPages : 1,
        page: 1 // 重置到第一頁
      });
    } catch (err) {
      console.error('前端篩選錯誤:', err);
      setError(err instanceof Error ? err.message : '篩選時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 重置篩選
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCompany('');
    setSortBy('id');
    setSortOrder('ASC');
    setCustomers(allCustomers);
    setMeta({
      ...meta,
      total: allCustomers.length,
      totalPages: Math.ceil(allCustomers.length / meta.limit),
      page: 1
    });
  };

  // 排序切換
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // 切換排序方向
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // 切換排序欄位並設置為升序
      setSortBy(field);
      setSortOrder('ASC');
    }
    
    // 立即應用排序
    handleApplyFilters();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">客戶管理</h1>
      </div>
      
      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          錯誤: {error}
        </div>
      )}
      
      {/* 過濾和搜索 */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索用戶</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入名稱、電子郵件或手機..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客戶業主</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">全部</option>
                  {companyNames.map((company, index) => (
                    <option key={index} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-shrink-0 gap-2 mt-4 md:mt-6">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              應用過濾
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              重置
            </button>
          </div>
        </div>
      </div>
      
      {/* 客戶列表 - 桌面版 */}
      <div className="hidden sm:block bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mb-2"></div>
            <p className="text-gray-600">正在加載客戶資料...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">沒有找到客戶資料</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    ID
                    {sortBy === 'id' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('displayName')}
                  >
                    姓名
                    {sortBy === 'displayName' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    聯絡資訊
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('customerId')}
                  >
                    業主資料
                    {sortBy === 'customerId' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    建立時間
                    {sortBy === 'createdAt' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name || customer.displayName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                      <div className="text-sm text-gray-500">{customer.phone || '-'}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{customer.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-sm text-gray-900">{customer.customerId || '-'}</div>
                      <div className="text-sm text-gray-500">{customer.customer?.companyName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/sales/customers/${customer.id}`} className="text-amber-600 hover:text-amber-900">
                          查看詳情
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 分頁 */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                顯示 <span className="font-medium">{(meta.page - 1) * meta.limit + 1}</span> 到 
                <span className="font-medium">{Math.min(meta.page * meta.limit, meta.total)}</span> 項，
                共 <span className="font-medium">{meta.total}</span> 項
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                  className={`px-3 py-1 rounded-md ${meta.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  上一頁
                </button>
                
                {[...Array(meta.totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        meta.page === pageNum
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page === meta.totalPages}
                  className={`px-3 py-1 rounded-md ${meta.page === meta.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  下一頁
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 客戶列表 - 行動版 */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mb-2"></div>
            <p className="text-gray-600">正在加載客戶資料...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">沒有找到客戶資料</p>
          </div>
        ) : (
          <>
            {customers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-lg font-medium text-gray-900">{customer.name || customer.displayName || '-'}</div>
                  <div className="text-xs text-amber-600 font-medium">ID: {customer.id}</div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">電子郵件:</span>
                    <span className="text-gray-900 col-span-2">{customer.email || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">聯絡電話:</span>
                    <span className="text-gray-900 col-span-2">{customer.phone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">客戶編號:</span>
                    <span className="text-gray-900 col-span-2">{customer.customerId || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">業主名稱:</span>
                    <span className="text-gray-900 col-span-2">{customer.customer?.companyName || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">建立時間:</span>
                    <span className="text-gray-900 col-span-2">{new Date(customer.createdAt).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link href={`/sales/customers/${customer.id}`} className="text-amber-600 hover:text-amber-900 text-sm font-medium">
                    查看詳情
                  </Link>
                </div>
              </div>
            ))}
            
            {/* 行動版分頁 */}
            {meta.totalPages > 1 && (
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  顯示 {meta.page}/{meta.totalPages} 頁
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(meta.page - 1)}
                    disabled={meta.page === 1}
                    className={`px-2 py-1 border border-gray-300 rounded-md text-xs font-medium ${meta.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    上一頁
                  </button>
                  <button
                    onClick={() => handlePageChange(meta.page + 1)}
                    disabled={meta.page === meta.totalPages}
                    className={`px-2 py-1 border border-gray-300 rounded-md text-xs font-medium ${meta.page === meta.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )};

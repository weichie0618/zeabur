'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 定義客戶類型
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  companyId: string;
  industry: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CustomersManagement() {
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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // 行業別選項
  const industryOptions = [
    '烘焙坊／麵包店',
    '咖啡廳／茶館',
    '餐廳',
    '飯店',
    '零售商店',
    '其他'
  ];
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 獲取客戶列表
  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // 構建查詢參數
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', meta.limit.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('order', sortOrder);
      
      if (selectedStatus) {
        queryParams.append('status', selectedStatus);
      }
      
      if (selectedIndustry) {
        queryParams.append('industry', selectedIndustry);
      }
      
      // 添加搜索查詢
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }
      
      // 添加時間戳參數，防止快取
      const timestamp = Date.now();
      queryParams.append('t', timestamp.toString());
      
      const apiUrl = `/api/customers?${queryParams.toString()}`;
      console.log('發送請求到:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`無法獲取客戶資料: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setCustomers(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('獲取客戶錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 初始加載和重新過濾時獲取客戶
  useEffect(() => {
    fetchCustomers(meta.page);
  }, [sortBy, sortOrder, selectedStatus, selectedIndustry]);

  // 頁面變化處理
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= meta.totalPages) {
      fetchCustomers(page);
    }
  };

  // 應用篩選
  const handleApplyFilters = () => {
    fetchCustomers(1); // 重置到第一頁
  };

  // 重置篩選
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedIndustry('');
    setSortBy('id');
    setSortOrder('ASC');
    fetchCustomers(1);
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
  };

  // 獲取狀態樣式
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-300';
    }
  };

  // 翻譯狀態
  const translateStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '活躍';
      case 'inactive':
        return '非活躍';
      default:
        return status;
    }
  };

  // 處理刪除按鈕點擊
  const handleDeleteClick = (customerId: number) => {
    setDeletingCustomerId(customerId);
    setShowDeleteConfirm(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  // 處理取消刪除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingCustomerId(null);
    setDeleteError(null);
  };

  // 處理確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingCustomerId) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const response = await fetch(`/api/customers/${deletingCustomerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除客戶失敗');
      }
      
      const data = await response.json();
      setDeleteSuccess(data.message || '客戶已成功刪除');
      
      // 重新獲取客戶列表
      fetchCustomers(meta.page);
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setDeleteSuccess(null);
        setDeletingCustomerId(null);
      }, 3000);
      
    } catch (err) {
      console.error('刪除客戶錯誤:', err);
      setDeleteError(err instanceof Error ? err.message : '刪除客戶時發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">客戶管理</h1>
      
      {/* 成功訊息 */}
      {deleteSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {deleteSuccess}
        </div>
      )}
      
      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          錯誤: {error}
        </div>
      )}
      
      {/* 過濾和搜索 */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索客戶</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入名稱、電子郵件或手機..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客戶狀態</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">全部狀態</option>
                  <option value="active">活躍</option>
                  <option value="inactive">非活躍</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行業別</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">全部行業</option>
                  {industryOptions.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-shrink-0 gap-2 mt-4 md:mt-6">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      
      {/* 添加客戶按鈕 */}
      <div className="mb-6 flex justify-end">
        <Link href="/admin/bakery/customers/new" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
          新增客戶
        </Link>
      </div>
      
      {/* 客戶列表 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
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
                    onClick={() => handleSort('name')}
                  >
                    姓名
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    公司資訊
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    聯絡資訊
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('industry')}
                  >
                    行業別
                    {sortBy === 'industry' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    建立時間
                    {sortBy === 'created_at' && (
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
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      {customer.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{customer.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.companyName || '未提供'}</div>
                      <div className="text-sm text-gray-500">{customer.companyId ? `統編: ${customer.companyId}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.industry || '未分類'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(customer.status)}`}>
                        {translateStatus(customer.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/bakery/customers/${customer.id}`} className="text-indigo-600 hover:text-indigo-900">
                          查看
                        </Link>
                        <Link href={`/admin/bakery/customers/edit/${customer.id}`} className="text-blue-600 hover:text-blue-900">
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
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
                  // 只顯示前後 2 頁和當前頁
                  if (
                    pageNum === 1 ||
                    pageNum === meta.totalPages ||
                    (pageNum >= meta.page - 2 && pageNum <= meta.page + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-md ${
                          meta.page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  
                  // 顯示省略號
                  if (
                    (pageNum === meta.page - 3 && pageNum > 1) ||
                    (pageNum === meta.page + 3 && pageNum < meta.totalPages)
                  ) {
                    return <span key={pageNum}>...</span>;
                  }
                  
                  return null;
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
      
      {/* 刪除確認彈窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">確認刪除</h3>
            
            {deleteError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {deleteError}
              </div>
            )}
            
            <p className="mb-6 text-gray-700">您確定要刪除此客戶嗎？此操作無法撤銷。</p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    處理中...
                  </>
                ) : (
                  '確認刪除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
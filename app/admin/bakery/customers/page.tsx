'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  initializeAuth, 
  getAuthHeaders as getAuthHeadersFromService,
  handleAuthError as handleAuthErrorFromService,
  handleRelogin as handleReloginFromService,
  setupAuthWarningAutoHide
} from '../utils/authService';

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
  const [selectedCompany, setSelectedCompany] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 新增通知狀態
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // 新增臨時lineId狀態
  const [tempLineId, setTempLineId] = useState<string | null>(null);

  // 新增公司名稱列表狀態
  const [companyNames, setCompanyNames] = useState<string[]>([]);

  // 保存所有未篩選的客戶數據
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // 獲取認證頭部
  const getAuthHeaders = () => {
    return getAuthHeadersFromService(accessToken);
  };
  
  // 處理認證錯誤
  const handleAuthError = (errorMessage: string) => {
    handleAuthErrorFromService(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleRelogin = () => {
    handleReloginFromService();
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 初始化獲取認證令牌
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 獲取客戶列表
  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // 檢查令牌是否存在
      if (!accessToken) {
        handleAuthError('獲取客戶資料時缺少認證令牌');
        return;
      }
      
      // 構建查詢參數
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', meta.limit.toString());
      
      // 添加時間戳參數，防止快取
      const timestamp = Date.now();
      queryParams.append('t', timestamp.toString());
      
      // 使用新的LINE用戶API
      const apiUrl = `/api/customer/admin/lineusers?${queryParams.toString()}`;
      console.log('發送請求到:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      // 處理認證失敗
      if (response.status === 401) {
        handleAuthError('獲取LINE用戶列表時認證失敗');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`無法獲取LINE用戶資料: ${response.status}`);
      }
      
      const responseData: ApiResponse = await response.json();
      
      if (responseData.status !== 'success') {
        throw new Error(responseData.message || '獲取LINE用戶列表失敗');
      }
      
      setCustomers(responseData.data.lineUsers);
      setAllCustomers(responseData.data.lineUsers); // 保存未篩選的數據
      setMeta(responseData.data.pagination);
    } catch (err) {
      console.error('獲取客戶錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 初始加載和重新過濾時獲取客戶
  useEffect(() => {
    if (accessToken) {
      fetchCustomers(meta.page);
    }
  }, [sortBy, sortOrder, accessToken]);

  // 添加新的 useEffect 來獲取並設置唯一的公司名稱列表
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
      // 計算當前頁的索引範圍
      const startIndex = (page - 1) * meta.limit;
      const endIndex = Math.min(startIndex + meta.limit, customers.length);
      
      // 更新顯示的客戶列表
      setMeta({
        ...meta,
        page: page
      });
    }
  };

  // 應用篩選
  const handleApplyFilters = () => {
    // 在前端進行篩選
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
      
      console.log('前端篩選後的結果數量:', filteredCustomers.length);
      
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
    setCustomers(allCustomers); // 直接使用所有客戶數據
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
  const handleDeleteClick = (customerId: number, lineId: string) => {
    setDeletingCustomerId(customerId);
    // 設置lineId作為臨時狀態，用於刪除操作
    setTempLineId(lineId);
    setShowDeleteConfirm(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  // 處理取消刪除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingCustomerId(null);
    setTempLineId(null);
    setDeleteError(null);
  };

  // 處理確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingCustomerId || !tempLineId) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      // 使用暫存的lineId進行刪除
      const lineId = tempLineId;
      
      const response = await fetch(`/api/customer/admin/lineusers/${lineId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthError('刪除LINE用戶時認證失敗');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除LINE用戶失敗');
      }
      
      const data = await response.json();
      
      // 立即關閉確認彈窗
      setShowDeleteConfirm(false);
      setDeletingCustomerId(null);
      setTempLineId(null);
      
      // 設置成功通知，而不是直接設置 deleteSuccess
      setNotification({
        message: data.message || 'LINE用戶已成功刪除',
        type: 'success'
      });
      
      // 重新獲取客戶列表
      fetchCustomers(meta.page);
      
      // 5秒後自動清除通知
      setTimeout(() => {
        setNotification(null);
      }, 5000);
      
    } catch (err) {
      console.error('刪除LINE用戶錯誤:', err);
      setDeleteError(err instanceof Error ? err.message : '刪除LINE用戶時發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">客戶管理</h1>
      
      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          您的登入狀態已過期，請<a href="/auth/login" className="underline font-semibold">重新登入</a>後再訪問此頁面。
        </div>
      )}
      
      {/* 通知條 */}
      {notification && (
        <div className={`${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} 
                         border px-4 py-3 rounded mb-4 flex items-center justify-between transition-opacity duration-500`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            )}
            {notification.message}
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索用戶</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入名稱、LINE ID、電子郵件或手機..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客戶業主</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    onClick={() => handleSort('lineId')}
                  >
                    LINE ID
                    {sortBy === 'lineId' && (
                      <span className="ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('displayName')}
                  >
                    LINE暱稱/姓名
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
                    業主編號
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.lineId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-500">{customer.displayName || '-'}</div>
                    
                      <div className="text-sm font-medium text-gray-900">{customer.name || '-'}</div>
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
                        <Link href={`/admin/bakery/customers/${customer.lineId}`} className="text-indigo-600 hover:text-indigo-900">
                          查看
                        </Link>
                        <Link href={`/admin/bakery/customers/edit/${customer.lineId}`} className="text-blue-600 hover:text-blue-900">
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(customer.id, customer.lineId)}
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-lg font-medium">確認刪除</h3>
            </div>
            
            {deleteError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {deleteError}
              </div>
            )}
            
            <p className="mb-6 text-gray-700">您確定要刪除此客戶嗎？此操作無法撤銷。</p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center transition-colors"
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
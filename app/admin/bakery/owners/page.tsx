'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 定義業主類型
interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  location: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: Owner[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function OwnersManagement() {
  const [owners, setOwners] = useState<Owner[]>([]);
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
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingOwnerId, setDeletingOwnerId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 初始化獲取認證令牌
  useEffect(() => {
    // 從cookies中讀取accessToken
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) {
        console.log(`找到 ${name} cookie`);
        return decodeURIComponent(match[2]);
      } else {
        console.warn(`未找到 ${name} cookie`);
        return '';
      }
    };
    
    // 獲取令牌的函數
    const getToken = () => {
      // 先檢查 localStorage 是否有令牌
      let token = localStorage.getItem('accessToken');
      if (token) {
        console.log('從 localStorage 獲取令牌成功');
        return token;
      }
      
      // 如果 localStorage 沒有，再嘗試從 cookie 獲取
      token = getCookieValue('accessToken');
      if (token) {
        console.log('從 cookie 獲取令牌成功');
        // 將token也保存到localStorage，確保一致性
        localStorage.setItem('accessToken', token);
        return token;
      }
      
      console.error('無法獲取認證令牌');
      return '';
    };
    
    // 嘗試獲取令牌
    const token = getToken();
    
    if (token) {
      console.log('成功獲取令牌，長度:', token.length);
      setAccessToken(token);
    } else {
      setError('未獲取到認證令牌，請確認您已登入系統。請嘗試重新登入後再訪問此頁面。');
      setLoading(false);
    }
    
    // 添加重試機制
    let retryCount = 0;
    const maxRetries = 3;
    
    const retryFetchToken = () => {
      if (retryCount >= maxRetries) return;
      
      console.log(`嘗試重新獲取令牌 (第 ${retryCount + 1} 次)`);
      const newToken = getToken();
      
      if (newToken) {
        console.log('重試獲取令牌成功');
        setAccessToken(newToken);
      } else {
        retryCount++;
        // 延遲重試
        setTimeout(retryFetchToken, 1000);
      }
    };
    
    // 如果沒有token，嘗試重新獲取
    if (!token) {
      setTimeout(retryFetchToken, 1000);
    }
  }, []);
  
  // 第一次載入時獲取業主數據
  useEffect(() => {
    // 確保已獲取到token後再發起請求
    if (accessToken) {
      console.log('accessToken 已設置，準備獲取業主數據');
      fetchOwners();
    } else {
      // 不立即顯示錯誤，等待可能的自動重試
      console.warn('useEffect: 暫時缺少accessToken，等待獲取中...');
    }
  }, [accessToken]);

  // 獲取認證標頭
  const getAuthHeaders = () => {
    // 檢查並輸出 accessToken 的值，方便調試
    if (!accessToken) {
      console.warn('getAuthHeaders: accessToken 為空');
    } else {
      console.log('getAuthHeaders: 使用令牌', accessToken.substring(0, 10) + '...');
    }
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  };
  
  // 處理認證錯誤
  const handleAuthError = (errorMessage: string) => {
    console.error('認證錯誤:', errorMessage);
    setError(`認證失敗: ${errorMessage}。請重新登入系統。`);
    setShowAuthWarning(true);
    setLoading(false);
  };
  
  // 重新登入
  const handleRelogin = () => {
    // 清除舊的令牌
    localStorage.removeItem('accessToken');
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 跳轉到登錄頁面
    window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
  };

  // 獲取業主列表
  const fetchOwners = async (page = 1) => {
    // 檢查令牌是否存在
    if (!accessToken) {
      // 尋找可能存在但未被狀態捕獲的令牌
      const localToken = localStorage.getItem('accessToken');
      if (localToken) {
        console.log('找到localStorage中的令牌，嘗試使用它');
        setAccessToken(localToken);
        return; // 修改狀態後會觸發useEffect重新調用fetchOwners
      }
      
      // 確實沒有令牌，顯示錯誤
      console.error('獲取業主數據時缺少認證令牌');
      setError('認證失敗，請重新登入系統');
      setLoading(false);
      return;
    }
  
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
      
      // 添加搜索查詢
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }
      
      // 添加時間戳參數，防止快取
      const timestamp = Date.now();
      queryParams.append('t', timestamp.toString());
      
      const apiUrl = `/api/customers?${queryParams.toString()}`;
      console.log('發送請求到:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthError('獲取業主列表時認證失敗');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`無法獲取業主資料: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setOwners(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('獲取業主錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 應用篩選
  const handleApplyFilters = () => {
    if (!accessToken) {
      console.error('執行搜尋時缺少認證令牌');
      setError('認證失敗，請重新登入系統');
      return;
    }
    fetchOwners(1); // 重置到第一頁
  };

  // 初始加載和重新過濾時獲取業主
  useEffect(() => {
    if (accessToken) {
      fetchOwners(meta.page);
    }
  }, [sortBy, sortOrder, selectedStatus, accessToken]);

  // 頁面變化處理
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= meta.totalPages) {
      fetchOwners(page);
    }
  };

  // 重置篩選
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSortBy('id');
    setSortOrder('ASC');
    fetchOwners(1);
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
        return '啟用';
      case 'inactive':
        return '停用';
      default:
        return status;
    }
  };

  // 處理刪除按鈕點擊
  const handleDeleteClick = (ownerId: string) => {
    setDeletingOwnerId(ownerId);
    setShowDeleteConfirm(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  // 處理取消刪除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingOwnerId(null);
    setDeleteError(null);
  };

  // 處理確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingOwnerId) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const response = await fetch(`/api/customers/${deletingOwnerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthError('刪除業主時認證失敗');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除業主失敗');
      }
      
      const data = await response.json();
      setDeleteSuccess(data.message || '業主已成功刪除');
      
      // 重新獲取業主列表
      fetchOwners(meta.page);
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setDeleteSuccess(null);
        setDeletingOwnerId(null);
      }, 3000);
      
    } catch (err) {
      console.error('刪除業主錯誤:', err);
      setDeleteError(err instanceof Error ? err.message : '刪除業主時發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">業主管理</h1>
      
      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <div>認證失敗，請重新登入系統以獲取有效的認證憑證。</div>
          <button 
            onClick={handleRelogin}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            重新登入
          </button>
        </div>
      )}
      
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索業主</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入名稱、電子郵件或手機..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業主狀態</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">全部狀態</option>
                  <option value="active">啟用</option>
                  <option value="inactive">停用</option>
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
      
      {/* 添加業主按鈕 */}
      <div className="mb-6 flex justify-end">
        <Link href="/admin/bakery/owners/new" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
          新增業主
        </Link>
      </div>
      
      {/* 業主列表 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600">正在加載業主資料...</p>
          </div>
        ) : owners.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">沒有找到業主資料</p>
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
                    企業資訊
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    聯絡資訊
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
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                      {owner.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{owner.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{owner.companyName || '未提供'}</div>
                      <div className="text-sm text-gray-500">{owner.location || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{owner.email}</div>
                      <div className="text-sm text-gray-500">{owner.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(owner.status)}`}>
                        {translateStatus(owner.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(owner.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/bakery/owners/${owner.id}`} className="text-indigo-600 hover:text-indigo-900">
                          查看
                        </Link>
                        <Link href={`/admin/bakery/owners/edit/${owner.id}`} className="text-blue-600 hover:text-blue-900">
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(owner.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isDeleting && deletingOwnerId === owner.id}
                        >
                          {isDeleting && deletingOwnerId === owner.id ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              處理中
                            </span>
                          ) : (
                            '刪除'
                          )}
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
            
            <p className="mb-6 text-gray-700">您確定要刪除此業主嗎？此操作無法撤銷。</p>
            
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
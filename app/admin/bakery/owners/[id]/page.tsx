'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function OwnerDetails() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
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
    window.location.href = '/login';
  };
  
  // 獲取業主詳情
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!accessToken) {
        // 等待token獲取
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/customers/${id}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        
        if (response.status === 401) {
          handleAuthError('獲取業主詳情時認證失敗');
          return;
        }
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('找不到此業主');
          }
          throw new Error(`無法獲取業主資料: ${response.status}`);
        }
        
        const data = await response.json();
        setOwner(data);
      } catch (err) {
        console.error('獲取業主詳情錯誤:', err);
        setError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };
    
    if (id && accessToken) {
      fetchOwnerDetails();
    }
  }, [id, accessToken]);
  
  // 處理刪除按鈕點擊
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };
  
  // 處理取消刪除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };
  
  // 處理確認刪除
  const handleConfirmDelete = async () => {
    if (!accessToken) {
      handleAuthError('刪除業主時缺少認證令牌');
      return;
    }
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const response = await fetch(`/api/customers/${id}`, {
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
      
      // 成功刪除，導航到列表頁
      router.push('/admin/bakery/owners');
      
    } catch (err) {
      console.error('刪除業主錯誤:', err);
      setDeleteError(err instanceof Error ? err.message : '刪除業主時發生錯誤');
    } finally {
      setIsDeleting(false);
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
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
        <p className="text-gray-600">正在加載業主資料...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          錯誤: {error}
        </div>
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
        <Link 
          href="/admin/bakery/owners" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          返回列表
        </Link>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          找不到業主資料
        </div>
        <Link 
          href="/admin/bakery/owners" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">業主詳情</h1>
        <div className="flex gap-2">
          <Link 
            href="/admin/bakery/owners" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            返回列表
          </Link>
          <Link 
            href={`/admin/bakery/owners/edit/${owner.id}`} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            編輯
          </Link>
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            刪除
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{owner.name}</h2>
                <p className="text-gray-600">{owner.email}</p>
              </div>
              <div>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusStyle(owner.status)}`}>
                  {translateStatus(owner.status)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">基本資訊</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-sm">電話：</span>
                  <span className="text-gray-800">{owner.phone || '未提供'}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">地址：</span>
                  <span className="text-gray-800">{owner.address || '未提供'}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">公司名稱：</span>
                  <span className="text-gray-800">{owner.companyName || '未提供'}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">營業區域：</span>
                  <span className="text-gray-800">{owner.location || '未提供'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">系統資訊</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-sm">業主 ID：</span>
                  <span className="text-gray-800">{owner.id}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">建立日期：</span>
                  <span className="text-gray-800">{formatDate(owner.created_at)}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">最後更新：</span>
                  <span className="text-gray-800">{formatDate(owner.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {owner.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-2">備註</h3>
              <p className="text-gray-700 whitespace-pre-line">{owner.notes}</p>
            </div>
          )}
        </div>
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
            
            <p className="mb-6 text-gray-700">您確定要刪除 <span className="font-semibold">{owner.name}</span> 嗎？此操作無法撤銷。</p>
            
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
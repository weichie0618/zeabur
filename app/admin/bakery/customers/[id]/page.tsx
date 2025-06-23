'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  initializeAuth, 
  getAuthHeaders,
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide
} from '../../utils/authService';

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
  createdAt: string;
  updatedAt: string;
  lineId: string;
  displayName: string;
  customerId: string;
}

// 關聯客戶類型
interface RelatedCustomer {
  id: string;
  companyName: string;
  name: string;
  email: string;
  address: string;
}

// API 響應類型
interface ApiResponse {
  status: string;
  message: string;
  data: {
    lineUser: Customer;
    customer?: RelatedCustomer;
  };
}

export default function CustomerDetails() {
  const params = useParams();
  const router = useRouter();
  const lineId = params.id; // 直接使用URL參數作為lineId
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [relatedCustomer, setRelatedCustomer] = useState<RelatedCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 認證相關狀態
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 初始化認證
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 處理認證錯誤
  const handleAuthErrorLocal = (errorMessage: string) => {
    handleAuthError(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleReloginLocal = () => {
    handleRelogin();
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);

  // 獲取客戶詳情
  const fetchCustomerDetails = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 直接使用lineId獲取完整LINE用戶數據
      const response = await fetch(`/api/customer/admin/lineusers/${lineId}`, {
        headers: getAuthHeaders(accessToken),
        credentials: 'include'
      });
      
      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthErrorLocal('獲取客戶詳情時認證失敗');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`無法獲取LINE用戶資料: ${response.status}`);
      }
        
      const responseData: ApiResponse = await response.json();
      
      if (responseData.status !== 'success') {
        throw new Error(responseData.message || '獲取LINE用戶資料失敗');
      }
      
      setCustomer(responseData.data.lineUser);
      setRelatedCustomer(responseData.data.customer || null);
    } catch (err) {
      console.error('獲取LINE用戶詳情錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };
    
  useEffect(() => {
    if (lineId && accessToken) {
      fetchCustomerDetails();
    }
  }, [lineId, accessToken]);

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

  // 格式化日期時間
  const formatDateTime = (dateString: string) => {
    // 確保dateString有值且為有效的字串
    if (!dateString) {
      return '-';
    }
    
    try {
      // 嘗試直接創建Date對象
      const date = new Date(dateString);
      
      // 檢查date是否為有效日期
      if (isNaN(date.getTime())) {
        // 如果無效，嘗試其他日期格式解析方法
        
        // 檢查是否為ISO格式但缺少時區信息
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-').map(Number);
          const newDate = new Date(year, month - 1, day); // 月份從0開始
          
          if (!isNaN(newDate.getTime())) {
            return newDate.toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
          }
        }
        
        // 如果其他嘗試都失敗，返回原始字串
        return dateString;
      }
      
      // 日期有效，使用toLocaleString格式化
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return dateString || '-'; // 返回原始字串或'-'
    }
  };

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
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      if (!customer || !customer.lineId) {
        throw new Error('找不到LINE ID，無法刪除用戶');
      }
      
      // 使用lineId刪除LINE用戶
      const response = await fetch(`/api/customer/admin/lineusers/${lineId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(accessToken),
        credentials: 'include'
      });
      
      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthErrorLocal('刪除客戶時認證失敗');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除LINE用戶失敗');
      }
      
      const data = await response.json();
      
      // 刪除成功後導航回客戶列表頁面
      router.push('/admin/bakery/customers');
      
    } catch (err) {
      console.error('刪除LINE用戶錯誤:', err);
      setDeleteError(err instanceof Error ? err.message : '刪除LINE用戶時發生錯誤');
      setIsDeleting(false);
      // 不關閉彈窗，讓用戶可以看到錯誤訊息
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600">正在加載客戶資料...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            錯誤: {error}
          </div>
          <div className="flex justify-center">
            <Link href="/admin/bakery/customers" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              返回客戶列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">找不到客戶資料</p>
          </div>
          <div className="flex justify-center">
            <Link href="/admin/bakery/customers" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              返回客戶列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">LINE用戶詳情</h1>
        <div className="flex gap-2">
          <Link href="/admin/bakery/customers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
            返回列表
          </Link>
          <Link href={`/admin/bakery/customers/edit/${customer.lineId}`} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LINE基本信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">LINE基本資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">用戶 ID</p>
                  <p className="text-lg">{customer.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">LINE ID</p>
                  <p className="text-lg">{customer.lineId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">LINE暱稱</p>
                  <p className="text-lg font-medium">{customer.displayName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">客戶業主編號</p>
                  <p className="text-lg">{customer.customerId || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* 個人資訊 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">個人資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">姓名</p>
                  <p className="text-lg font-medium">{customer.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">電子郵件</p>
                  <p className="text-lg">{customer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">電話</p>
                  <p className="text-lg">{customer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">地址</p>
                  <p className="text-lg">{customer.address || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* 關聯業主資訊 */}
            {relatedCustomer && (
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">關聯業主資訊</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">客戶ID</p>
                    <p className="text-lg">{relatedCustomer.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">公司名稱</p>
                    <p className="text-lg font-medium">{relatedCustomer.companyName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">聯絡人</p>
                    <p className="text-lg">{relatedCustomer.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">電子郵件</p>
                    <p className="text-lg">{relatedCustomer.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">地址</p>
                    <p className="text-lg">{relatedCustomer.address || '-'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 系統信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">系統資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">建立時間</p>
                  <p className="text-md">{formatDateTime(customer.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最後更新時間</p>
                  <p className="text-md">{formatDateTime(customer.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
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
            
            <p className="mb-6 text-gray-700">您確定要刪除客戶 "{customer.name}" 嗎？此操作無法撤銷。</p>
            
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
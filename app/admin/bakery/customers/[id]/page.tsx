'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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

export default function CustomerDetails() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 獲取客戶詳情
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/customers/${customerId}`);
        
        if (!response.ok) {
          throw new Error(`無法獲取客戶資料: ${response.status}`);
        }
        
        const data = await response.json();
        setCustomer(data);
      } catch (err) {
        console.error('獲取客戶詳情錯誤:', err);
        setError(err instanceof Error ? err.message : '發生錯誤');
      } finally {
        setLoading(false);
      }
    };
    
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

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
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
      
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除客戶失敗');
      }
      
      // 刪除成功後導航回客戶列表頁面
      router.push('/admin/bakery/customers');
      
    } catch (err) {
      console.error('刪除客戶錯誤:', err);
      setDeleteError(err instanceof Error ? err.message : '刪除客戶時發生錯誤');
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
        <h1 className="text-2xl font-semibold">客戶詳情</h1>
        <div className="flex gap-2">
          <Link href="/admin/bakery/customers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
            返回列表
          </Link>
          <Link href={`/admin/bakery/customers/edit/${customer.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
            {/* 基本信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">基本資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">客戶 ID</p>
                  <p className="text-lg">{customer.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">狀態</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(customer.status)}`}>
                    {translateStatus(customer.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">姓名</p>
                  <p className="text-lg font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">電子郵件</p>
                  <p className="text-lg">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">電話</p>
                  <p className="text-lg">{customer.phone || '未提供'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">行業別</p>
                  <p className="text-lg">{customer.industry || '未分類'}</p>
                </div>
              </div>
            </div>
            
            {/* 公司信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">公司資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">公司名稱</p>
                  <p className="text-lg">{customer.companyName || '未提供'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">統一編號</p>
                  <p className="text-lg">{customer.companyId || '未提供'}</p>
                </div>
              </div>
            </div>
            
            {/* 地址信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">地址資訊</h2>
              <div>
                <p className="text-sm text-gray-500">地址</p>
                <p className="text-lg">{customer.address || '未提供'}</p>
              </div>
            </div>
            
            {/* 附加信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">附加資訊</h2>
              <div>
                <p className="text-sm text-gray-500">備註</p>
                <p className="text-lg whitespace-pre-wrap">{customer.notes || '無備註'}</p>
              </div>
            </div>
            
            {/* 系統信息 */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">系統資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">建立時間</p>
                  <p className="text-md">{formatDateTime(customer.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最後更新時間</p>
                  <p className="text-md">{formatDateTime(customer.updated_at)}</p>
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
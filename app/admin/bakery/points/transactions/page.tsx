'use client';

import React, { useState, useEffect } from 'react';
import { pointsApi, handleApiError, formatPoints, formatDisplayDate } from '../api';
import { PointTransaction, TransactionsQuery, TransactionType, TransactionStatus } from '../types';
import { initializeAuth } from '../../utils/authService';

export default function TransactionsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 交易記錄數據
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  
  // 篩選條件
  const [filters, setFilters] = useState<TransactionsQuery>({
    page: 1,
    limit: 20
  });

  // 添加調試狀態
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 初始化認證
  useEffect(() => {
    console.log('開始初始化認證...');
    setDebugInfo('正在初始化認證...');
    
    try {
      initializeAuth(
        (token) => {
          console.log('認證成功，令牌長度:', token?.length || 0);
          setAccessToken(token);
          setDebugInfo(`認證成功，令牌長度: ${token?.length || 0}`);
        },
        (errorMsg) => {
          console.error('認證失敗:', errorMsg);
          setError(errorMsg);
          setDebugInfo(`認證失敗: ${errorMsg}`);
        },
        (loadingState) => {
          console.log('載入狀態:', loadingState);
          setLoading(loadingState);
          setDebugInfo(`載入狀態: ${loadingState}`);
        },
        setShowAuthWarning,
        false // 不自動重定向
      );
    } catch (err) {
      console.error('初始化認證時發生錯誤:', err);
      setError(`初始化認證時發生錯誤: ${err}`);
      setDebugInfo(`初始化認證時發生錯誤: ${err}`);
      setLoading(false);
    }
  }, []);

  // 載入交易記錄
  useEffect(() => {
    if (accessToken) {
      console.log('開始載入交易記錄...');
      setDebugInfo(prev => prev + ' | 開始載入交易記錄...');
      loadTransactions();
    }
  }, [accessToken, filters]);

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    setDebugInfo(prev => prev + ' | 正在載入交易記錄...');
    
    try {
      console.log('正在調用交易記錄 API...');
      
      const response = await pointsApi.getTransactions(filters);
      
      console.log('交易記錄 API 響應:', response);
      setDebugInfo(prev => prev + ' | API 響應已接收');

      if (response.success) {
        setTransactions(response.data || []);
        setDebugInfo(prev => prev + ` | 載入了 ${response.data?.length || 0} 筆交易記錄`);
      } else {
        setError('載入交易記錄失敗');
        setDebugInfo(prev => prev + ' | 交易記錄載入失敗');
      }
    } catch (error) {
      console.error('載入交易記錄失敗:', error);
      setDebugInfo(prev => prev + ` | API 錯誤: ${error}`);
      handleApiError(error, setError, setTransactionsLoading, setShowAuthWarning);
    } finally {
      setTransactionsLoading(false);
      setLoading(false);
      setDebugInfo(prev => prev + ' | 載入完成');
    }
  };

  const handleFilterChange = (field: keyof TransactionsQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // 重置頁碼
    }));
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case TransactionType.EARN_PURCHASE:
        return '購買獲得';
      case TransactionType.USE_PAYMENT:
        return '使用抵扣';
      case TransactionType.CARD_REDEEM:
        return '點數卡兌換';
      case TransactionType.ADMIN_ADJUST:
        return '管理員調整';
      default:
        return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return '已完成';
      case TransactionStatus.PENDING:
        return '處理中';
      case TransactionStatus.FAILED:
        return '失敗';
      case TransactionStatus.CANCELLED:
        return '已取消';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TransactionStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case TransactionStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 如果還在載入中，顯示載入狀態和調試信息
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 mb-2">正在載入交易記錄...</p>
        <div className="text-sm text-gray-500 max-w-2xl text-center">
          <strong>調試信息:</strong>
          <br />
          {debugInfo}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">載入錯誤</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4 text-xs text-gray-600">
              <strong>調試信息:</strong>
              <br />
              {debugInfo}
            </div>
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">點數交易記錄</h1>
        <p className="mt-2 text-sm text-gray-600">
          檢視所有點數相關的交易記錄和操作歷史
        </p>
      </div>

      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">認證警告</h3>
              <div className="mt-2 text-sm text-yellow-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 篩選器 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">篩選條件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">交易類型</label>
            <select
              value={filters.transactionType || ''}
              onChange={(e) => handleFilterChange('transactionType', e.target.value || undefined)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">全部類型</option>
              <option value={TransactionType.EARN_PURCHASE}>購買獲得</option>
              <option value={TransactionType.USE_PAYMENT}>使用抵扣</option>
              <option value={TransactionType.CARD_REDEEM}>點數卡兌換</option>
              <option value={TransactionType.ADMIN_ADJUST}>管理員調整</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">交易狀態</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">全部狀態</option>
              <option value={TransactionStatus.COMPLETED}>已完成</option>
              <option value={TransactionStatus.PENDING}>處理中</option>
              <option value={TransactionStatus.FAILED}>失敗</option>
              <option value={TransactionStatus.CANCELLED}>已取消</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">用戶ID</label>
            <input
              type="number"
              value={filters.lineUserId || ''}
              onChange={(e) => handleFilterChange('lineUserId', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="輸入用戶ID..."
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 交易記錄列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">交易記錄</h3>

          {transactionsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      類型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      點數變動
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      餘額變化
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions && transactions.length > 0 ? transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.lineUser?.displayName || transaction.lineUser?.name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {transaction.lineUserId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTransactionTypeText(transaction.transactionType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          (transaction.points || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(transaction.points || 0) > 0 ? '+' : ''}{formatPoints(transaction.points || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPoints(transaction.pointsBefore || 0)} → {formatPoints(transaction.pointsAfter || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDisplayDate(transaction.createdAt)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {transactionsLoading ? '載入中...' : '暫無交易記錄'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 調試信息 (僅在開發環境顯示) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <strong>調試信息:</strong>
          <br />
          {debugInfo}
        </div>
      )}
    </div>
  );
} 
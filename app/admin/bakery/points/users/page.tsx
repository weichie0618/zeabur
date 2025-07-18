'use client';

import React, { useState, useEffect } from 'react';
import { pointsApi, handleApiError, formatPoints, formatDisplayDate } from '../api';
import { UserPointsStats, UsersPointsQuery } from '../types';
import { initializeAuth } from '../../utils/authService';

export default function UsersPointsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 用戶點數數據
  const [users, setUsers] = useState<UserPointsStats[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  // 載入用戶點數數據
  useEffect(() => {
    if (accessToken) {
      console.log('開始載入用戶數據...');
      setDebugInfo(prev => prev + ' | 開始載入用戶數據...');
      loadUsers();
    }
  }, [accessToken]);

  const loadUsers = async () => {
    setUsersLoading(true);
    setDebugInfo(prev => prev + ' | 正在載入用戶數據...');
    
    try {
      console.log('正在調用用戶點數 API...');
      
      const query: UsersPointsQuery = {
        page: 1,
        limit: 20,
        search: searchTerm || undefined,
        sortBy: 'availablePoints',
        sortOrder: 'DESC'
      };

      const response = await pointsApi.getUsersPointsStats(query);
      
      console.log('用戶點數 API 響應:', response);
      setDebugInfo(prev => prev + ' | API 響應已接收');

      if (response.success) {
        setUsers(response.data || []);
        setDebugInfo(prev => prev + ` | 載入了 ${response.data?.length || 0} 個用戶`);
      } else {
        setError('載入用戶數據失敗');
        setDebugInfo(prev => prev + ' | 用戶數據載入失敗');
      }
    } catch (error) {
      console.error('載入用戶數據失敗:', error);
      setDebugInfo(prev => prev + ` | API 錯誤: ${error}`);
      handleApiError(error, setError, setUsersLoading, setShowAuthWarning);
    } finally {
      setUsersLoading(false);
      setLoading(false);
      setDebugInfo(prev => prev + ' | 載入完成');
    }
  };

  // 如果還在載入中，顯示載入狀態和調試信息
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 mb-2">正在載入用戶點數管理...</p>
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
        <h1 className="text-2xl font-bold text-gray-900">用戶點數管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          管理所有用戶的點數餘額和交易記錄
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

      {/* 搜尋 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋用戶姓名、郵箱或電話..."
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={loadUsers}
            disabled={usersLoading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            搜尋
          </button>
        </div>
      </div>

      {/* 用戶列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">用戶列表</h3>

          {usersLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶資訊
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      可用點數
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      總獲得
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      總使用
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最後活動
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users && users.length > 0 ? users.map((user) => (
                    <tr key={user.lineUserId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.lineUserId || user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {formatPoints(user.availablePoints || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPoints(user.totalEarnedPoints || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPoints(user.totalUsedPoints || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastEarnedAt ? formatDisplayDate(user.lastEarnedAt) : '無記錄'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        {usersLoading ? '載入中...' : '暫無用戶數據'}
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
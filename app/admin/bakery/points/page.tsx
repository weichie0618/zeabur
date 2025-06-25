'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { pointsApi, handleApiError, formatPoints, formatCurrency } from './api';
import { PointsSystemStats, DailyPointsStats } from './types';
import { initializeAuth } from '../utils/authService';

export default function PointsOverviewPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 統計數據
  const [systemStats, setSystemStats] = useState<PointsSystemStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyPointsStats[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

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
        false // 不自動重定向，讓我們先看到錯誤
      );
    } catch (err) {
      console.error('初始化認證時發生錯誤:', err);
      setError(`初始化認證時發生錯誤: ${err}`);
      setDebugInfo(`初始化認證時發生錯誤: ${err}`);
      setLoading(false);
    }
  }, []);

  // 載入統計數據
  useEffect(() => {
    if (accessToken) {
      console.log('開始載入統計數據...');
      setDebugInfo(prev => prev + ' | 開始載入統計數據...');
      loadStats();
    }
  }, [accessToken]);

  const loadStats = async () => {
    setStatsLoading(true);
    setDebugInfo(prev => prev + ' | 正在載入統計數據...');
    
    try {
      console.log('正在調用 API...');
      
      const [statsResponse, dailyResponse] = await Promise.all([
        pointsApi.getPointsSystemStats(),
        pointsApi.getDailyPointsStats(7) // 過去7天
      ]);

      console.log('API 響應:', { statsResponse, dailyResponse });
      setDebugInfo(prev => prev + ' | API 響應已接收');

      if (statsResponse.success) {
        setSystemStats(statsResponse.data);
        setDebugInfo(prev => prev + ' | 系統統計載入成功');
      } else {
        setError('載入系統統計失敗');
        setDebugInfo(prev => prev + ' | 系統統計載入失敗');
      }

      if (dailyResponse.success) {
        setDailyStats(dailyResponse.data);
        setDebugInfo(prev => prev + ' | 每日統計載入成功');
      } else {
        setError('載入每日統計失敗');
        setDebugInfo(prev => prev + ' | 每日統計載入失敗');
      }
      
    } catch (error) {
      console.error('載入統計數據失敗:', error);
      setDebugInfo(prev => prev + ` | API 錯誤: ${error}`);
      handleApiError(error, setError, setStatsLoading, setShowAuthWarning);
    } finally {
      setStatsLoading(false);
      setLoading(false);
      setDebugInfo(prev => prev + ' | 載入完成');
    }
  };

  // 如果還在載入中，顯示載入狀態和調試信息
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 mb-2">正在載入點數系統...</p>
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
        <h1 className="text-2xl font-bold text-gray-900">點數系統概覽</h1>
        <p className="mt-2 text-sm text-gray-600">
          檢視點數系統的整體使用情況和統計數據
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
              <div className="mt-2 text-sm text-yellow-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 統計卡片 */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="總交易數"
            value={systemStats.totalTransactions.toLocaleString()}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="總獲得點數"
            value={formatPoints(systemStats.totalPointsEarned)}
            icon="⬆️"
            color="green"
          />
          <StatCard
            title="總使用點數"
            value={formatPoints(systemStats.totalPointsUsed)}
            icon="⬇️"
            color="red"
          />
          <StatCard
            title="活躍用戶"
            value={systemStats.activeUsers.toLocaleString()}
            icon="👥"
            color="purple"
          />
          <StatCard
            title="剩餘點數"
            value={formatPoints(systemStats.totalAvailablePoints)}
            icon="💰"
            color="yellow"
          />
        </div>
      )}

      {/* 快速導航 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickNavCard
          title="用戶點數"
          description="管理用戶點數，手動調整點數餘額"
          href="/admin/bakery/points/users"
          icon="👤"
        />
        <QuickNavCard
          title="交易記錄"
          description="檢視所有點數交易記錄"
          href="/admin/bakery/points/transactions"
          icon="📝"
        />
        <QuickNavCard
          title="虛擬點數卡"
          description="管理虛擬點數卡商品和購買記錄"
          href="/admin/bakery/points/virtual-cards"
          icon="💳"
        />
        <QuickNavCard
          title="系統設定"
          description="調整點數系統參數和規則"
          href="/admin/bakery/points/settings"
          icon="⚙️"
        />
      </div>

      {/* 每日統計圖表 */}
      {dailyStats.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">過去7天點數統計</h3>
          <div className="space-y-4">
            {dailyStats.map((stat, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {new Date(stat.date).toLocaleDateString('zh-TW')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      活躍用戶: {stat.activeUsers} | 交易數: {stat.transactionCount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">
                      獲得: {formatPoints(stat.pointsEarned)}
                    </p>
                    <p className="text-sm text-red-600">
                      使用: {formatPoints(stat.pointsUsed)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {statsLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

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

// 統計卡片組件
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className={`text-lg font-medium ${colorClasses[color]}`}>
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// 快速導航卡片組件
interface QuickNavCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

const QuickNavCard: React.FC<QuickNavCardProps> = ({ title, description, href, icon }) => {
  return (
    <Link href={href} className="group">
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">{icon}</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 
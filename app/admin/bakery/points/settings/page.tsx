'use client';

import React, { useState, useEffect } from 'react';
import { settingsApi, handleApiError } from '../api';
import { PointSettings } from '../types';
import { initializeAuth } from '../../utils/authService';

export default function SettingsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 系統設定數據
  const [settings, setSettings] = useState<PointSettings[]>([]);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 表單狀態
  const [formSettings, setFormSettings] = useState<{[key: string]: string}>({});

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

  // 載入設定
  useEffect(() => {
    if (accessToken) {
      console.log('開始載入系統設定...');
      setDebugInfo(prev => prev + ' | 開始載入系統設定...');
      loadSettings();
    }
  }, [accessToken]);

  const loadSettings = async () => {
    setSettingsLoading(true);
    setDebugInfo(prev => prev + ' | 正在載入設定數據...');
    
    try {
      console.log('正在調用系統設定 API...');
      
      const response = await settingsApi.getSettings();
      
      console.log('系統設定 API 響應:', response);
      setDebugInfo(prev => prev + ' | API 響應已接收');

      if (response.success) {
        setSettings(response.data || []);
        setDebugInfo(prev => prev + ` | 載入了 ${response.data?.length || 0} 個設定項目`);
        
        // 初始化表單狀態
        const formData: {[key: string]: string} = {};
        response.data?.forEach(setting => {
          formData[setting.settingKey] = setting.settingValue;
        });
        setFormSettings(formData);
      } else {
        setError('載入系統設定失敗');
        setDebugInfo(prev => prev + ' | 設定載入失敗');
      }
    } catch (error) {
      console.error('載入系統設定失敗:', error);
      setDebugInfo(prev => prev + ` | API 錯誤: ${error}`);
      handleApiError(error, setError, setSettingsLoading, setShowAuthWarning);
    } finally {
      setSettingsLoading(false);
      setLoading(false);
      setDebugInfo(prev => prev + ' | 設定載入完成');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      const updateData = settings.map(setting => ({
        id: setting.id,
        settingValue: formSettings[setting.settingKey] || setting.settingValue
      }));

      const response = await settingsApi.updateSettings({ settings: updateData });
      
      if (response.success) {
        setSettings(response.data || []);
        // 可以在這裡顯示成功訊息
      } else {
        setError('保存設定失敗');
      }
    } catch (error) {
      handleApiError(error, setError, setSaving, setShowAuthWarning);
    } finally {
      setSaving(false);
    }
  };

  const getSettingDisplayName = (key: string): string => {
    const displayNames: {[key: string]: string} = {
      // 基本功能開關
      'points_system_enabled': '啟用點數系統',
      'purchase_reward_enabled': '啟用購買回饋',
      'virtual_card_enabled': '啟用虛擬點數卡',
      'point_usage_enabled': '啟用點數使用',
      'point_card_enabled': '啟用點數卡販售',
      
      // 回饋設定
      'earn_rate_percentage': '購買回饋比例 (%)',
      'min_order_amount_for_points': '最低回饋訂單金額 (元)',
      'max_points_per_order': '單筆最高回饋點數',
      'min_earn_amount': '最低回饋訂單金額 (元)', // 舊版相容
      
      // 點數使用規則
      'points_to_currency_rate': '點數兌換率 (1點=多少元)',
      'max_points_usage_percentage': '最高抵扣比例 (%)',
      'points_expire_days': '點數有效期 (天)',
      
      // 其他設定
      'POINTS_EXPIRY_DAYS': '點數有效期 (天)', // 舊版相容
      'POINTS_MIN_USE': '最低使用點數',
      'POINTS_MAX_USE_RATE': '最高抵扣比例 (%)',
      'VIRTUAL_CARD_MIN_AMOUNT': '虛擬卡最低金額 (元)'
    };
    return displayNames[key] || key;
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: {[key: string]: string} = {
      // 基本功能開關
      'points_system_enabled': '控制整個點數系統的開關，關閉後用戶無法獲得或使用點數',
      'purchase_reward_enabled': '是否啟用購買商品後的點數回饋功能，關閉後用戶購買商品不會獲得點數',
      'virtual_card_enabled': '是否啟用虛擬點數卡功能，允許販售和購買點數卡',
      'point_usage_enabled': '是否允許用戶使用點數抵扣訂單金額',
      'point_card_enabled': '是否啟用點數卡商品的販售功能',
      
      // 回饋設定
      'earn_rate_percentage': '每消費 100 元可獲得多少點數',
      'min_order_amount_for_points': '訂單金額需達到此金額才能獲得點數回饋',
      'max_points_per_order': '單筆訂單最多可獲得的點數上限，防止過度回饋',
      'min_earn_amount': '訂單金額需達到此金額才能獲得點數回饋',
      
      // 點數使用規則
      'points_to_currency_rate': '點數兌換成現金的比例，1點等於多少新台幣',
      'max_points_usage_percentage': '點數最多可以抵扣訂單金額的百分比，建議不超過50%',
      'points_expire_days': '點數從獲得日期開始的有效天數，設為 0 表示永不過期',
      
      // 其他設定
      'POINTS_EXPIRY_DAYS': '點數從獲得日期開始的有效天數，設為 0 表示永不過期（舊版相容）',
      'POINTS_MIN_USE': '每次使用點數的最低金額，避免小額使用造成系統負擔',
      'POINTS_MAX_USE_RATE': '點數最多可以抵扣訂單金額的百分比（舊版相容）',
      'VIRTUAL_CARD_MIN_AMOUNT': '虛擬點數卡的最低購買金額'
    };
    return descriptions[key] || '';
  };

  // 渲染設定分組
  const renderSettingsGroup = (title: string, description: string, settingKeys: string[]) => {
    const groupSettings = settings.filter(setting => settingKeys.includes(setting.settingKey));
    
    if (groupSettings.length === 0) return null;

    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        
        <div className="space-y-6">
          {groupSettings.map((setting) => (
            <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {getSettingDisplayName(setting.settingKey)}
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  {getSettingDescription(setting.settingKey)}
                </p>
              </div>
              
              <div>
                {(setting.settingKey === 'VIRTUAL_CARD_ENABLED' || 
                  setting.settingKey === 'virtual_card_enabled' ||
                  setting.settingKey === 'points_system_enabled' ||
                  setting.settingKey === 'purchase_reward_enabled' ||
                  setting.settingKey === 'point_usage_enabled' ||
                  setting.settingKey === 'point_card_enabled') ? (
                  <select
                    value={formSettings[setting.settingKey] || ''}
                    onChange={(e) => setFormSettings(prev => ({
                      ...prev,
                      [setting.settingKey]: e.target.value
                    }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="true">啟用</option>
                    <option value="false">停用</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    value={formSettings[setting.settingKey] || ''}
                    onChange={(e) => setFormSettings(prev => ({
                      ...prev,
                      [setting.settingKey]: e.target.value
                    }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={setting.settingValue}
                    min="0"
                    step={setting.settingKey.includes('rate') || setting.settingKey.includes('RATE') ? "0.01" : "1"}
                  />
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                目前值: <span className="font-medium">{setting.settingValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 如果還在載入中，顯示載入狀態和調試信息
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 mb-2">正在載入系統設定...</p>
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
        <h1 className="text-2xl font-bold text-gray-900">系統設定</h1>
        <p className="mt-2 text-sm text-gray-600">
          配置點數系統的各項參數和規則
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

      {/* 設定表單 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">點數系統設定</h3>
          
          {settingsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {settings && settings.length > 0 ? (
                <>
                  {/* 功能開關設定 */}
                  {renderSettingsGroup(
                    "功能開關設定",
                    "控制各項功能的啟用與停用",
                    ['points_system_enabled', 'purchase_reward_enabled', 'virtual_card_enabled', 'point_usage_enabled', 'point_card_enabled']
                  )}
                  
                  {/* 回饋設定 */}
                  {renderSettingsGroup(
                    "回饋設定",
                    "配置點數回饋的相關參數",
                    ['earn_rate_percentage', 'min_order_amount_for_points', 'max_points_per_order', 'min_earn_amount']
                  )}
                  
                  {/* 點數使用規則 */}
                  {renderSettingsGroup(
                    "點數使用規則",
                    "設定點數使用和兌換的相關規則",
                    ['points_to_currency_rate', 'max_points_usage_percentage', 'points_expire_days', 'POINTS_EXPIRY_DAYS', 'POINTS_MIN_USE', 'POINTS_MAX_USE_RATE']
                  )}
                  
                  {/* 其他設定 */}
                  {renderSettingsGroup(
                    "其他設定",
                    "額外的系統設定參數",
                    ['VIRTUAL_CARD_MIN_AMOUNT']
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">
                    {settingsLoading ? '載入中...' : '暫無設定項目'}
                  </p>
                </div>
              )}

              {settings && settings.length > 0 && (
                <div className="flex justify-end pt-6">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        保存中...
                      </>
                    ) : (
                      '保存設定'
                    )}
                  </button>
                </div>
              )}
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
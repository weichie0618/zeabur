'use client';

import React, { useState, useEffect } from 'react';
import { settingsApi, handleApiError } from '../api';
import { PointSettings, UpdateSettingsRequest } from '../types';
import { initializeAuth } from '../../utils/authService';

export default function PointsSettingsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 系統設定
  const [settings, setSettings] = useState<PointSettings[]>([]);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  
  // 設定值暫存
  const [settingValues, setSettingValues] = useState<{ [key: number]: string }>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // 初始化認證
  useEffect(() => {
    initializeAuth(setAccessToken, setError, setLoading, setShowAuthWarning);
  }, []);

  // 載入系統設定
  useEffect(() => {
    if (accessToken) {
      loadSettings();
    }
  }, [accessToken]);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await settingsApi.getSettings();
      
      if (response.success) {
        setSettings(response.data);
        // 初始化設定值
        const initialValues: { [key: number]: string } = {};
        response.data.forEach(setting => {
          initialValues[setting.id] = setting.settingValue;
        });
        setSettingValues(initialValues);
      }
    } catch (error) {
      handleApiError(error, setError, setSettingsLoading, setShowAuthWarning);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingChange = (settingId: number, value: string) => {
    setSettingValues(prev => ({
      ...prev,
      [settingId]: value
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    try {
      const updateRequest: UpdateSettingsRequest = {
        settings: Object.entries(settingValues).map(([id, value]) => ({
          id: parseInt(id),
          settingValue: value
        }))
      };

      const response = await settingsApi.updateSettings(updateRequest);
      
      if (response.success) {
        setSettings(response.data);
        setHasChanges(false);
        alert('設定更新成功！');
      }
    } catch (error) {
      handleApiError(error, setError, setSaveLoading);
    } finally {
      setSaveLoading(false);
    }
  };

  const resetChanges = () => {
    const originalValues: { [key: number]: string } = {};
    settings.forEach(setting => {
      originalValues[setting.id] = setting.settingValue;
    });
    setSettingValues(originalValues);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">點數系統設定</h1>
        <p className="mt-2 text-sm text-gray-600">
          調整點數系統的各項參數和規則
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

      {/* 變更提示 */}
      {hasChanges && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">設定已變更</h3>
              <div className="mt-2 text-sm text-blue-700">
                您有未儲存的變更，請記得點擊「儲存變更」按鈕。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 設定表單 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">系統參數設定</h3>

          {settingsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {setting.description}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        設定鍵: {setting.settingKey}
                      </p>
                      
                      {setting.settingType === 'boolean' ? (
                        <select
                          value={settingValues[setting.id] || setting.settingValue}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="true">啟用</option>
                          <option value="false">停用</option>
                        </select>
                      ) : setting.settingType === 'number' ? (
                        <input
                          type="number"
                          value={settingValues[setting.id] || setting.settingValue}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={settingValues[setting.id] || setting.settingValue}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          setting.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {setting.isActive ? '啟用' : '停用'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={resetChanges}
              disabled={!hasChanges || saveLoading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              重置變更
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={!hasChanges || saveLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saveLoading ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>
      </div>

      {/* 設定說明 */}
      <div className="bg-gray-50 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">設定說明</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong>點數系統開關:</strong> 控制整個點數系統是否啟用
            </div>
            <div>
              <strong>購買回饋比例:</strong> 用戶購買商品時獲得點數的百分比（如：10 表示 10%）
            </div>
            <div>
              <strong>虛擬點數卡功能:</strong> 是否允許用戶購買虛擬點數卡
            </div>
            <div>
              <strong>點數使用功能:</strong> 是否允許用戶使用點數抵扣
            </div>
            <div>
              <strong>最低獲得點數金額:</strong> 購買金額需達到此數值才能獲得點數
            </div>
            <div>
              <strong>單筆最高使用點數:</strong> 單次訂單最多可使用的點數數量
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client'

import React, { useState, useEffect } from 'react';
import Script from 'next/script';

interface LiffDebugInfo {
  scriptLoaded: boolean;
  liffAvailable: boolean;
  liffVersion: string;
  liffId: string;
  isInitialized: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  profile: any;
  errors: string[];
}

export default function LiffDebugPage() {
  const [debugInfo, setDebugInfo] = useState<LiffDebugInfo>({
    scriptLoaded: false,
    liffAvailable: false,
    liffVersion: '',
    liffId: '',
    isInitialized: false,
    isLoggedIn: false,
    isInClient: false,
    profile: null,
    errors: []
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  // 更新偵錯資訊
  const updateDebugInfo = (updates: Partial<LiffDebugInfo>) => {
    setDebugInfo(prev => ({ ...prev, ...updates }));
  };

  // 添加錯誤訊息
  const addError = (error: string) => {
    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, `${new Date().toLocaleTimeString()}: ${error}`]
    }));
  };

  // 檢查環境變數
  const checkEnvironmentVariables = () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || process.env.NEXT_PUBLIC_LINE_LIFF_ID || '';
    updateDebugInfo({ liffId });
    
    if (!liffId) {
      addError('LIFF ID 未設定在環境變數中');
      return false;
    }
    return true;
  };

  // 檢查 LIFF 腳本載入
  const handleScriptLoad = () => {
    updateDebugInfo({ scriptLoaded: true });
    
    if (typeof window !== 'undefined' && window.liff) {
      updateDebugInfo({ 
        liffAvailable: true,
        liffVersion: window.liff.getVersion ? window.liff.getVersion() : '無法獲取版本'
      });
    } else {
      addError('LIFF 腳本載入但 window.liff 不可用');
    }
  };

  // 初始化 LIFF
  const initializeLiff = async () => {
    if (!checkEnvironmentVariables()) return;
    
    setIsInitializing(true);
    
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID || process.env.NEXT_PUBLIC_LINE_LIFF_ID || '';
      
      if (!window.liff) {
        addError('window.liff 不存在，請確保腳本已載入');
        return;
      }

      await window.liff.init({
        liffId: liffId,
        withLoginOnExternalBrowser: true
      });

      const isLoggedIn = window.liff.isLoggedIn();
      const isInClient = window.liff.isInClient();
      
      updateDebugInfo({
        isInitialized: true,
        isLoggedIn,
        isInClient
      });

      if (isLoggedIn) {
        const profile = await window.liff.getProfile();
        updateDebugInfo({ profile });
      }

    } catch (error: any) {
      addError(`LIFF 初始化失敗: ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // 發送測試訊息
  const sendTestMessage = async () => {
    if (!window.liff || !debugInfo.isInitialized) {
      addError('LIFF 未初始化');
      return;
    }

    if (!debugInfo.isLoggedIn) {
      addError('用戶未登入');
      return;
    }

    if (!debugInfo.isInClient) {
      addError('不在 LINE 應用程式中');
      return;
    }

    try {
      const message = testMessage || '這是一個測試訊息';
      await window.liff.sendMessages([{
        type: 'text',
        text: message
      }]);
      addError('測試訊息發送成功');
    } catch (error: any) {
      addError(`發送測試訊息失敗: ${error.message}`);
    }
  };

  // 清除錯誤訊息
  const clearErrors = () => {
    updateDebugInfo({ errors: [] });
  };

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="beforeInteractive"
        onLoad={handleScriptLoad}
        onError={() => addError('LIFF 腳本載入失敗')}
      />
      
      <h1 className="text-3xl font-bold mb-6">LIFF 偵錯工具</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 狀態面板 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">LIFF 狀態</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>腳本載入:</span>
              <span className={debugInfo.scriptLoaded ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.scriptLoaded ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>LIFF 可用:</span>
              <span className={debugInfo.liffAvailable ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.liffAvailable ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>LIFF 版本:</span>
              <span>{debugInfo.liffVersion || '未知'}</span>
            </div>
            
            <div className="flex justify-between">
              <span>LIFF ID:</span>
              <span className="text-sm">{debugInfo.liffId || '未設定'}</span>
            </div>
            
            <div className="flex justify-between">
              <span>已初始化:</span>
              <span className={debugInfo.isInitialized ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.isInitialized ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>已登入:</span>
              <span className={debugInfo.isLoggedIn ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.isLoggedIn ? '✓' : '✗'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>在 LINE 中:</span>
              <span className={debugInfo.isInClient ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.isInClient ? '✓' : '✗'}
              </span>
            </div>
          </div>
          
          {debugInfo.profile && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">用戶資料:</h3>
              <div className="text-sm space-y-1">
                <div>名稱: {debugInfo.profile.displayName}</div>
                <div>ID: {debugInfo.profile.userId}</div>
                {debugInfo.profile.email && <div>Email: {debugInfo.profile.email}</div>}
              </div>
            </div>
          )}
        </div>
        
        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">控制面板</h2>
          
          <div className="space-y-4">
            <button
              onClick={initializeLiff}
              disabled={isInitializing || !debugInfo.scriptLoaded}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isInitializing ? '初始化中...' : '初始化 LIFF'}
            </button>
            
            <div className="space-y-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="測試訊息內容"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <button
                onClick={sendTestMessage}
                disabled={!debugInfo.isInitialized || !debugInfo.isLoggedIn}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                發送測試訊息
              </button>
            </div>
            
            <button
              onClick={clearErrors}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              清除錯誤記錄
            </button>
          </div>
        </div>
      </div>
      
      {/* 錯誤記錄 */}
      {debugInfo.errors.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">錯誤記錄</h2>
          <div className="bg-gray-50 rounded p-4 max-h-60 overflow-y-auto">
            {debugInfo.errors.map((error, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 使用說明 */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">使用說明</h2>
        <div className="text-sm space-y-2">
          <p>1. 確保已設定環境變數 NEXT_PUBLIC_LIFF_ID</p>
          <p>2. 點擊「初始化 LIFF」按鈕</p>
          <p>3. 如果在 LINE 應用程式中，可以嘗試發送測試訊息</p>
          <p>4. 檢查錯誤記錄以診斷問題</p>
        </div>
      </div>
    </div>
  );
} 
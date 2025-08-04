'use client';

import React, { useState } from 'react';
import { salespersonApi } from '@/app/staff-sales/services/apiService';

export default function TestApi() {
  const [lineId, setLineId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFindEmployee = async () => {
    if (!lineId) return;
    
    setLoading(true);
    try {
      const response = await salespersonApi.findEmployeeByLineId(lineId);
      setResult({ type: 'find', data: response });
    } catch (error) {
      setResult({ type: 'find', error: error });
    } finally {
      setLoading(false);
    }
  };

  const testCreateEmployee = async () => {
    if (!lineId || !employeeId) return;
    
    setLoading(true);
    try {
      const response = await salespersonApi.createEmployeeRecord(lineId, employeeId);
      setResult({ type: 'create', data: response });
    } catch (error) {
      setResult({ type: 'create', error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">API 測試</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">LINE ID</label>
          <input
            type="text"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="輸入 LINE ID"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">員工編號</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="輸入員工編號"
          />
        </div>
        
        <div className="space-y-2">
          <button
            onClick={testFindEmployee}
            disabled={!lineId || loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md disabled:bg-gray-300"
          >
            {loading ? '測試中...' : '測試查找員工'}
          </button>
          
          <button
            onClick={testCreateEmployee}
            disabled={!lineId || !employeeId || loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md disabled:bg-gray-300"
          >
            {loading ? '測試中...' : '測試創建員工'}
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-medium mb-2">
              {result.type === 'find' ? '查找結果' : '創建結果'}
            </h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 
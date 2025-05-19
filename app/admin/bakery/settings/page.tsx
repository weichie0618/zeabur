'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

// 定義設定結構
interface BusinessHours {
  openTime: string;
  closeTime: string;
}

interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  taxRate: number;
  deliveryFee: number;
  minOrderForFreeDelivery: number;
  isStoreOpen: boolean;
  businessHours: BusinessHours;
  logo: string;
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '幸福烘焙坊',
    storePhone: '02-1234-5678',
    storeEmail: 'info@bakery.example.com',
    storeAddress: '台北市中山區烘焙路123號',
    taxRate: 5,
    deliveryFee: 120,
    minOrderForFreeDelivery: 1000,
    isStoreOpen: true,
    businessHours: {
      openTime: '09:00',
      closeTime: '18:00',
    },
    logo: '/images/logo.png',
    currency: 'TWD',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setSettings({
        ...settings,
        [name]: checkbox.checked,
      });
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'businessHours') {
        setSettings({
          ...settings,
          businessHours: {
            ...settings.businessHours,
            [child]: value,
          },
        });
      }
    } else {
      setSettings({
        ...settings,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 這裡應該有API請求保存設定
      // 模擬API請求延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('設定已成功儲存！');
    } catch (error) {
      toast.error('儲存設定時發生錯誤');
      console.error('儲存設定錯誤：', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">系統設定</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">基本資訊</h2>
              
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                  店鋪名稱
                </label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="storePhone" className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡電話
                </label>
                <input
                  type="text"
                  id="storePhone"
                  name="storePhone"
                  value={settings.storePhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  電子郵件
                </label>
                <input
                  type="email"
                  id="storeEmail"
                  name="storeEmail"
                  value={settings.storeEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  店鋪地址
                </label>
                <input
                  type="text"
                  id="storeAddress"
                  name="storeAddress"
                  value={settings.storeAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">營業設定</h2>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isStoreOpen"
                  name="isStoreOpen"
                  checked={settings.isStoreOpen}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="isStoreOpen" className="ml-2 block text-sm text-gray-700">
                  目前開放營業
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessHours.openTime" className="block text-sm font-medium text-gray-700 mb-1">
                    開始營業時間
                  </label>
                  <input
                    type="time"
                    id="businessHours.openTime"
                    name="businessHours.openTime"
                    value={settings.businessHours.openTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="businessHours.closeTime" className="block text-sm font-medium text-gray-700 mb-1">
                    結束營業時間
                  </label>
                  <input
                    type="time"
                    id="businessHours.closeTime"
                    name="businessHours.closeTime"
                    value={settings.businessHours.closeTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                  稅率 (%)
                </label>
                <input
                  type="number"
                  id="taxRate"
                  name="taxRate"
                  value={settings.taxRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700 mb-1">
                  運費 (NT$)
                </label>
                <input
                  type="number"
                  id="deliveryFee"
                  name="deliveryFee"
                  value={settings.deliveryFee}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label htmlFor="minOrderForFreeDelivery" className="block text-sm font-medium text-gray-700 mb-1">
                  免運費訂單金額 (NT$)
                </label>
                <input
                  type="number"
                  id="minOrderForFreeDelivery"
                  name="minOrderForFreeDelivery"
                  value={settings.minOrderForFreeDelivery}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 mr-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {loading ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
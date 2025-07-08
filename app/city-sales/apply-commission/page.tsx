'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  BuildingStorefrontIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FormData {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessType: string;
  expectedSales: string;
  experience: string;
  notes: string;
}

export default function ApplyCommissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    businessType: '',
    expectedSales: '',
    experience: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 這裡可以發送申請資料到後端
      // 暫時模擬提交過程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 可以發送到後端 API 或 Email 服務
      console.log('申請資料:', formData);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('提交失敗:', error);
      alert('提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/city-sales/login');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            申請已提交
          </h1>
          
          <div className="text-gray-600 mb-8 space-y-3">
            <p>
              您的分潤計畫申請已成功提交！
            </p>
            <p className="text-sm">
              我們將於 3-5 個工作天內審核您的申請，並透過電子郵件通知您審核結果。
            </p>
          </div>

          <button
            onClick={handleBackToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>返回登入</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            申請分潤計畫
          </h1>
          <p className="text-gray-600">
            填寫以下資訊以申請成為我們的合作夥伴
          </p>
        </div>

        {/* 申請表單 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 公司資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                公司資訊
              </h3>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  公司名稱 *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="請輸入公司名稱"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                  業務類型 *
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">請選擇業務類型</option>
                  <option value="retail">零售業</option>
                  <option value="wholesale">批發業</option>
                  <option value="restaurant">餐飲業</option>
                  <option value="ecommerce">電商</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>

            {/* 聯絡資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                聯絡資訊
              </h3>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                  聯絡人姓名 *
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  required
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="請輸入聯絡人姓名"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    聯絡電話 *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="09XX-XXX-XXX"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    電子郵件 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>

            {/* 業務資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                業務資訊
              </h3>

              <div>
                <label htmlFor="expectedSales" className="block text-sm font-medium text-gray-700 mb-2">
                  預估月銷售額
                </label>
                <select
                  id="expectedSales"
                  name="expectedSales"
                  value={formData.expectedSales}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">請選擇預估月銷售額</option>
                  <option value="under-100k">10萬以下</option>
                  <option value="100k-500k">10萬 - 50萬</option>
                  <option value="500k-1m">50萬 - 100萬</option>
                  <option value="over-1m">100萬以上</option>
                </select>
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  相關經驗
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  rows={3}
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="請簡述您在相關領域的經驗..."
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  其他備註
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="如有其他需要說明的事項，請在此填寫..."
                />
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>返回</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5" />
                    <span>提交申請</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 說明文字 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            申請提交後，我們將於 3-5 個工作天內完成審核
          </p>
          <p>
            如有任何問題，請聯絡客服：support@example.com
          </p>
        </div>
      </div>
    </div>
  );
} 
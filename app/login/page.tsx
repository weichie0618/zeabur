'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setCookie } from 'cookies-next';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 簡化的身份驗證邏輯 (實際應用中應透過API進行驗證)
    if (!email) {
      setError('請輸入電子郵件');
      setLoading(false);
      return;
    }

    // 模擬身份驗證過程
    setTimeout(() => {
      // 設置cookie並根據角色重定向
      setCookie('user_email', email, { maxAge: 60 * 60 * 24 }); // 24小時有效

      // 根據電子郵件判斷角色和重定向地址
      if (email === 'admin@example.com') {
        router.push('/admin/bakery');
      } else if (email.startsWith('sales')) {
        router.push('/sales/dashboard');
      } else {
        setError('帳號不存在或密碼錯誤');
      }
      setLoading(false);
    }, 500); // 添加模擬延遲以顯示載入效果
  };

  const handleAdminLogin = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
    setCookie('user_email', 'admin@example.com', { maxAge: 60 * 60 * 24 });
    router.push('/admin/bakery');
  };

  const handleSalesLogin = () => {
    setEmail('sales1@example.com');
    setPassword('sales123');
    setCookie('user_email', 'sales1@example.com', { maxAge: 60 * 60 * 24 });
    router.push('/sales/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">登入您的帳戶</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            使用預設帳號進行登入，或輸入您的帳號資訊
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">電子郵件</label>
              <input 
                id="email-address" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                value={email}
                onChange={handleEmailChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm" 
                placeholder="電子郵件地址" 
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">密碼</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                value={password}
                onChange={handlePasswordChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm" 
                placeholder="密碼" 
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" 
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                記住我
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-amber-600 hover:text-amber-500">
                忘記密碼?
              </a>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              disabled={loading}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-amber-500 group-hover:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              {loading ? '登入中...' : '使用帳號登入'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>或使用以下預設帳號快速登入</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSalesLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-amber-500 group-hover:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </span>
            業務人員登入 (王小明)
          </button>
          
          <button
            onClick={handleAdminLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-green-500 group-hover:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </span>
            管理員登入
          </button>
        </div>

        {/* 角色說明 */}
        <div className="mt-8 space-y-4 text-sm text-gray-500">
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">帳號說明</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 text-xs font-bold">S</span>
                  </div>
                </div>
                <p className="ml-2">
                  <strong className="text-gray-700">業務人員帳號：</strong> sales1@example.com (王小明) 或 sales2@example.com (李小華)
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">A</span>
                  </div>
                </div>
                <p className="ml-2">
                  <strong className="text-gray-700">管理員帳號：</strong> admin@example.com
                </p>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <p>* 此為示範系統，密碼可輸入任意值</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
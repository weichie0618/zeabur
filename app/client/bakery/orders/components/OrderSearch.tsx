'use client';

import React, { useState, useEffect } from 'react';

interface OrderSearchProps {
  onSearch: (email: string, phone: string) => void;
  loading: boolean;
  initialEmail?: string;
  initialPhone?: string;
}

const OrderSearch: React.FC<OrderSearchProps> = ({ 
  onSearch, 
  loading, 
  initialEmail = '', 
  initialPhone = '' 
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);

  // 當初始值變化時更新狀態
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialPhone) setPhone(initialPhone);
  }, [initialEmail, initialPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(email.trim(), phone.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 mb-1">電子郵件</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="example@email.com"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="phone" className="block text-gray-700 mb-1">電話號碼</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="09XXXXXXXX"
        />
      </div>
      
      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:bg-amber-400"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              查詢中...
            </>
          ) : (
            '查詢訂單'
          )}
        </button>
      </div>
    </form>
  );
};

export default OrderSearch; 
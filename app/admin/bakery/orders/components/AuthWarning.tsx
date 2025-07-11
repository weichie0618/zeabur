'use client';
/**
 * 認證警告組件
 * 🔑 安全改進：使用 HttpOnly Cookie 認證
 */
import React from 'react';
import { handleRelogin } from '../../utils/authService';

interface AuthWarningProps {
  showWarning: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * 認證警告組件，當用戶認證過期或無效時顯示
 */
const AuthWarning: React.FC<AuthWarningProps> = ({ 
  showWarning, 
  onClose,
  message = '未獲取到認證令牌，請重新登入'
}) => {
  if (!showWarning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 border-b border-red-200 text-red-700 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{message}</span>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={onClose} 
          className="text-red-700 hover:text-red-900"
        >
          關閉
        </button>
        <button 
          onClick={() => handleRelogin()}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          重新登入
        </button>
      </div>
    </div>
  );
};

export default AuthWarning; 
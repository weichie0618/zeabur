'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * 分頁組件，用於訂單列表的分頁導航
 */
const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  // 計算當前頁面顯示的項目範圍
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="px-6 py-4 bg-white border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          顯示 <span className="font-medium">{startItem}</span> 到 
          <span className="font-medium">{endItem}</span> 項，
          共 <span className="font-medium">{totalItems}</span> 項
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            上一頁
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            // 只顯示前後 2 頁和當前頁
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageNum
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            
            // 顯示省略號
            if (
              (pageNum === currentPage - 3 && pageNum > 1) ||
              (pageNum === currentPage + 3 && pageNum < totalPages)
            ) {
              return <span key={pageNum} className="px-1">...</span>;
            }
            
            return null;
          })}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination; 
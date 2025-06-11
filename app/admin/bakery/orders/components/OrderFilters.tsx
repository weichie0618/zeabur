'use client';

import React, { useState, useEffect } from 'react';
import { dateFilterOptions } from '../constants';

interface Customer {
  id: string;
  companyName: string;
}

interface OrderFiltersProps {
  onFilter: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  companyNameFilter: string;
  setCompanyNameFilter: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  customers: Customer[];
  showCustomDateRange: boolean;
}

/**
 * 訂單過濾器組件，用於搜索和過濾訂單列表
 */
const OrderFilters: React.FC<OrderFiltersProps> = ({
  onFilter,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  companyNameFilter,
  setCompanyNameFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  customers,
  showCustomDateRange
}) => {
  // 處理搜尋框變更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 處理狀態篩選變更
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // 處理日期篩選變更
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(e.target.value);
  };

  // 處理公司名稱篩選變更
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyNameFilter(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">搜尋訂單</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              placeholder="訂單編號/客戶名稱/電話/郵件"
              className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">訂單狀態</label>
          <select
            id="status"
            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">所有狀態</option>
            <option value="待處理">待處理</option>
            <option value="處理中">處理中</option>
            <option value="已出貨">已出貨</option>
            <option value="已送達">已送達</option>
            <option value="已取消">已取消</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">客戶公司</label>
          <select
            id="companyName"
            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            value={companyNameFilter}
            onChange={handleCompanyNameChange}
          >
            <option value="">所有公司</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.companyName}>
                {customer.companyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">訂單日期</label>
          <select
            id="date"
            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
            value={dateFilter}
            onChange={handleDateChange}
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
      </div>
      
      {/* 自定義日期範圍選擇器 */}
      {showCustomDateRange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
            <input
              type="date"
              id="startDate"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">結束日期</label>
            <input
              type="date"
              id="endDate"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate} // 確保結束日期不早於開始日期
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <button 
          className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={onFilter}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          套用篩選
        </button>
      </div>
    </div>
  );
};

export default OrderFilters; 
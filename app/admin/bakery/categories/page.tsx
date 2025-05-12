'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 定義分類類型
interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CategoriesManagement() {
  // 狀態變數
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  // 篩選相關狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // 編輯/新增相關狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<{
    id?: number;
    name: string;
    parent_id: string;
    status: string;
  }>({
    name: '',
    parent_id: '',
    status: 'active'
  });
  
  // 刪除相關狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 獲取分類列表 - 只負責初始加載所有分類
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 不再添加篩選參數，只獲取所有數據
      const timestamp = Date.now();
      const apiUrl = `/api/categories?t=${timestamp}`;
      console.log('發送請求到:', apiUrl);
      
      // 發送GET請求
      const response = await fetch(apiUrl);
      console.log('獲得回應狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API錯誤響應:', errorText);
        throw new Error(`無法獲取分類資料: ${response.status} ${errorText}`);
      }
      
      // 解析API回應
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('JSON解析錯誤:', parseError);
        throw new Error('無法解析API回應');
      }
      
      let allCategories: Category[] = [];
      // 處理響應
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          // 直接返回的數組格式
          allCategories = data;
        } else if (data.data && Array.isArray(data.data)) {
          // 分頁格式
          allCategories = data.data;
        }
      }
      
      // 保存所有分類到狀態
      setCategories(allCategories);
      
      // 初始應用本地篩選
      applyFiltersLocally(allCategories);
      
      console.log('獲取到的分類:', allCategories.length);
    } catch (err) {
      console.error('獲取分類錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
      setCategories([]);
      setFilteredCategories([]);
      setMeta(prev => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };
  
  // 本地應用篩選條件
  const applyFiltersLocally = (categoriesToFilter = categories, pageNum = 1) => {
    try {
      // 套用篩選條件
      let filtered = [...categoriesToFilter];
      
      // 應用名稱搜索
      if (searchQuery) {
        filtered = filtered.filter(category => 
          category.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // 應用狀態篩選
      if (selectedStatus) {
        filtered = filtered.filter(category => category.status === selectedStatus);
      }
      
      // 應用父分類篩選
      if (selectedParentCategory) {
        if (selectedParentCategory === 'null') {
          filtered = filtered.filter(category => category.parent_id === null);
        } else {
          const parentId = parseInt(selectedParentCategory);
          filtered = filtered.filter(category => category.parent_id === parentId);
        }
      }
      
      // 保存篩選後的結果
      setFilteredCategories(filtered);
      
      // 計算分頁
      const total = filtered.length;
      const totalPages = Math.ceil(total / meta.limit);
      
      // 應用分頁 - 確保頁碼有效
      const validPage = Math.max(1, Math.min(pageNum, totalPages || 1));
      
      // 更新分頁元數據
      setMeta({
        total,
        page: validPage,
        limit: meta.limit,
        totalPages: totalPages || 1
      });
    } catch (error) {
      console.error('本地篩選錯誤:', error);
    }
  };
  
  // 初始加載
  useEffect(() => {
    fetchCategories();
  }, []); // 只在組件掛載時獲取數據
  
  // 分頁變更時本地篩選
  useEffect(() => {
    applyFiltersLocally(categories, meta.page);
  }, [meta.page, meta.limit]);
  
  // 頁面切換處理
  const handlePageChange = (page: number) => {
    setMeta(prev => ({ ...prev, page }));
  };
  
  // 篩選處理 - 現在使用本地篩選
  const handleApplyFilters = () => {
    applyFiltersLocally(categories, 1); // 重置到第一頁
  };
  
  // 重置篩選
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedParentCategory('');
    setSelectedStatus('');
    // 使用延遲執行，確保狀態已更新
    setTimeout(() => {
      applyFiltersLocally(categories, 1);
    }, 0);
  };
  
  // 新增分類
  const handleAddCategory = () => {
    setModalType('add');
    setFormData({
      name: '',
      parent_id: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };
  
  // 編輯分類
  const handleEditCategory = (category: Category) => {
    setModalType('edit');
    setFormData({
      id: category.id,
      name: category.name,
      parent_id: category.parent_id === null ? '' : category.parent_id.toString(),
      status: category.status
    });
    setIsModalOpen(true);
  };
  
  // 表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 準備請求數據
      const requestData = {
        name: formData.name,
        parent_id: formData.parent_id === '' ? null : parseInt(formData.parent_id),
        level: formData.parent_id === '' ? 1 : 2, // 根據是否有父分類設置層級
        status: formData.status
      };
      
      // 決定URL和方法
      const method = modalType === 'add' ? 'POST' : 'PUT';
      const url = modalType === 'add' 
        ? '/api/categories' 
        : `/api/categories/${formData.id}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || '操作失敗');
      }
      
      // 關閉模態框並重新獲取數據
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('提交表單錯誤:', error);
      alert('操作失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // 刪除分類
  const handleDeleteClick = (categoryId: number) => {
    setDeletingCategoryId(categoryId);
    setDeleteError(null);
    setDeleteSuccess(null);
    setShowDeleteConfirm(true);
  };
  
  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingCategoryId(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };
  
  // 確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingCategoryId) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      const response = await fetch(`/api/categories/${deletingCategoryId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || '刪除失敗');
      }
      
      setDeleteSuccess('分類刪除成功');
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setDeletingCategoryId(null);
        fetchCategories();
      }, 1000);
    } catch (error) {
      console.error('刪除分類錯誤:', error);
      setDeleteError(error instanceof Error ? error.message : '刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 狀態樣式處理
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };
  
  // 狀態翻譯
  const translateStatus = (status: string) => {
    switch (status) {
      case 'active':
        return '啟用';
      case 'inactive':
        return '停用';
      default:
        return status;
    }
  };
  
  // 獲取父分類名稱
  const getParentCategoryName = (parentId: number | null) => {
    if (parentId === null) return '無';
    
    const parentCategory = categories.find(c => c.id === parentId);
    return parentCategory ? parentCategory.name : `分類 ID: ${parentId}`;
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">分類管理</h1>
        <button
          onClick={handleAddCategory}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md flex items-center text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增分類
        </button>
      </div>
      
      {/* 篩選區塊 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">篩選條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">搜尋關鍵字</label>
            <input
              type="text"
              id="search"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              placeholder="分類名稱"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1">父分類</label>
            <select
              id="parent"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={selectedParentCategory}
              onChange={(e) => setSelectedParentCategory(e.target.value)}
            >
              <option value="">全部</option>
              <option value="null">無父分類 (一級分類)</option>
              {categories
                .filter(cat => cat.level === 1)
                .map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))
              }
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
            <select
              id="status"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">全部</option>
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-3">
          <button 
            onClick={handleResetFilters}
            className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重置篩選
          </button>
          <button 
            onClick={handleApplyFilters}
            className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            套用篩選
          </button>
        </div>
      </div>
      
      {/* 顯示錯誤訊息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">發生錯誤</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* 分類列表 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名稱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  層級
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  父分類
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建立日期
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      加載中...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    沒有找到符合條件的分類
                  </td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.level === 1 ? '一級分類' : '二級分類'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getParentCategoryName(category.parent_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(category.status)}`}>
                        {translateStatus(category.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分頁控制 */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              顯示第 <span className="font-medium">{meta.page}</span> 頁，共 <span className="font-medium">{meta.totalPages}</span> 頁，
              總計 <span className="font-medium">{meta.total}</span> 筆資料
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
                disabled={meta.page <= 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md 
                  ${meta.page <= 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
              >
                上一頁
              </button>
              <button
                onClick={() => handlePageChange(Math.min(meta.totalPages, meta.page + 1))}
                disabled={meta.page >= meta.totalPages}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md 
                  ${meta.page >= meta.totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 新增/編輯分類模態框 */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景覆蓋層 */}
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={() => setIsModalOpen(false)} // 點擊背景關閉模態框
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* 模態框內容 - 增加更高的 z-index 和相對定位 */}
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[60]"
              onClick={(e) => e.stopPropagation()} // 防止點擊冒泡
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {modalType === 'add' ? '新增分類' : '編輯分類'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          分類名稱<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                          父分類
                        </label>
                        <select
                          name="parent_id"
                          id="parent_id"
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={formData.parent_id}
                          onChange={handleInputChange}
                        >
                          <option value="">無 (一級分類)</option>
                          {categories
                            .filter(cat => cat.level === 1 && (!formData.id || cat.id !== formData.id))
                            .map(category => (
                              <option key={category.id} value={category.id.toString()}>
                                {category.name}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          狀態
                        </label>
                        <select
                          name="status"
                          id="status"
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">啟用</option>
                          <option value="inactive">停用</option>
                        </select>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {modalType === 'add' ? '新增' : '更新'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 刪除確認模態框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景覆蓋層 */}
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCancelDelete}  // 點擊背景關閉模態框
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* 模態框內容 - 增加更高的 z-index 和相對定位 */}
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[60]"
              onClick={(e) => e.stopPropagation()} // 防止點擊冒泡
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      確認刪除分類
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        您確定要刪除這個分類嗎？此操作無法撤銷。
                      </p>
                      {deleteError && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {deleteError}
                        </div>
                      )}
                      {deleteSuccess && (
                        <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                          {deleteSuccess}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button"
                  disabled={isDeleting || deleteSuccess !== null}
                  onClick={handleConfirmDelete}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    isDeleting ? 'bg-red-300' : deleteSuccess ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700'
                  } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      刪除中...
                    </>
                  ) : deleteSuccess ? '已刪除' : '刪除'}
                </button>
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={handleCancelDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
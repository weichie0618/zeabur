'use client';
import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import Link from 'next/link';
import { 
  initializeAuth, 
  handleAuthError,
  handleRelogin,
  setupAuthWarningAutoHide,
  apiGet,
  apiPut
} from '../../utils/authService';

// 定義分類類型
interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  status: string;
  sort?: number;
  created_at: string;
  updated_at: string;
}

// 可拖拽的分類項目組件
function SortableItem({ category }: { category: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
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
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-white mb-2 p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md cursor-move"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">{category.name}</p>
            <div className="flex mt-1 items-center text-sm text-gray-500 space-x-3">
              <span>ID: {category.id}</span>
              <span>•</span>
              <span>{category.level === 1 ? '一級分類' : '二級分類'}</span>
              <span>•</span>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(category.status)}`}>
                {translateStatus(category.status)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {category.sort ? `排序: ${category.sort}` : '未設定排序'}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesSortPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 初始化認證
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 處理認證錯誤
  const handleAuthErrorLocal = (errorMessage: string) => {
    handleAuthError(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleReloginLocal = () => {
    handleRelogin();
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 🔑 已移除：不再需要getAuthHeadersLocal，使用HttpOnly Cookie認證
  
  // 獲取分類資料
  const fetchCategories = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const timestamp = Date.now();
      // 🔑 安全改進：使用 HttpOnly Cookie 認證
      const data = await apiGet(`/api/categories?t=${timestamp}&sortBy=id&order=ASC`);
      
      // 處理回應
      let allCategories: Category[] = [];
      if (Array.isArray(data)) {
        allCategories = data;
      } else if (data.data && Array.isArray(data.data)) {
        allCategories = data.data;
      }
      
      // 對分類進行初始排序，優先使用sort字段，如果沒有則使用id
      allCategories.sort((a, b) => {
        if (a.sort !== undefined && b.sort !== undefined) {
          return a.sort - b.sort;
        } else if (a.sort !== undefined) {
          return -1;
        } else if (b.sort !== undefined) {
          return 1;
        }
        return a.id - b.id;
      });
      
      setCategories(allCategories);
      setIsDirty(false);
    } catch (err) {
      console.error('獲取分類錯誤:', err);
      setError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setLoading(false);
    }
  };
  
  // 頁面加載時獲取分類
  useEffect(() => {
    if (accessToken) {
      fetchCategories();
    }
  }, [accessToken]);
  
  // 處理拖拽結束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // 創建一個新的分類數組
      const filteredCategories = selectedParentId 
        ? categories.filter(cat => 
            selectedParentId === 'null' 
              ? cat.parent_id === null 
              : cat.parent_id === parseInt(selectedParentId)
          )
        : categories;
      
      // 先按目前的排序值排序
      const sortedCategories = [...filteredCategories].sort((a, b) => {
        if (a.sort !== undefined && b.sort !== undefined) {
          return a.sort - b.sort;
        } else if (a.sort !== undefined) {
          return -1;
        } else if (b.sort !== undefined) {
          return 1;
        }
        return a.id - b.id;
      });
      
      const oldIndex = sortedCategories.findIndex(cat => cat.id === active.id);
      const newIndex = sortedCategories.findIndex(cat => cat.id === over.id);
      
      // 取得被移動的項目
      const movedItem = sortedCategories[oldIndex];
      
      // 判斷移動方向
      const movingDown = oldIndex < newIndex;
      
      // 計算新的排序值
      let newSortValue: number;
      
      if (newIndex === 0) {
        // 移動到最前面
        newSortValue = (sortedCategories[0].sort || 10) - 5;
      } else if (newIndex === sortedCategories.length - 1) {
        // 移動到最後面
        newSortValue = (sortedCategories[sortedCategories.length - 1].sort || 0) + 10;
      } else {
        // 移動到中間位置
        const prevItem = sortedCategories[movingDown ? newIndex : newIndex - 1];
        const nextItem = sortedCategories[movingDown ? newIndex + 1 : newIndex];
        
        const prevSort = prevItem.sort || 0;
        const nextSort = nextItem.sort || (prevSort + 20);
        
        // 計算中間值
        newSortValue = Math.floor((prevSort + nextSort) / 2);
        
        // 如果新的排序值與相鄰值相同，需要重新調整所有項目的排序值
        if (newSortValue === prevSort || newSortValue === nextSort) {
          // 重新分配所有排序值
          const updatedSortedCategories = [...sortedCategories];
          // 先移除原項目
          updatedSortedCategories.splice(oldIndex, 1);
          // 插入到新位置
          updatedSortedCategories.splice(newIndex > oldIndex ? newIndex - 1 : newIndex, 0, movedItem);
          
          // 重新分配排序值，間隔為10
          const updatedFilteredCategories = updatedSortedCategories.map((cat, index) => ({
            ...cat,
            sort: (index + 1) * 10
          }));
          
          // 更新總的分類列表
          const updatedCategories = categories.map(category => {
            const updatedCategory = updatedFilteredCategories.find(c => c.id === category.id);
            return updatedCategory || category;
          });
          
          setCategories(updatedCategories);
          setIsDirty(true);
          return;
        }
      }
      
      // 更新被移動項目的排序值
      const updatedCategories = categories.map(category => {
        if (category.id === movedItem.id) {
          return { ...category, sort: newSortValue };
        }
        return category;
      });
      
      setCategories(updatedCategories);
      setIsDirty(true);
    }
  };
  
  // 保存排序變更
  const saveChanges = async () => {
    if (!accessToken) {
      setSaveError('未獲取到認證令牌，請重新登入');
      return;
    }
    
    try {
      setSaveLoading(true);
      setSaveError(null);
      setSaveSuccess(null);
      
      // 準備排序數據
      const sortData = categories.map(cat => ({
        id: cat.id,
        sort: cat.sort || 0
      }));
      
      // 🔑 安全改進：使用 HttpOnly Cookie 認證保存排序
      const data = await apiPut('/api/categories/sort', { sortData });
      
      setSaveSuccess(true);
      setIsDirty(false);
      // 5秒後自動清除成功提示
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('保存排序錯誤:', err);
      setSaveError(err instanceof Error ? err.message : '發生錯誤');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 過濾顯示的分類
  const filteredCategories = selectedParentId
    ? categories.filter(cat => 
        selectedParentId === 'null' 
          ? cat.parent_id === null 
          : cat.parent_id === parseInt(selectedParentId)
      )
    : categories;
    
  // 確保分類按照排序值顯示
  const sortedFilteredCategories = [...filteredCategories].sort((a, b) => {
    // 如果都有排序值，按排序值排序
    if (a.sort !== undefined && b.sort !== undefined) {
      return a.sort - b.sort;
    }
    // 如果只有a有排序值，a排在前面
    else if (a.sort !== undefined) {
      return -1;
    }
    // 如果只有b有排序值，b排在前面
    else if (b.sort !== undefined) {
      return 1;
    }
    // 如果都沒有排序值，按ID排序
    return a.id - b.id;
  });
  
  // 獲取可作為父分類的分類列表（一級分類）
  const parentCategories = categories.filter(cat => cat.level === 1);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頂部認證警告條 */}
      {showAuthWarning && error && error.includes('認證') && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 border-b border-red-200 text-red-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>未獲取到認證令牌，請重新登入</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAuthWarning(false)} 
              className="text-red-700 hover:text-red-900"
            >
              關閉
            </button>
            <button 
              onClick={handleReloginLocal}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              重新登入
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">分類排序</h1>
        <Link
          href="/admin/bakery/categories"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md inline-flex items-center text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          返回分類管理
        </Link>
      </div>
      
      {/* 提示訊息 */}
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p>排序更新成功！</p>
          </div>
        </div>
      )}
      
      {saveError && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{saveError}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold">發生錯誤</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 篩選控制 */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div>
          <label htmlFor="parentFilter" className="block text-sm font-medium text-gray-700 mb-1">依父分類篩選</label>
          <div className="flex space-x-2">
            <select
              id="parentFilter"
              className="flex-grow rounded-md border border-gray-300 py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
            >
              <option value="">全部分類</option>
              <option value="null">一級分類</option>
              {parentCategories.map(category => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name} 的子分類
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 說明文字 */}
      <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4">
        <p className="text-amber-800">
          <span className="font-medium">使用指南：</span> 拖拽項目可調整分類排序順序。調整完成後，請點擊「保存排序」按鈕進行保存。
        </p>
      </div>
      
      {/* 排序區域 */}
      <div className="bg-gray-50 rounded-lg shadow-md p-6 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-lg text-gray-700">載入中...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>無可顯示的分類</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={sortedFilteredCategories.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedFilteredCategories.map(category => (
                  <SortableItem key={category.id} category={category} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={saveChanges}
          disabled={!isDirty || saveLoading}
          className={`${
            !isDirty 
              ? 'bg-gray-400 cursor-not-allowed' 
              : saveLoading 
                ? 'bg-amber-400 cursor-wait' 
                : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
          } text-white px-4 py-2 rounded-md flex items-center text-sm transition-colors`}
        >
          {saveLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              保存中...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              保存排序
            </>
          )}
        </button>
      </div>
    </div>
  );
} 
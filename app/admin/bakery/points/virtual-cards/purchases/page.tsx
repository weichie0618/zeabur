'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { virtualCardApi, handleApiError, formatPoints, formatCurrency, formatDisplayDate } from '../../api';
import { VirtualCardPurchase, VirtualCardPaymentStatus } from '../../types';
import { initializeAuth } from '../../../utils/authService';
import Link from 'next/link';

export default function VirtualCardPurchasesPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 購買記錄
  const [allPurchases, setAllPurchases] = useState<VirtualCardPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<VirtualCardPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState<boolean>(false);

  // 購買記錄詳情模態框
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [viewingPurchase, setViewingPurchase] = useState<VirtualCardPurchase | null>(null);

  // 分頁和篩選（用戶端）
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 計算分頁數據
  const totalItems = filteredPurchases.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex);

  // 操作載入狀態
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null);

  // 添加調試狀態
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 初始化認證
  useEffect(() => {
    console.log('開始初始化認證...');
    setDebugInfo('正在初始化認證...');
    
    try {
      initializeAuth(
        (token) => {
          console.log('認證成功，令牌長度:', token?.length || 0);
          setAccessToken(token);
          setDebugInfo(`認證成功，令牌長度: ${token?.length || 0}`);
        },
        (errorMsg) => {
          console.error('認證失敗:', errorMsg);
          setError(errorMsg);
          setDebugInfo(`認證失敗: ${errorMsg}`);
        },
        (loadingState) => {
          console.log('載入狀態:', loadingState);
          setLoading(loadingState);
          setDebugInfo(`載入狀態: ${loadingState}`);
        },
        setShowAuthWarning,
        false // 不自動重定向
      );
    } catch (err) {
      console.error('初始化認證時發生錯誤:', err);
      setError(`初始化認證時發生錯誤: ${err}`);
      setDebugInfo(`初始化認證時發生錯誤: ${err}`);
      setLoading(false);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    setDebugInfo(prev => prev + ' | 正在載入購買記錄...');
    
    try {
      console.log('正在調用購買記錄 API...');
      
      // 載入所有記錄，用於用戶端篩選
      const params = {
        page: 1,
        limit: 1000, // 載入大量記錄
      };

      const response = await virtualCardApi.getPurchases(params);
      
      console.log('購買記錄 API 響應:', response);
      setDebugInfo(prev => prev + ' | 購買記錄API響應已接收');

      if (response.success) {
        setAllPurchases(response.data || []);
        setDebugInfo(prev => prev + ` | 載入了 ${response.data?.length || 0} 筆購買記錄`);
        
        // 通知 layout 更新待處理記錄數量
        window.dispatchEvent(new CustomEvent('purchaseStatusUpdated'));
      } else {
        setError('載入購買記錄失敗');
        setDebugInfo(prev => prev + ' | 購買記錄載入失敗');
      }
    } catch (error) {
      console.error('載入購買記錄失敗:', error);
      setDebugInfo(prev => prev + ` | 購買記錄API錯誤: ${error}`);
      handleApiError(error, setError, setPurchasesLoading, setShowAuthWarning);
    } finally {
      setPurchasesLoading(false);
      setLoading(false);
      setDebugInfo(prev => prev + ' | 購買記錄載入完成');
    }
  }, []);

  // 載入數據
  useEffect(() => {
    if (accessToken) {
      console.log('開始載入購買記錄...');
      setDebugInfo(prev => prev + ' | 開始載入購買記錄...');
      loadPurchases();
    }
  }, [accessToken, loadPurchases]);

  // 用戶端篩選邏輯
  useEffect(() => {
    let filtered = [...allPurchases];

    // 狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.paymentStatus === statusFilter);
    }

    // 搜尋篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(purchase => 
        purchase.lineUser?.displayName?.toLowerCase().includes(query) ||
        purchase.lineUser?.name?.toLowerCase().includes(query) ||
        purchase.lineUserId.toString().includes(query) ||
        purchase.virtualCardProduct?.name?.toLowerCase().includes(query) ||
        purchase.id.toString().includes(query)
      );
    }

    setFilteredPurchases(filtered);
    setCurrentPage(1); // 重置到第一頁
  }, [allPurchases, statusFilter, searchQuery]);

  // 查看購買記錄詳情
  const handleViewPurchase = (purchase: VirtualCardPurchase) => {
    setViewingPurchase(purchase);
    setShowPurchaseModal(true);
  };

  // 更新支付狀態
  const handleUpdatePaymentStatus = async (purchase: VirtualCardPurchase, newStatus: VirtualCardPaymentStatus) => {
    if (purchase.paymentStatus === newStatus) return;

    const confirmMessage = newStatus === VirtualCardPaymentStatus.PAID 
      ? `確定要將購買記錄 #${purchase.id} 標記為已付款嗎？\n這將會自動給予用戶 ${purchase.pointsRedeemed} 點數。`
      : `確定要將購買記錄 #${purchase.id} 的狀態改為 ${newStatus === VirtualCardPaymentStatus.FAILED ? '失敗' : '取消'} 嗎？`;
    
    if (!confirm(confirmMessage)) return;

    setUpdatingPayment(purchase.id);
    
    try {
      const response = await virtualCardApi.updatePaymentStatus(purchase.id, {
        paymentStatus: newStatus,
        adminNote: `管理員手動更新狀態為 ${newStatus}`
      });
      
      if (response.success) {
        await loadPurchases(); // 重新載入購買記錄
        setError(''); // 清除錯誤
        
        // 通知 layout 更新待處理記錄數量
        window.dispatchEvent(new CustomEvent('purchaseStatusUpdated'));
        
        if (newStatus === VirtualCardPaymentStatus.PAID) {
          alert(`✅ 支付狀態已更新！用戶將獲得 ${purchase.pointsRedeemed} 點數。`);
        } else {
          alert(`✅ 支付狀態已更新為 ${newStatus === VirtualCardPaymentStatus.FAILED ? '失敗' : '取消'}。`);
        }
      } else {
        setError('更新支付狀態失敗');
      }
    } catch (error) {
      console.error('更新支付狀態失敗:', error);
      handleApiError(error, setError, () => {}, setShowAuthWarning);
    } finally {
      setUpdatingPayment(null);
    }
  };

  // 處理搜尋
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 篩選會透過 useEffect 自動觸發，不需要額外操作
  };

  // 重置篩選
  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    // setCurrentPage(1) 會在篩選 useEffect 中自動觸發
  };

  // 如果還在載入中，顯示載入狀態和調試信息
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 mb-2">正在載入虛擬卡購買記錄...</p>
        <div className="text-sm text-gray-500 max-w-2xl text-center">
          <strong>調試信息:</strong>
          <br />
          {debugInfo}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">載入錯誤</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4 text-xs text-gray-600">
              <strong>調試信息:</strong>
              <br />
              {debugInfo}
            </div>
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和導航 */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">虛擬卡購買記錄</h1>
            <p className="mt-2 text-sm text-gray-600">
              管理和審核虛擬點數卡購買記錄
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/bakery/points/virtual-cards"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回產品管理
            </Link>
          </div>
        </div>
      </div>

      {/* 認證警告 */}
      {showAuthWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">認證警告</h3>
              <div className="mt-2 text-sm text-yellow-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 篩選和搜尋 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜尋表單 */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜尋用戶名稱或ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  搜尋
                </button>
              </div>
            </form>
            
            {/* 狀態篩選 */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">所有狀態</option>
                <option value="pending">處理中</option>
                <option value="paid">已完成</option>
                <option value="failed">失敗</option>
                <option value="cancelled">取消</option>
              </select>
              
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                重置篩選
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 購買記錄表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">購買記錄</h3>
            <div className="text-sm text-gray-500">
              第 {currentPage} 頁，共 {totalPages} 頁 (總共 {totalItems} 筆記錄)
            </div>
          </div>

          {purchasesLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      購買ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      產品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支付金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      獲得點數
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      購買時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPurchases && currentPurchases.length > 0 ? currentPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{purchase.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.lineUser?.displayName || purchase.lineUser?.name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {purchase.lineUserId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.virtualCardProduct?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(purchase.purchasePrice || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatPoints(purchase.pointsRedeemed || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                          purchase.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {purchase.paymentStatus === 'paid' ? '已完成' :
                           purchase.paymentStatus === 'pending' ? '處理中' : '失敗'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDisplayDate(purchase.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPurchase(purchase)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            檢視
                          </button>
                          {purchase.paymentStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdatePaymentStatus(purchase, VirtualCardPaymentStatus.PAID)}
                                disabled={updatingPayment === purchase.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {updatingPayment === purchase.id ? '處理中...' : '標記為已付款'}
                              </button>
                              <button
                                onClick={() => handleUpdatePaymentStatus(purchase, VirtualCardPaymentStatus.FAILED)}
                                disabled={updatingPayment === purchase.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {updatingPayment === purchase.id ? '處理中...' : '標記為失敗'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        {purchasesLoading ? '載入中...' : 
                         allPurchases.length === 0 ? '暫無購買記錄' : 
                         '無符合篩選條件的記錄'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                顯示 {startIndex + 1}-{endIndex} 筆，共 {totalItems} 筆記錄 (第 {currentPage} 頁，共 {totalPages} 頁)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                
                {/* 頁碼按鈕 */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === pageNum
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 購買記錄詳情模態框 */}
      {showPurchaseModal && viewingPurchase && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowPurchaseModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              {/* 模態框標題 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">購買記錄詳情</h3>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 購買記錄信息 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">購買ID</label>
                    <div className="mt-1 text-sm text-gray-900">#{viewingPurchase.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">用戶</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {viewingPurchase.lineUser?.displayName || viewingPurchase.lineUser?.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LINE用戶ID</label>
                    <div className="mt-1 text-sm text-gray-900 font-mono text-xs">
                      {viewingPurchase.lineUserId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {viewingPurchase.virtualCardProduct?.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">支付金額</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatCurrency(viewingPurchase.purchasePrice || 0)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">獲得點數</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatPoints(viewingPurchase.pointsRedeemed || 0)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">支付狀態</label>
                    <div className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingPurchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                        viewingPurchase.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingPurchase.paymentStatus === 'paid' ? '已完成' :
                         viewingPurchase.paymentStatus === 'pending' ? '處理中' : '失敗'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">購買時間</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDisplayDate(viewingPurchase.createdAt)}
                    </div>
                  </div>
                  {viewingPurchase.paymentStatus === 'paid' && viewingPurchase.updatedAt !== viewingPurchase.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">完成時間</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {formatDisplayDate(viewingPurchase.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
                
                {viewingPurchase.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">備註</label>
                    <div className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                      {viewingPurchase.notes}
                    </div>
                  </div>
                )}

                {(viewingPurchase as any).adminNote && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">管理員備註</label>
                    <div className="mt-1 text-sm text-gray-900 p-3 bg-blue-50 rounded-md">
                      {(viewingPurchase as any).adminNote}
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="mt-6 flex justify-end space-x-2">
                {viewingPurchase.paymentStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdatePaymentStatus(viewingPurchase, VirtualCardPaymentStatus.PAID)}
                      disabled={updatingPayment === viewingPurchase.id}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingPayment === viewingPurchase.id ? '處理中...' : '標記為已付款'}
                    </button>
                    <button
                      onClick={() => handleUpdatePaymentStatus(viewingPurchase, VirtualCardPaymentStatus.FAILED)}
                      disabled={updatingPayment === viewingPurchase.id}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {updatingPayment === viewingPurchase.id ? '處理中...' : '標記為失敗'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 調試信息 (僅在開發環境顯示) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <strong>調試信息:</strong>
          <br />
          {debugInfo}
        </div>
      )}
    </div>
  );
} 
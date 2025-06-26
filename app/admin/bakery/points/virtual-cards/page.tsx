'use client';

import React, { useState, useEffect } from 'react';
import { virtualCardApi, handleApiError, formatPoints, formatCurrency, formatDisplayDate } from '../api';
import { VirtualCardProduct } from '../types';
import { initializeAuth } from '../../utils/authService';
import Link from 'next/link';

export default function VirtualCardsPage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);
  
  // 虛擬卡產品
  const [cardProducts, setCardProducts] = useState<VirtualCardProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);

  // 新增產品表單
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    pointsValue: '',
    description: ''
  });

  // 編輯產品表單
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<VirtualCardProduct | null>(null);
  const [editProduct, setEditProduct] = useState({
    name: '',
    price: '',
    pointsValue: '',
    description: '',
    displayOrder: ''
  });

  // 檢視產品詳情
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewingProduct, setViewingProduct] = useState<VirtualCardProduct | null>(null);

  // 操作載入狀態
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [updatingProduct, setUpdatingProduct] = useState<number | null>(null);

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

  // 載入數據
  useEffect(() => {
    if (accessToken) {
      console.log('開始載入虛擬卡數據...');
      setDebugInfo(prev => prev + ' | 開始載入虛擬卡數據...');
      loadCardProducts();
    }
  }, [accessToken]);

  const loadCardProducts = async () => {
    setProductsLoading(true);
    setDebugInfo(prev => prev + ' | 正在載入產品數據...');
    
    try {
      console.log('正在調用虛擬卡產品 API...');
      
      const response = await virtualCardApi.getProducts(true); // 包含停用商品
      
      console.log('虛擬卡產品 API 響應:', response);
      setDebugInfo(prev => prev + ' | 產品API響應已接收');

      if (response.success) {
        setCardProducts(response.data || []);
        setDebugInfo(prev => prev + ` | 載入了 ${response.data?.length || 0} 個產品`);
      } else {
        setError('載入虛擬卡產品失敗');
        setDebugInfo(prev => prev + ' | 產品載入失敗');
      }
    } catch (error) {
      console.error('載入虛擬卡產品失敗:', error);
      setDebugInfo(prev => prev + ` | 產品API錯誤: ${error}`);
      handleApiError(error, setError, setProductsLoading, setShowAuthWarning);
    } finally {
      setProductsLoading(false);
      setLoading(false);
      setDebugInfo(prev => prev + ' | 產品載入完成');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        pointsValue: parseInt(newProduct.pointsValue),
        description: newProduct.description
      };

      const response = await virtualCardApi.createProduct(productData);
      
      if (response.success) {
        setShowAddForm(false);
        setNewProduct({ name: '', price: '', pointsValue: '', description: '' });
        loadCardProducts(); // 重新載入產品列表
      } else {
        setError('創建產品失敗');
      }
    } catch (error) {
      handleApiError(error, setError, () => {}, setShowAuthWarning);
    }
  };

  // 開啟編輯表單
  const handleEditProduct = (product: VirtualCardProduct) => {
    setEditingProduct(product);
    setEditProduct({
      name: product.name || '',
      price: product.price?.toString() || '',
      pointsValue: product.pointsValue?.toString() || '',
      description: product.description || '',
      displayOrder: product.displayOrder?.toString() || ''
    });
    setShowEditForm(true);
  };

  // 更新產品
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    setUpdatingProduct(editingProduct.id);
    
    try {
      const productData = {
        name: editProduct.name,
        price: parseFloat(editProduct.price),
        pointsValue: parseInt(editProduct.pointsValue),
        description: editProduct.description,
        displayOrder: editProduct.displayOrder ? parseInt(editProduct.displayOrder) : undefined
      };

      const response = await virtualCardApi.updateProduct(editingProduct.id, productData);
      
      if (response.success) {
        setShowEditForm(false);
        setEditingProduct(null);
        loadCardProducts(); // 重新載入產品列表
      } else {
        setError('更新產品失敗');
      }
    } catch (error) {
      handleApiError(error, setError, () => {}, setShowAuthWarning);
    } finally {
      setUpdatingProduct(null);
    }
  };

  // 切換產品狀態（上下架）
  const handleToggleProductStatus = async (product: VirtualCardProduct) => {
    setUpdatingStatus(product.id);
    
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      const response = await virtualCardApi.updateProductStatus(product.id, newStatus);
      
      if (response.success) {
        loadCardProducts(); // 重新載入產品列表
      } else {
        setError('更新商品狀態失敗');
      }
    } catch (error) {
      handleApiError(error, setError, () => {}, setShowAuthWarning);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // 查看產品詳情
  const handleViewProduct = (product: VirtualCardProduct) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  // 如果還在載入中，顯示載入狀態和調試信息
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 mb-2">正在載入虛擬點數卡管理...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">虛擬點數卡管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              管理虛擬點數卡產品設定
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/bakery/points/virtual-cards/purchases"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              購買記錄管理
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新增產品
            </button>
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

      {/* 虛擬卡產品管理 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">虛擬卡產品</h3>
          </div>

          {/* 新增產品表單 */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">新增虛擬卡產品</h4>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品名稱</label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">售價 (元)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">點數價值</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.pointsValue}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, pointsValue: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <input
                      type="text"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    創建產品
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 編輯產品表單 */}
          {showEditForm && editingProduct && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">編輯虛擬卡產品</h4>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品名稱</label>
                    <input
                      type="text"
                      required
                      value={editProduct.name}
                      onChange={(e) => setEditProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">售價 (元)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editProduct.price}
                      onChange={(e) => setEditProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">點數價值</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editProduct.pointsValue}
                      onChange={(e) => setEditProduct(prev => ({ ...prev, pointsValue: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">排序順序</label>
                    <input
                      type="number"
                      min="0"
                      value={editProduct.displayOrder}
                      onChange={(e) => setEditProduct(prev => ({ ...prev, displayOrder: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <textarea
                      rows={3}
                      value={editProduct.description}
                      onChange={(e) => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProduct === editingProduct.id}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingProduct === editingProduct.id ? '更新中...' : '更新產品'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {productsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      產品名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      售價
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      點數價值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      建立時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cardProducts && cardProducts.length > 0 ? cardProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                          {product.displayOrder && (
                            <div className="text-xs text-gray-400">排序: {product.displayOrder}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.price || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatPoints(product.pointsValue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'active' ? '啟用' : '停用'}
                          </span>
                          <button
                            onClick={() => handleToggleProductStatus(product)}
                            disabled={updatingStatus === product.id}
                            className={`text-xs px-2 py-1 rounded ${
                              product.status === 'active' 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50`}
                          >
                            {updatingStatus === product.id ? '處理中...' : (product.status === 'active' ? '下架' : '上架')}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDisplayDate(product.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            檢視
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            編輯
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        {productsLoading ? '載入中...' : '暫無產品'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 檢視產品詳情模態框 */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowViewModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              {/* 模態框標題 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">虛擬點數卡詳情</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 產品信息 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品ID</label>
                    <div className="mt-1 text-sm text-gray-900">#{viewingProduct.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品名稱</label>
                    <div className="mt-1 text-sm text-gray-900">{viewingProduct.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">售價</label>
                    <div className="mt-1 text-sm text-gray-900">{formatCurrency(viewingProduct.price || 0)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">點數價值</label>
                    <div className="mt-1 text-sm font-medium text-green-600">{formatPoints(viewingProduct.pointsValue || 0)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">狀態</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingProduct.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingProduct.status === 'active' ? '啟用' : '停用'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">排序順序</label>
                    <div className="mt-1 text-sm text-gray-900">{viewingProduct.displayOrder || '未設定'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">建立時間</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDisplayDate(viewingProduct.createdAt)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">更新時間</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDisplayDate(viewingProduct.updatedAt)}</div>
                  </div>
                </div>
                
                {viewingProduct.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品描述</label>
                    <div className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                      {viewingProduct.description}
                    </div>
                  </div>
                )}

                {viewingProduct.imageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">產品圖片</label>
                    <div className="mt-1">
                      <img 
                        src={viewingProduct.imageUrl} 
                        alt={viewingProduct.name}
                        className="max-w-xs rounded-lg shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditProduct(viewingProduct);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  編輯產品
                </button>
                <button
                  onClick={() => handleToggleProductStatus(viewingProduct)}
                  disabled={updatingStatus === viewingProduct.id}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    viewingProduct.status === 'active' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {updatingStatus === viewingProduct.id ? '處理中...' : (viewingProduct.status === 'active' ? '下架產品' : '上架產品')}
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
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
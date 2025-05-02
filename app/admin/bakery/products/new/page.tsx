import React from 'react';
import Link from 'next/link';

export default function NewProduct() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">新增產品</h1>
        <Link
          href="/admin/bakery/products"
          className="inline-flex items-center text-sm text-gray-600 hover:text-amber-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回產品列表
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">產品資訊</h2>
          <p className="mt-1 text-sm text-gray-500">請填寫以下表單來新增產品</p>
        </div>

        <div className="p-6">
          <form>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* 基本資訊區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">基本資訊</h3>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">
                  產品名稱<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-name"
                    placeholder="輸入產品名稱"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-category" className="block text-sm font-medium text-gray-700">
                  產品分類<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="product-category"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">選擇分類</option>
                    <option value="麵包">麵包</option>
                    <option value="蛋糕">蛋糕</option>
                    <option value="餅乾">餅乾</option>
                    <option value="甜點">甜點</option>
                    <option value="飲料">飲料</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">
                  產品描述
                </label>
                <div className="mt-1">
                  <textarea
                    id="product-description"
                    rows={4}
                    placeholder="輸入產品描述"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500">簡單描述這個產品的特點和賣點</p>
              </div>

              {/* 價格與庫存區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4 pt-4 border-t border-gray-100">價格與庫存</h3>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-price" className="block text-sm font-medium text-gray-700">
                  售價<span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="product-price"
                    placeholder="0.00"
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-original-price" className="block text-sm font-medium text-gray-700">
                  原價
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="product-original-price"
                    placeholder="0.00"
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">若有折扣，請填寫原價</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700">
                  庫存數量<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="product-stock"
                    placeholder="0"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700">
                  產品編號
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-sku"
                    placeholder="例：BKY-001"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-min-stock" className="block text-sm font-medium text-gray-700">
                  最低安全庫存
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="product-min-stock"
                    placeholder="0"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">庫存低於此數量時發出警告</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-status" className="block text-sm font-medium text-gray-700">
                  產品狀態
                </label>
                <div className="mt-1">
                  <select
                    id="product-status"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="上架中">上架中</option>
                    <option value="下架中">下架中</option>
                    <option value="預售中">預售中</option>
                  </select>
                </div>
              </div>

              {/* 產品相關資訊區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4 pt-4 border-t border-gray-100">產品相關資訊</h3>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-ingredients" className="block text-sm font-medium text-gray-700">
                  成分
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-ingredients"
                    placeholder="例：麵粉、奶油、糖"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">請用逗號分隔各個成分</p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="product-allergens" className="block text-sm font-medium text-gray-700">
                  過敏原資訊
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-allergens"
                    placeholder="例：麩質、乳製品"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">請用逗號分隔各個過敏原</p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="product-storage" className="block text-sm font-medium text-gray-700">
                  保存方法
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="product-storage"
                    placeholder="例：冷藏保存，建議在3天內食用"
                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 產品圖片區塊 */}
              <div className="sm:col-span-6">
                <h3 className="text-md font-medium text-gray-900 mb-4 pt-4 border-t border-gray-100">產品圖片</h3>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">產品圖片</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none"
                      >
                        <span>上傳圖片</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">或拖放文件到此處</p>
                    </div>
                    <p className="text-xs text-gray-500">支援 PNG, JPG, GIF 格式，檔案大小不超過 2MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-5 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-amber-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                儲存產品
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
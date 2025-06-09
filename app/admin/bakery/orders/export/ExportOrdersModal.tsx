'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface ExportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    searchQuery: string;
    statusFilter: string;
    dateFilter: string;
    companyNameFilter: string;
    startDate: string;
    endDate: string;
  };
  fetchExportData: (exportAll: boolean) => Promise<any[]>;
}

// 訂單項目類型
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    specification?: string;
  };
}

export default function ExportOrdersModal({ 
  isOpen, 
  onClose, 
  filters, 
  fetchExportData 
}: ExportOrdersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportAll, setExportAll] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 格式化日期顯示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
  };

  // 獲取日期範圍的顯示文字
  const getDateRangeDisplay = () => {
    switch (filters.dateFilter) {
      case 'today':
        return '今天';
      case 'yesterday':
        return '昨天';
      case 'this_week':
        return '本週';
      case 'this_month':
        return '本月';
      case 'last_month':
        return '上個月';
      case 'custom':
        return `${formatDate(filters.startDate)} 至 ${formatDate(filters.endDate)}`;
      default:
        return '所有時間';
    }
  };

  // 當模態窗口打開或過濾條件變更時，加載預覽數據
  useEffect(() => {
    if (isOpen) {
      loadPreviewData();
    }
  }, [isOpen, exportAll]);

  // 加載預覽數據
  const loadPreviewData = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      
      const data = await fetchExportData(exportAll);
      
      if (!data || data.length === 0) {
        setPreviewError('沒有符合條件的數據');
        setOrders([]);
      } else {
        setOrders(data);
      }
    } catch (err: any) {
      setPreviewError(err.message || '載入預覽數據失敗');
      setOrders([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 處理匯出Excel
  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      // 使用已經加載的訂單數據，如果還沒加載則重新獲取
      let exportOrders = orders;
      if (exportOrders.length === 0) {
        exportOrders = await fetchExportData(exportAll);
      }
      
      if (!exportOrders || exportOrders.length === 0) {
        setError('沒有可匯出的數據');
        setLoading(false);
        return;
      }

      // 準備標準格式的匯出數據
      const exportData = exportOrders.map(order => {
        // 處理訂單項目，每個項目獨立一行
        const orderItems = order.orderItems || [];
        
        if (orderItems.length === 0) {
          // 如果沒有訂單項目，仍然返回一行主訂單數據
          return [createExportRow(order, null)];
        }
        
        // 為每個訂單項目創建一行
        return orderItems.map((item: OrderItem) => createExportRow(order, item));
      }).flat(); // 將嵌套數組展平

      // 創建工作表
      const worksheet = XLSX.utils.aoa_to_sheet([
        // 第一列：標題
        [
          '訂貨日期', '交貨日期', '客戶代號', '客戶名稱', '客戶全名', '統一編號', 
          '訂單單號/客戶單號', '訂貨部門', '部門名稱', '業務人員代號', '業務人員姓名', 
          '預收訂金', '訂貨人', '訂貨電話', '提貨人', '提貨電話', '送貨方式', 
          '提貨門市', '提貨門市名稱', '送貨地址', '發票地址', '配送方式', '幣別', 
          '匯率', '備註', '類別', '品號', '品名', '規格', '單位', '單位名稱', 
          '庫別', '庫別名稱', '數量', '單價', '折扣率', '明細備註'
        ],
        // 第二列：代碼
        [
          'ODMF003', 'ODMF092', 'ODMF004', 'CUST003', 'ODMF055', 'ODMF074', 
          'ODMF007', 'ODMF008', 'DEPT002', 'ODMF009', 'PA51004', 'ODMFA3FAMNT', 
          'ODMF005', 'ODMF080', 'ODMF079', 'ODMF081', 'ODMF096', 'ODMF102', 
          'ODMF102NAME', 'ODMF049', 'ODMF075', 'ODMF143', 'ODMF010', 'ODMFA01EXRA', 
          'ODMF054', 'ODDT005', 'ODDT004', 'ODDT043', 'ODDT044', 'ODDT009', 
          'UTMF002', 'ODDT010', 'STRG002', 'ODDTA01IQTY', 'ODDTA1FPRIC', 
          'ODDTA01IRAT', 'ODDT026'
        ],
        ...exportData
      ]);

      // 設置列寬
      const columnWidths = Array(37).fill({ wch: 15 }); // 設置所有37列的寬度為15
      worksheet['!cols'] = columnWidths;

      // 創建工作簿
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '訂單數據');

      // 生成文件名
      const now = new Date();
      const fileName = `訂單匯出_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`;

      // 下載文件
      XLSX.writeFile(workbook, fileName);
      
      setLoading(false);
      onClose();
    } catch (err: any) {
      setError(err.message || '匯出過程中發生錯誤');
      setLoading(false);
    }
  };

  // 創建匯出行數據
  const createExportRow = (order: any, item: OrderItem | null) => {
    const orderDate = new Date(order.created_at);
    const formatOrderDate = `${orderDate.getFullYear()}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getDate().toString().padStart(2, '0')}`;
    
    // 預計交貨日期（假設為訂單日期後7天）
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const formatDeliveryDate = `${deliveryDate.getFullYear()}/${(deliveryDate.getMonth() + 1).toString().padStart(2, '0')}/${deliveryDate.getDate().toString().padStart(2, '0')}`;
    
    // 建立基本行數據（訂單級別）
    return [
      formatOrderDate,                                      // 訂貨日期 ODMF003
      formatDeliveryDate,                                   // 交貨日期 ODMF092
        'WEB01',                                            // 客戶代號 ODMF004
      '',                                                    // 客戶名稱 CUST003
      '',                                                    // 客戶全名 ODMF055
      order.tax_id || '',                                          // 統一編號 ODMF074
      order.order_number || '',                                   // 訂單單號 ODMF007
      '',                                                   // 訂貨部門 ODMF008
      '',                                                   // 部門名稱 DEPT002
      '',                                                   // 業務人員代號 ODMF009
      '',                                                   // 業務人員姓名 PA51004
      '0',                                                  // 預收訂金 ODMFA3FAMNT
      order.customer_name || '',                            // 訂貨人 ODMF005
      order.customer_phone || '',                           // 訂貨電話 ODMF080
      order.address?.recipient_name || order.customer_name || '', // 提貨人 ODMF079
      order.address?.phone || order.customer_phone || '',   // 提貨電話 ODMF081
      '1',                                                  // 送貨方式 ODMF096
      '',                                                   // 提貨門市 ODMF102
      '',                                                   // 提貨門市名稱 ODMF102NAME
      order.address  ||  '',                // 送貨地址 ODMF049
       '',                                          // 發票地址 ODMF075
      '',                                                  // 配送方式 ODMF143
      '',                                                // 幣別 ODMF010
      '',                                                  // 匯率 ODMFA01EXRA
      order.salesperson?.id + '-' + order.notes || '',                                    // 備註 ODMF054
      item ? '' : '',                                       // 類別 ODDT005
      item ? item.product_id || '' : '',                    // 品號 ODDT004
      item ? item.product_name || '' : '',                  // 品名 ODDT043
      item && item.product ? item.product.specification || '' : '', // 規格 ODDT044
      item ? 'PCS' : '',                                    // 單位 ODDT009
      item ? '個' : '',                                     // 單位名稱 UTMF002
      '01',                                                // 庫別 ODDT010
      '總倉',                                               // 庫別名稱 STRG002
      item ? item.quantity || '0' : '0',                    // 數量 ODDTA01IQTY
      item ? item.price || '0' : '0',                       // 單價 ODDTA1FPRIC
      '0',                                                  // 折扣率 ODDTA01IRAT
      ''                                                    // 明細備註 ODDT026
    ];
  };

  // 獲取訂單狀態的中文顯示
  const getStatusDisplay = (status: string): string => {
    if (!status) return '未知';
    
    const statusMap: Record<string, string> = {
      'PENDING': '待處理',
      'PROCESSING': '處理中',
      'SHIPPED': '已出貨',
      'DELIVERED': '已送達',
      'CANCELLED': '已取消',
      'pending': '待處理',
      'processing': '處理中',
      'shipped': '已出貨',
      'delivered': '已送達',
      'cancelled': '已取消'
    };
    
    // 嘗試直接從映射中獲取
    const display = statusMap[status];
    if (display) return display;
    
    // 如果找不到，嘗試轉換為大寫再查找
    const uppercaseDisplay = statusMap[status.toUpperCase()];
    if (uppercaseDisplay) return uppercaseDisplay;
    
    // 如果仍找不到，返回原始狀態
    return status;
  };

  // 獲取訂單狀態的樣式類
  const getStatusClass = (status: string): string => {
    const upperStatus = status?.toUpperCase() || '';
    
    let styleClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
    
    switch (upperStatus) {
      case 'DELIVERED':
        return styleClass + 'bg-green-100 text-green-800';
      case 'PENDING':
        return styleClass + 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return styleClass + 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return styleClass + 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return styleClass + 'bg-red-100 text-red-800';
      default:
        return styleClass + 'bg-gray-100 text-gray-800';
    }
  };

  // 計算分頁
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // 分頁控制
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // 切換全螢幕模式
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${isFullScreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl max-h-[90vh] overflow-hidden'}`}>
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-900">匯出訂單數據</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullScreen}
              className="text-gray-500 hover:text-gray-700 p-1"
              title={isFullScreen ? "退出全螢幕" : "全螢幕顯示"}
            >
              {isFullScreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9H19.5M15 9V4.5M9 15v4.5M9 15H4.5M15 15h4.5M15 15v4.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className={`${isFullScreen ? 'h-[calc(100vh-136px)]' : 'max-h-[calc(90vh-136px)]'} overflow-auto`}>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h4 className="font-medium text-gray-700">當前篩選條件</h4>
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                {filters.searchQuery && (
                  <div className="flex items-center">
                    <span className="font-semibold w-24">搜尋關鍵字:</span>
                    <span>{filters.searchQuery}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <span className="font-semibold w-24">訂單狀態:</span>
                  <span>{filters.statusFilter || '所有狀態'}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-semibold w-24">客戶公司:</span>
                  <span>{filters.companyNameFilter || '所有公司'}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-semibold w-24">訂單日期:</span>
                  <span>{getDateRangeDisplay()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="exportAll"
                  checked={exportAll}
                  onChange={() => setExportAll(!exportAll)}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="exportAll" className="ml-2 text-sm text-gray-700">
                  匯出所有訂單 (忽略篩選條件)
                </label>
              </div>
              
              <button
                onClick={loadPreviewData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors flex items-center justify-center"
              >
                {previewLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    載入中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重新載入預覽
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* 錯誤訊息顯示 */}
          {(error || previewError) && (
            <div className="px-6 py-2">
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                {error || previewError}
              </div>
            </div>
          )}
          
          {/* 預覽數據表格 */}
          <div className="px-6 py-4">
            <h4 className="font-medium text-gray-700 mb-3">預覽數據 ({orders.length} 筆記錄)</h4>
            
            {previewLoading ? (
              <div className="text-center py-10">
                <svg className="animate-spin h-10 w-10 mx-auto text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-600">載入預覽數據中...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                沒有符合條件的訂單數據
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        訂單編號
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        客戶資訊
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        客戶公司
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日期
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        總金額
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-amber-600">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                          <div className="text-sm text-gray-500">{order.customer_phone}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.salesperson?.companyName || '-'}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleString('zh-TW')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          NT${typeof order.total_amount === 'number' ? order.total_amount.toLocaleString('zh-TW') : order.total_amount}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={getStatusClass(order.status)}>
                            {getStatusDisplay(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* 分頁控制 */}
            {orders.length > 0 && totalPages > 1 && (
              <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    顯示第 <span className="font-medium">{indexOfFirstItem + 1}</span> 到第 
                    <span className="font-medium">{Math.min(indexOfLastItem, orders.length)}</span> 筆，
                    共 <span className="font-medium">{orders.length}</span> 筆
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
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
                            onClick={() => paginate(pageNum)}
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
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      下一頁
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={loading || orders.length === 0}
            className={`px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm transition-colors flex items-center ${(loading || orders.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                處理中...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                匯出 Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 
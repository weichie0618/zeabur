'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { 
  statusMap, 
  reverseStatusMap, 
  initializeAuth, 
  getAuthHeaders as getAuthHeadersFromService,
  handleAuthError as handleAuthErrorFromService,
  handleRelogin as handleReloginFromService,
  getStatusDisplay as getStatusDisplayFromService,
  getStatusClass as getStatusClassFromService
} from '../utils/authService';

// 訂單類型
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: string;
  shipping_method: string;
  payment_method: string;
  payment_status: string;
  shipping_status: string;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  address: string;
  notes: string;
  carrier: string;
  taxId: string;
  created_at: string;
  updated_at: string;
  salesperson_id: number;
  salesperson: {
    id: number;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    location: string;
  };
  orderItems: OrderItem[];
}

// 訂單項目類型
interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number | string; // 支持字符串和數字格式
  subtotal: number | string; // 支持字符串和數字格式
  product_unit_code: string;
}

// 訂單響應類型
interface OrdersResponse {
  total: number;
  orders: Order[];
  message?: string;
}

// 客戶資料類型
interface Customer {
  id: number | string;
  name?: string;
  contactName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  customer?: {
    companyName?: string;
  };
}

// 公司信息類型
interface CompanyInfo {
  id: number | string;
  name: string;
  companyName: string;
}

// 客戶列表響應類型
interface CustomersResponse {
  customers: Customer[];
  total: number;
  message?: string;
}

// LineUsers API 響應類型
interface LineUsersResponse {
  status: string;
  message?: string;
  data: {
    lineUsers: Array<{
      id: number | string;
      name?: string;
      displayName?: string;
      customer?: {
        companyName?: string;
      };
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export default function OrderExportPage() {
  // 狀態
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('');
  const [salesPersons, setSalesPersons] = useState<Array<{id: number | string, name: string, companyName: string}>>([]);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 日期範圍
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);
  
  // 匯出模態框相關狀態
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [exportModalData, setExportModalData] = useState<Order[]>([]);

  // 監聽日期篩選變更，控制自定義日期範圍的顯示
  useEffect(() => {
    setShowCustomDateRange(dateFilter === 'custom');
    
    // 如果不是自定義日期範圍，重置日期
    if (dateFilter !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else {
      // 設置默認自定義日期範圍（如果為空）
      if (!startDate) {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      }
    }
  }, [dateFilter]);

  // 處理變更過濾條件
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(e.target.value);
  };
  
  const handleSalesPersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSalesPersonFilter(e.target.value);
  };

  // 獲取認證令牌
  const getAuthHeaders = () => {
    return getAuthHeadersFromService(accessToken);
  };
  
  // 初始化獲取認證令牌
  useEffect(() => {
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning,
      false
    );
  }, []);

  // 獲取銷售人員列表
  useEffect(() => {
    fetchSalesPersons();
  }, [accessToken]);

  const fetchSalesPersons = async () => {
    try {
      if (!accessToken) return;

      console.log('開始獲取客戶數據...');
      // 嘗試使用 admin/lineusers API
      const response = await fetch('/api/customers?limit=100&sortBy=companyName&order=ASC', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthError('客戶數據獲取失敗：認證失敗');
        return;
      }

      const data = await response.json();
      console.log('客戶數據 API 回應:', data);
      
      if (!response.ok) {
        console.error('API 請求失敗:', response.status, response.statusText);
        return;
      }
      
      // 檢查數據結構 - 適用於 lineusers API
      if (data && data.status === 'success' && data.data && data.data.lineUsers) {
        const lineUsers = data.data.lineUsers as Array<{
          id: number | string;
          name?: string;
          displayName?: string;
          customer?: {
            companyName?: string;
          };
        }>;
        
        console.log(`獲取到 ${lineUsers.length} 個客戶記錄`);
        
        // 過濾出具有公司名稱的客戶
        const customersWithCompany: CompanyInfo[] = lineUsers
          .filter(user => user.customer && user.customer.companyName)
          .map(user => ({
            id: user.id,
            name: user.name || user.displayName || '未知',
            companyName: user.customer?.companyName || '未知公司'
          }));
          
        // 去除重複的公司名稱
        const uniqueCompanies: CompanyInfo[] = Array.from(
          new Map(customersWithCompany.map(item => [item.companyName, item] as [string, CompanyInfo]))
        ).map(([_, customer]) => customer);
        
        console.log(`過濾後有 ${uniqueCompanies.length} 個不重複公司`);
        setSalesPersons(uniqueCompanies);
      } else if (data && Array.isArray(data.data)) {
        // 舊 API 格式 { data: [...customers] }
        const customers = data.data as Customer[];
        console.log(`獲取到 ${customers.length} 個客戶記錄`);
        
        // 過濾出有公司名稱的客戶
        const customersWithCompany: CompanyInfo[] = customers
          .filter(customer => customer.companyName && customer.companyName.trim() !== '')
          .map(customer => ({
            id: customer.id || '',
            name: customer.name || '未知',
            companyName: customer.companyName || '未知公司'
          }));
          
        // 去除重複的公司名稱
        const uniqueCompanies: CompanyInfo[] = Array.from(
          new Map(customersWithCompany.map(item => [item.companyName, item] as [string, CompanyInfo]))
        ).map(([_, customer]) => customer);
        
        console.log(`過濾後有 ${uniqueCompanies.length} 個不重複公司`);
        setSalesPersons(uniqueCompanies);
      } else if (data && Array.isArray(data.customers)) {
        // 另一種可能的格式 { customers: [...] }
        console.log(`獲取到 ${data.customers.length} 個客戶記錄`);
        
        const customersWithCompany: CompanyInfo[] = data.customers
          .filter((customer: Customer) => customer.companyName)
          .map((customer: Customer) => ({
            id: customer.id,
            name: customer.name || '未知',
            companyName: customer.companyName || '未知公司'
          }));
          
        // 去除重複的公司名稱
        const uniqueCompanies: CompanyInfo[] = Array.from(
          new Map(customersWithCompany.map(item => [item.companyName, item] as [string, CompanyInfo]))
        ).map(([_, customer]) => customer);
        
        setSalesPersons(uniqueCompanies);
      } else {
        console.error('獲取客戶數據失敗: 未知的數據格式', data);
        // 設置空數組以避免使用未定義的數據
        setSalesPersons([]);
      }
    } catch (error) {
      console.error('獲取客戶數據出錯:', error);
      // 設置空數組以避免使用未定義的數據
      setSalesPersons([]);
    }
  };

  // 處理過濾並獲取訂單
  const handleFilter = () => {
    fetchOrders();
  };

  // 獲取訂單數據
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!accessToken) {
        setShowAuthWarning(true);
        setLoading(false);
        return;
      }

      // 構建查詢參數
      const params = new URLSearchParams();
      
      // 添加可選過濾條件
      if (statusFilter) {
        params.append('status', reverseStatusMap[statusFilter] || statusFilter);
      }
      
      // 處理搜尋查詢
      if (searchQuery) {
        // 檢查是否為訂單號格式
        if (/^ORD\d+$/.test(searchQuery.trim())) {
          params.append('order_number', searchQuery.trim());
        } else if (searchQuery.includes('@')) {
          // 可能是電子郵件
          params.append('customer_email', searchQuery.trim());
        } else if (/^[0-9-]+$/.test(searchQuery.trim())) {
          // 可能是電話號碼
          params.append('customer_phone', searchQuery.trim());
        } else {
          // 視為客戶名稱或公司名稱
          params.append('companyName', searchQuery.trim());
        }
      }
      
      // 處理日期過濾
      if (dateFilter) {
        if (['today', 'yesterday', 'this_month', 'last_month'].includes(dateFilter)) {
          params.append('date_range', dateFilter);
        } else if (dateFilter === 'custom') {
          // 自定義日期範圍
          if (startDate) {
            params.append('startDate', startDate);
          }
          if (endDate) {
            params.append('endDate', endDate);
          }
        }
      }
      
      // 添加銷售人員過濾
      if (salesPersonFilter) {
        params.append('salespersonId', salesPersonFilter);
      }
      
      // 添加排序參數
      params.append('sortBy', 'created_at');
      params.append('sortOrder', 'desc');
      
      console.log(`訂單API請求: /api/orders/with-items?${params.toString()}`);
      
      // 發送請求獲取訂單數據
      const response = await fetch(`/api/orders/with-items?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('認證失敗，請重新登入系統');
        return;
      }
      
      const data: OrdersResponse = await response.json();
      
      if (response.ok && data.orders) {
        setOrders(data.orders);
        setTotalOrders(data.total);
      } else {
        setError(data.message || '獲取訂單數據失敗');
        setOrders([]);
      }
    } catch (error: any) {
      setError(error.message || '獲取訂單數據時發生錯誤');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 處理認證錯誤
  const handleAuthError = (errorMessage: string) => {
    handleAuthErrorFromService(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleRelogin = () => {
    handleReloginFromService();
  };

  // 處理打開匯出模態框
  const handleOpenExportModal = () => {
    setExportModalData(orders);
    setShowExportModal(true);
  };
  
  // 處理關閉匯出模態框
  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };
  
  // 選擇/取消選擇所有訂單
  const handleSelectAllOrders = () => {
    if (selectAll) {
      setSelectedOrders(new Set());
    } else {
      const allIds = new Set(orders.map(order => order.id));
      setSelectedOrders(allIds);
    }
    setSelectAll(!selectAll);
  };
  
  // 選擇/取消選擇單個訂單
  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
    
    // 更新全選狀態
    setSelectAll(newSelected.size === orders.length);
  };
  
  // 創建匯出行數據
  const createExportRow = (order: Order, item: OrderItem | null) => {
    const orderDate = new Date(order.created_at);
    const formatOrderDate = `${orderDate.getFullYear()}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getDate().toString().padStart(2, '0')}`;
    
    // 預計交貨日期（假設為訂單日期後7天）
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const formatDeliveryDate = `${deliveryDate.getFullYear()}/${(deliveryDate.getMonth() + 1).toString().padStart(2, '0')}/${deliveryDate.getDate().toString().padStart(2, '0')}`;
    
    // 建立基本行數據（訂單級別）
    const baseRow = [
      formatOrderDate,                                      // 訂貨日期 ODMF003
      formatDeliveryDate,                                   // 交貨日期 ODMF092
      'WEB01',                                              // 客戶代號 ODMF004
      '',                 // 客戶名稱 CUST003
      '',                 // 客戶全名 ODMF055
      order.taxId || '',                                    // 統一編號 ODMF074
      order.order_number || '',                             // 訂單單號 ODMF007
      'AE01',                                                   // 訂貨部門 ODMF008
      '',                                                   // 部門名稱 DEPT002
      '',                // 業務人員代號 ODMF009
      '',                        // 業務人員姓名 PA51004
      '0',                                                  // 預收訂金 ODMFA3FAMNT
      order.customer_name || '',                            // 訂貨人 ODMF005
      order.customer_phone || '',                           // 訂貨電話 ODMF080
      order.customer_name || '',                            // 提貨人 ODMF079
      order.customer_phone || '',                           // 提貨電話 ODMF081
      '1',                                                  // 送貨方式 ODMF096
      '',                                                   // 提貨門市 ODMF102
      '',                                                   // 提貨門市名稱 ODMF102NAME
      order.address || '',                                  // 送貨地址 ODMF049
      order.address || '',                                  // 發票地址 ODMF075
      '1',                          // 配送方式 ODMF143
      'NTD',                                                // 幣別 ODMF010
      '1',                                                  // 匯率 ODMFA01EXRA
      "推薦者:" +order.salesperson?.companyName + (order.shipping_fee>0 ? "/ 運費:" + order.shipping_fee + "/ ": "/ ") + (order.shipping_method==="pickup" ? "配送方式:"+order.address + "/ " : "配送方式:黑貓宅配/ ") + (order.carrier ? "載具:" + order.carrier +"/": order.taxId ? "統編:" + order.taxId +"/": "/"),                                    // 備註 ODMF054
      item ? '' : '',                                       // 類別 ODDT005
      item ? item.product_id.toString() || '' : '',         // 品號 ODDT004
      item ? item.product_name || '' : '',                  // 品名 ODDT043
      '',                                  // 規格 ODDT044
      item ? item.product_unit_code: '',                                    // 單位 ODDT009
      '',                                     // 單位名稱 UTMF002
      '01',                                                 // 庫別 ODDT010
      '總倉',                                               // 庫別名稱 STRG002
      item ? item.quantity.toString() || '0' : '0',         // 數量 ODDTA01IQTY
      item ? (typeof item.price === 'string' ? item.price : item.price.toString()) || '0' : '0',            // 單價 ODDTA1FPRIC
      '',                                                  // 折扣率 ODDTA01IRAT
      ''                                                    // 明細備註 ODDT026
    ];
    
    // 如果有運費，添加運費行
    if (order.shipping_fee > 0 && !item) {
      const shippingFeeRow = [
        formatOrderDate,                                      // 訂貨日期 ODMF003
        formatDeliveryDate,                                   // 交貨日期 ODMF092
        'WEB01',                                              // 客戶代號 ODMF004
        '',                 // 客戶名稱 CUST003
        '',                 // 客戶全名 ODMF055
        order.taxId || '',                                    // 統一編號 ODMF074
        order.order_number || '',                             // 訂單單號 ODMF007
        'AE01',                                                   // 訂貨部門 ODMF008
        '',                                                   // 部門名稱 DEPT002
        '',                // 業務人員代號 ODMF009
        '',                        // 業務人員姓名 PA51004
        '0',                                                  // 預收訂金 ODMFA3FAMNT
        order.customer_name || '',                            // 訂貨人 ODMF005
        order.customer_phone || '',                           // 訂貨電話 ODMF080
        order.customer_name || '',                            // 提貨人 ODMF079
        order.customer_phone || '',                           // 提貨電話 ODMF081
        '1',                                                  // 送貨方式 ODMF096
        '',                                                   // 提貨門市 ODMF102
        '',                                                   // 提貨門市名稱 ODMF102NAME
        order.address || '',                                  // 送貨地址 ODMF049
        order.address || '',                                  // 發票地址 ODMF075
        '1',                          // 配送方式 ODMF143
        'NTD',                                                // 幣別 ODMF010
        '1',                                                  // 匯率 ODMFA01EXRA
        "推薦者:" +order.salesperson?.companyName + (order.shipping_fee>0 ? "/ 運費:" + order.shipping_fee + "/ ": "/ ") + (order.shipping_method==="pickup" ? "配送方式:"+order.address + "/ " : "配送方式:黑貓宅配/ ") + (order.carrier ? "載具:" + order.carrier +"/": order.taxId ? "統編:" + order.taxId +"/": "/"),                                    // 備註 ODMF054
        '',                                       // 類別 ODDT005
        '902002',         // 品號 ODDT004
        '運費',                  // 品名 ODDT043
        '',                                  // 規格 ODDT044
        '',                                    // 單位 ODDT009
        '',                                     // 單位名稱 UTMF002
        '01',                                                 // 庫別 ODDT010
        '總倉',                                               // 庫別名稱 STRG002
        '1',         // 數量 ODDTA01IQTY
        order.shipping_fee.toString(),            // 單價 ODDTA1FPRIC
        '',                                                  // 折扣率 ODDTA01IRAT
        ''                                                    // 明細備註 ODDT026
      ];
      
      return [baseRow, shippingFeeRow];
    }
    
    return [baseRow];
  };

  // 匯出選中的訂單
  const handleExportSelected = async () => {
    try {
      setExportLoading(true);
      
      if (selectedOrders.size === 0) {
        alert('請至少選擇一個訂單進行匯出');
        setExportLoading(false);
        return;
      }
      
      // 過濾出選中的訂單
      const ordersToExport = orders.filter(order => selectedOrders.has(order.id));
      
      // 準備匯出數據
      const exportData = ordersToExport.map(order => {
        // 處理訂單項目，每個項目獨立一行
        const orderItems = order.orderItems || [];
        
        if (orderItems.length === 0) {
          // 如果沒有訂單項目，返回主訂單數據（可能包含運費行）
          return createExportRow(order, null);
        }
        
        // 為每個訂單項目創建一行，並在最後一個項目後添加運費行（如果有）
        const itemRows = orderItems.map((item: OrderItem, index: number) => {
          // 只在處理最後一個項目時檢查是否需要添加運費行
          if (index === orderItems.length - 1 && order.shipping_fee > 0) {
            const normalRow = createExportRow(order, item)[0]; // 獲取普通項目行
            const rows = [normalRow];
            // 手動創建運費行（類似於無項目情況下的運費行）
            const shippingFeeRow = createExportRow(order, null)[1]; // 獲取運費行
            if (shippingFeeRow) {
              rows.push(shippingFeeRow);
            }
            return rows;
          } else {
            return [createExportRow(order, item)[0]]; // 普通項目只返回一行
          }
        }).flat();
        
        return itemRows;
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
      
      setExportLoading(false);
      setShowExportModal(false);
    } catch (err: any) {
      alert(`匯出錯誤: ${err.message || '未知錯誤'}`);
      setExportLoading(false);
    }
  };

  // 獲取訂單狀態的中文顯示
  const getStatusDisplay = (status: string): string => {
    return getStatusDisplayFromService(status);
  };

  // 獲取狀態的CSS類名
  const getStatusClass = (status: string): string => {
    return getStatusClassFromService(status);
  };

  // 格式化日期顯示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
  };

  // 頁面初始載入時獲取訂單數據
  useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">訂單匯出</h1>
        <div className="flex space-x-2">
          <Link 
            href="/admin/bakery/orders" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            返回訂單管理
          </Link>
          <button
            onClick={handleOpenExportModal}
            disabled={exportLoading || orders.length === 0}
            className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
              exportLoading || orders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {exportLoading ? '匯出中...' : '預覽並匯出Excel'}
          </button>
        </div>
      </div>

      {showAuthWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>認證令牌缺失或已過期。請重新登入以繼續操作。</p>
          <button 
            onClick={handleRelogin}
            className="mt-2 text-blue-600 underline hover:text-blue-800"
          >
            點擊此處重新登入
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">訂單過濾條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              搜尋
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="訂單號/客戶名稱/電話/公司"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              訂單狀態
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">所有狀態</option>
              {Object.entries(statusMap).slice(0, 5).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              日期範圍
            </label>
            <select
              value={dateFilter}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">所有時間</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="this_month">本月</option>
              <option value="last_month">上個月</option>
              <option value="custom">自定義日期範圍</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              銷售人員
            </label>
            <select
              value={salesPersonFilter}
              onChange={handleSalesPersonChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">所有銷售人員</option>
              {salesPersons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} - {person.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showCustomDateRange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                開始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                結束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleFilter}
            disabled={loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '載入中...' : '套用過濾'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            訂單清單 {totalOrders > 0 ? `(共 ${totalOrders} 筆)` : ''}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <span>載入訂單數據中...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            沒有找到符合條件的訂單
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂單號
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客戶
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    公司
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    訂購日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    總金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    產品數量
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer_name}
                      <div className="text-xs text-gray-400">{order.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.salesperson?.companyName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-opacity-10 ${getStatusClass(
                          order.status
                        )} bg-${order.status.toLowerCase()}-100`}
                      >
                        {getStatusDisplay(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.orderItems?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 匯出預覽模態框 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900">預覽匯出訂單</h3>
              <button
                onClick={handleCloseExportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-[calc(90vh-136px)] overflow-auto">
              <div className="px-6 py-4">
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectAll}
                      onChange={handleSelectAllOrders}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                      全選 / 取消全選
                    </label>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600 mr-2">
                      已選擇 <span className="font-semibold">{selectedOrders.size}</span> 筆訂單
                    </span>
                    <button
                      onClick={handleExportSelected}
                      disabled={selectedOrders.size === 0 || exportLoading}
                      className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
                        selectedOrders.size === 0 || exportLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {exportLoading ? '匯出中...' : '匯出所選訂單'}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          選擇
                        </th>
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
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          項目數
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                            {order.order_number}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {order.salesperson?.companyName || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            NT${order.total_amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-opacity-10 ${getStatusClass(
                                order.status
                              )} bg-${order.status.toLowerCase()}-100`}
                            >
                              {getStatusDisplay(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {order.orderItems?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

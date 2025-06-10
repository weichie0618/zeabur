'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExportOrdersModal from './export/ExportOrdersModal';
import { fetchOrdersForExport } from './export/exportService';
import { 
  statusMap, 
  reverseStatusMap, 
  initializeAuth, 
  getAuthHeaders as getAuthHeadersFromService,
  handleAuthError as handleAuthErrorFromService,
  handleRelogin as handleReloginFromService,
  getStatusDisplay as getStatusDisplayFromService,
  getStatusClass as getStatusClassFromService,
  setupAuthWarningAutoHide
} from '../utils/authService';

// 訂單類型
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  notes?: string;
  lineid?: string;
  orderItems?: OrderItem[];
  address?: Address;
  line_user?: any;
  auth_user?: any;
  salesperson?: {
    id: string;
    companyName: string;
  };
}

// 訂單項目類型
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit_price?: number;
  product?: Product;
}

// 商品類型
interface Product {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  category?: string;
  specification?: string;
}

// 地址類型
interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  address1: string;
  city: string;
  postal_code: string;
}

// 訂單響應類型
interface OrdersResponse {
  total: number;
  page: number;
  totalPages: number;
  orders: Order[];
  message?: string;
}

// 編輯訂單表單類型
interface EditOrderForm {
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    recipientName?: string;
    phone?: string;
    address1?: string;
    city?: string;
    postal_code?: string;
  };
  status?: string;
  notes?: string;
  lineid?: string;
  items?: Array<{
    product_id: string;
    quantity: number;
    price?: number;
  }>;
}

export default function OrdersManagement() {
  // 狀態
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [companyNameFilter, setCompanyNameFilter] = useState<string>('');
  const [customers, setCustomers] = useState<Array<{id: string, companyName: string}>>([]);
  const [limit] = useState<number>(10);
  const [accessToken, setAccessToken] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 查看訂單詳情
  const [showOrderDetail, setShowOrderDetail] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 編輯訂單狀態
  const [showStatusUpdate, setShowStatusUpdate] = useState<boolean>(false);
  const [editOrderForm, setEditOrderForm] = useState<EditOrderForm>({
    customer_info: {
      name: '',
      email: '',
      phone: ''
    },
    shipping_address: {
      recipientName: '',
      phone: '',
      address1: '',
      city: '',
      postal_code: ''
    },
    status: '',
    notes: '',
    lineid: '',
    items: []
  });
  const [statusNote, setStatusNote] = useState<string>('');
  
  // 商品編輯相關狀態
  const [showEditItem, setShowEditItem] = useState<boolean>(false);
  const [showAddItem, setShowAddItem] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<OrderItem | null>(null);
  const [editItemForm, setEditItemForm] = useState<{
    id?: string;
    product_id: string;
    quantity: number;
    price: number;
  }>({
    product_id: '',
    quantity: 1,
    price: 0
  });
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const router = useRouter();

  // 添加自定義日期範圍狀態
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);
  
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

  // 添加公司名稱篩選處理
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyNameFilter(e.target.value);
  };

  // 獲取認證令牌
  const getAuthHeaders = () => {
    return getAuthHeadersFromService(accessToken);
  };
  
  // 自動隱藏認證警告
  useEffect(() => {
    const cleanup = setupAuthWarningAutoHide(error, setShowAuthWarning);
    return cleanup;
  }, [error]);
  
  // 初始化獲取認證令牌
  useEffect(() => {
    console.log('開始初始化認證流程');
    
    // 使用共用的初始化認證函數
    initializeAuth(
      setAccessToken,
      setError,
      setLoading,
      setShowAuthWarning
    );
  }, []);
  
  // 處理認證錯誤
  const handleAuthError = (errorMessage: string) => {
    handleAuthErrorFromService(errorMessage, setError, setLoading, setShowAuthWarning);
  };
  
  // 重新登入功能
  const handleRelogin = () => {
    handleReloginFromService();
  };

  // 第一次載入時獲取訂單數據和客戶列表
  useEffect(() => {
    // 確保已獲取到token後再發起請求
    if (accessToken) {
      console.log('accessToken 已設置，準備獲取訂單');
      fetchOrders();
      // 獲取客戶列表以供篩選
      fetchCustomers();
    } else {
      // 不立即顯示錯誤，等待可能的自動重試
      console.warn('useEffect: 暫時缺少accessToken，等待獲取中...');
    }
  }, [accessToken]);

  // 獲取客戶列表
  const fetchCustomers = async () => {
    if (!accessToken) {
      console.error('獲取客戶列表時缺少認證令牌');
      return;
    }

    try {
      const params = new URLSearchParams({
        limit: '100', // 獲取較多客戶以供篩選
        sortBy: 'companyName',
        order: 'ASC'
      });

      console.log(`發送請求: /api/customers?${params.toString()}`);
      const response = await fetch(`/api/customers?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthError('獲取客戶列表時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok && data.data) {
        // 過濾出有公司名稱的客戶
        const customersWithCompany = data.data.filter((customer: any) => 
          customer.companyName && customer.companyName.trim() !== ''
        );
        
        // 去除重複的公司名稱
        const uniqueCompanies = Array.from(new Set(
          customersWithCompany.map((customer: any) => customer.companyName)
        )).map(companyName => {
          const customer = customersWithCompany.find((c: any) => c.companyName === companyName);
          return {
            id: customer.id,
            companyName: companyName as string
          };
        });
        
        setCustomers(uniqueCompanies);
        console.log(`已載入 ${uniqueCompanies.length} 個客戶公司`);
      } else {
        console.error('獲取客戶列表失敗:', data.message);
      }
    } catch (err) {
      console.error('獲取客戶列表錯誤:', err);
    }
  };

  // 處理搜尋
  const handleFilter = () => {
    if (!accessToken) {
      console.error('執行搜尋時缺少認證令牌');
      setError('認證失敗，請重新登入系統');
      return;
    }
    fetchOrders(1);
  };

  // 獲取訂單列表
  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(''); // 清除之前的錯誤
      console.log('開始獲取訂單，頁碼:', page);
      console.log('當前 accessToken 狀態:', accessToken ? '已設置' : '未設置');
      
      // 構建查詢參數
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

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
          // 視為客戶名稱
          params.append('customer_name', searchQuery.trim());
        }
      }
      
      // 添加公司名稱篩選
      if (companyNameFilter) {
        params.append('companyName', companyNameFilter);
      }
      
      // 處理日期過濾
      if (dateFilter) {
        // 使用新的 date_range 參數
        if (['today', 'yesterday', 'this_week', 'this_month', 'last_month'].includes(dateFilter)) {
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

      // 標準訂單列表API調用
      console.log(`發送請求: /api/orders?${params.toString()}`);
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      // 處理認證失敗
      if (response.status === 401) {
        handleAuthError('獲取訂單列表時認證失敗');
        setLoading(false);
        return;
      } else if (response.status === 403) {
        setError('您沒有權限訪問此資源，請聯繫管理員');
        setLoading(false);
        return;
      } else if (response.status === 429) {
        setError('請求頻率過高，請稍後再試');
        setLoading(false);
        return;
      } else if (response.status >= 500) {
        setError('伺服器錯誤，請稍後再試或聯繫技術支持');
        setLoading(false);
        return;
      }
      
      const data: OrdersResponse = await response.json();
      console.log('訂單數據回應:', data);
      
      if (response.ok) {
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
          setTotalOrders(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.page || 1);
        } else {
          setOrders([]);
          setTotalOrders(0);
          setTotalPages(0);
          setCurrentPage(1);
          // 不顯示錯誤，因為這是有效的空結果
          console.log('沒有找到符合條件的訂單');
        }
      } else {
        throw new Error(data.message || '獲取訂單失敗');
      }

      setLoading(false);
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        // 網絡錯誤，可能是暫時性問題
        setError('網絡連接問題，請檢查您的網絡連接並稍後重試');
      } else if (err.message?.includes('JSON')) {
        // JSON解析錯誤
        setError('數據解析錯誤，可能是伺服器回應格式異常，請聯繫技術支持');
      } else if (err.message?.includes('timeout')) {
        // 請求超時
        setError('請求超時，伺服器可能繁忙，請稍後再試');
      } else {
        // 其他錯誤
        setError(err.message || '獲取訂單時出錯，請重試或聯繫技術支持');
      }
      setLoading(false);
      console.error('獲取訂單錯誤:', err);
    }
  };

  // 處理分頁
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchOrders(page);
  };

  // 取消訂單
  const handleCancelOrder = async (orderId: string) => {
    if (!accessToken) {
      setError('認證失敗，請重新登入系統');
      return;
    }

    try {
      setLoading(true);
      // 先檢查是否是訂單編號還是訂單ID
      const isOrderNumber = orderId.includes('ORD-');
      const endpoint = isOrderNumber ? `/api/orders/cancel-by-number` : `/api/orders/${orderId}/cancel`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          order_number: isOrderNumber ? orderId : undefined
        })
      });
      
      // 檢查認證錯誤
      if (response.status === 401) {
        handleAuthError('取消訂單時認證失敗');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // 顯示成功訊息
        setSuccess('訂單已成功取消');
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
        
        // 重新獲取最新訂單資料
        fetchOrders(currentPage);
      } else {
        setError(data.message || '取消訂單失敗');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || '處理訂單時出錯');
      console.error('取消訂單錯誤:', err);
      setLoading(false);
    }
  };

  // 查看訂單詳情
  const handleViewOrderDetail = async (orderNumber: string) => {
    if (!accessToken) {
      setError('認證失敗，請重新登入系統');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        order_number: orderNumber
      });
      
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('獲取訂單詳情時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok && data.orders && data.orders.length > 0) {
        const orderData = data.orders[0];
        
        // 確保 orderItems 的 price 字段正確設置
        if (orderData.orderItems && orderData.orderItems.length > 0) {
          console.log('原始訂單項目數據:', orderData.orderItems);
          
          orderData.orderItems = orderData.orderItems.map((item: any) => {
            // 確保 price 欄位有值，優先使用 price，如果沒有則使用 unit_price
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
                
            console.log(`商品 ${item.product_name} - 價格處理: price=${item.price}, unit_price=${item.unit_price}, 最終價格=${itemPrice}`);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
          
          console.log('處理後的訂單項目數據:', orderData.orderItems);
        }
        
        setSelectedOrder(orderData);
        setShowOrderDetail(true);
        
        // 預先載入商品列表以便編輯
        if (availableProducts.length === 0) {
          fetchAvailableProducts();
        }
      } else {
        setError(data.message || '獲取訂單詳情失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單詳情時出錯');
      console.error('獲取訂單詳情錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 關閉訂單詳情模態視窗
  const handleCloseOrderDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
    
    // 關閉詳情視窗後重新獲取最新的訂單列表
    fetchOrders(currentPage);
  };

  // 開啟編輯訂單模態視窗
  const handleOpenEditOrder = (order: Order) => {
    // 導航到編輯頁面，不再使用模態視窗
    router.push(`/admin/bakery/orders/edit/${order.order_number}`);
  };

  // 更新訂單資訊 - 移除此函數，因為編輯功能已經移至獨立頁面
  const handleUpdateOrder = async () => {
    if (!accessToken || !selectedOrder) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editOrderForm),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('更新訂單時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('訂單更新成功');
        // 更新成功後關閉模態視窗
        setShowStatusUpdate(false);
        // 重新獲取訂單列表
        fetchOrders(currentPage);
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || '更新訂單失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單更新時出錯');
      console.error('更新訂單錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 開啟更新訂單狀態模態視窗
  const handleOpenStatusUpdate = (order: Order) => {
    setSelectedOrder(order);
    setStatusNote('');
    setShowStatusUpdate(true);
    
    // 確保狀態表單中填入當前訂單狀態
    setEditOrderForm({
      ...editOrderForm,
      status: order.status
    });
  };

  // 更新訂單狀態
  const handleUpdateStatus = async () => {
    if (!accessToken || !selectedOrder) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: editOrderForm.status,
          note: statusNote,
        }),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('更新訂單狀態時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('訂單狀態更新成功');
        // 更新成功後關閉模態視窗
        setShowStatusUpdate(false);
        // 重新獲取訂單列表
        fetchOrders(currentPage);
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || '更新訂單狀態失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單狀態更新時出錯');
      console.error('更新訂單狀態錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 開啟編輯商品模態視窗
  const handleOpenEditItem = (item: OrderItem) => {
    setCurrentItem(item);
    setEditItemForm({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price || 0
    });
    setShowEditItem(true);
    
    // 獲取可用商品列表（如果尚未載入）
    if (availableProducts.length === 0) {
      fetchAvailableProducts();
    }
  };

  // 獲取可用商品列表
  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (response.status === 401) {
        handleAuthError('獲取產品列表時認證失敗');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // 過濾出狀態為 active 的商品
        const activeProducts = data.data.filter((product: any) => product.status === 'active');
        
        // 將 API 回應格式轉換為組件使用的格式
        const formattedProducts = activeProducts.map((product: any) => ({
          id: product.id.toString(),
          name: `${product.name} ${product.specification ? `(${product.specification})` : ''} - ${product.category?.name || ''}`,
          price: parseFloat(product.price),
          discount_price: product.discount_price ? parseFloat(product.discount_price) : undefined,
          category: product.category?.name || '',
          specification: product.specification || ''
        }));
        
        setAvailableProducts(formattedProducts);
        console.log(`已載入 ${formattedProducts.length} 個活動商品`);
      } else {
        console.error('獲取產品列表失敗:', data.message);
      }
    } catch (err) {
      console.error('獲取產品列表錯誤:', err);
    }
  };

  // 更新訂單商品
  const handleUpdateOrderItem = async () => {
    if (!accessToken || !selectedOrder || !editItemForm.product_id) {
      setError('認證失敗或缺少所需資訊');
      return;
    }

    try {
      setLoading(true);
      
      const items = [];
      
      // 如果有item ID，則是更新現有商品
      if (editItemForm.id) {
        items.push({
          id: editItemForm.id,
          product_id: editItemForm.product_id,
          quantity: editItemForm.quantity,
          price: editItemForm.price
        });
      } else {
        // 否則是添加新商品（不應該走到這裡，因為有單獨的添加商品函數）
        items.push({
          product_id: editItemForm.product_id,
          quantity: editItemForm.quantity,
          price: editItemForm.price
        });
      }
      
      const response = await fetch(`/api/orders/${selectedOrder.id}/items`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('更新訂單商品時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('訂單商品更新成功');
        
        // 處理返回的訂單項目數據
        if (data.order && data.order.items) {
          data.order.items = data.order.items.map((item: any) => {
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
        }
        
        // 更新當前訂單的商品資訊
        if (selectedOrder) {
          setSelectedOrder({
            ...selectedOrder,
            orderItems: data.order.items,
            total_amount: data.order.total_amount
          });
        }
        
        // 關閉編輯模態視窗
        setShowEditItem(false);
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
        
        // 重新獲取最新訂單資料，確保資料同步
        handleViewOrderDetail(selectedOrder.order_number);
        
        // 同時更新訂單列表，確保總覽頁面數據也是最新的
        fetchOrders(currentPage);
      } else {
        setError(data.message || '更新訂單商品失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單商品更新時出錯');
      console.error('更新訂單商品錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 刪除訂單商品
  const handleDeleteOrderItem = async (itemId: string) => {
    if (!accessToken || !selectedOrder) {
      setError('認證失敗或缺少訂單資訊');
      return;
    }

    if (!window.confirm('確定要刪除此商品嗎？')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${selectedOrder.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('刪除訂單商品時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || '訂單商品刪除成功');
        
        // 確保 orderItems 的 price 字段正確設置
        if (data.order && data.order.items) {
          data.order.items = data.order.items.map((item: any) => {
            // 確保 price 欄位有值
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
        }
        
        // 更新當前訂單的商品資訊
        if (selectedOrder) {
          setSelectedOrder({
            ...selectedOrder,
            orderItems: data.order.items,
            total_amount: data.order.total_amount
          });
        }
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
        
        // 重新獲取訂單列表數據
        fetchOrders(currentPage);
      } else {
        setError(data.message || '刪除訂單商品失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理訂單商品刪除時出錯');
      console.error('刪除訂單商品錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 開啟添加商品模態視窗
  const handleOpenAddItem = () => {
    setEditItemForm({
      product_id: '',
      quantity: 1,
      price: 0
    });
    setShowAddItem(true);
    
    // 獲取可用商品列表（如果尚未載入）
    if (availableProducts.length === 0) {
      fetchAvailableProducts();
    }
  };

  // 添加商品到訂單
  const handleAddOrderItem = async () => {
    if (!accessToken || !selectedOrder || !editItemForm.product_id) {
      setError('認證失敗或缺少商品資訊');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${selectedOrder.id}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: editItemForm.product_id,
          quantity: editItemForm.quantity,
          price: editItemForm.price
        }),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('添加商品到訂單時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('商品成功添加到訂單');
        
        // 處理返回的訂單項目數據
        if (data.order && data.order.items) {
          data.order.items = data.order.items.map((item: any) => {
            const itemPrice = item.price !== undefined && item.price !== null 
              ? Number(item.price) 
              : (item.unit_price !== undefined && item.unit_price !== null 
                ? Number(item.unit_price) 
                : 0);
            
            return {
              ...item,
              price: itemPrice,
              quantity: Number(item.quantity)
            };
          });
        }
        
        // 更新當前訂單的商品資訊
        if (selectedOrder) {
          setSelectedOrder({
            ...selectedOrder,
            orderItems: data.order.items,
            total_amount: data.order.total_amount
          });
        }
        
        // 關閉添加模態視窗
        setShowAddItem(false);
        
        // 3秒後清除成功訊息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
        
        // 重新獲取最新訂單資料，確保資料同步
        handleViewOrderDetail(selectedOrder.order_number);
        
        // 同時更新訂單列表，確保總覽頁面數據也是最新的
        fetchOrders(currentPage);
      } else {
        setError(data.message || '添加商品到訂單失敗');
      }
    } catch (err: any) {
      setError(err.message || '處理添加商品時出錯');
      console.error('添加商品到訂單錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 渲染操作按鈕
  const renderActionButtons = (order: Order) => {
  return (
      <div className="flex space-x-3">
        <Link 
          href={`/admin/bakery/orders/${order.order_number}`}
          className="text-blue-600 hover:text-blue-900"
        >
          詳情
        </Link>
        <Link 
          href={`/admin/bakery/orders/edit/${order.order_number}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          編輯
        </Link>
        <button 
          onClick={() => handleOpenStatusUpdate(order)}
          className="text-amber-600 hover:text-amber-900"
        >
          狀態
        </button>
       
            </div>
    );
  };

  // 獲取訂單狀態的中文顯示
  const getStatusDisplay = (status: string): string => {
    return getStatusDisplayFromService(status);
  };

  // 獲取訂單狀態的樣式類
  const getStatusClass = (status: string): string => {
    return getStatusClassFromService(status);
  };

  // 判斷訂單是否可以取消
  const canCancelOrder = (status: string): boolean => {
    if (!status) return false;
    const upperStatus = status.toUpperCase();
    return upperStatus === 'PENDING' || upperStatus === 'PROCESSING';
  };

  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  
  // 匯出訂單功能
  const handleExportOrders = () => {
    setShowExportModal(true);
  };
  
  // 獲取匯出數據
  const fetchExportData = async (exportAll: boolean) => {
    if (!accessToken) {
      throw new Error('認證失敗，請重新登入系統');
    }
    
    // 調用匯出服務
    return await fetchOrdersForExport(
      {
        searchQuery,
        statusFilter,
        dateFilter,
        companyNameFilter,
        startDate,
        endDate
      },
      exportAll,
      getAuthHeaders
    );
  };

  return (
    <div className="space-y-6">
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
              onClick={handleRelogin}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              重試
            </button>
            </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
        <button 
          className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          onClick={handleExportOrders}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          匯出訂單
        </button>
      </div>

      {/* 過濾器區域 */}
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
              <option value="">所有時間</option>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="this_week">本週</option>
              <option value="this_month">本月</option>
              <option value="last_month">上個月</option>
              <option value="custom">自訂日期範圍</option>
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
            onClick={handleFilter}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            套用篩選
          </button>
        </div>
      </div>

      {/* 錯誤訊息顯示 - 增強版 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">發生錯誤</p>
                <p>{error}</p>
                {error.includes('網絡') && (
                  <p className="text-sm mt-1">建議檢查您的網絡連接，或重新整理頁面再試。</p>
                )}
                {error.includes('認證') && (
                  <p className="text-sm mt-1">您的登入可能已過期，請嘗試重新登入後再訪問此頁面。</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setError('')}
                className="text-sm hover:text-red-900"
              >
                關閉
              </button>
              {error.includes('認證失敗') && (
                <button
                  onClick={handleRelogin}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  重新登入
                </button>
              )}
              {!error.includes('認證失敗') && (
                <button
                  onClick={() => {
                    setError('');
                    fetchOrders();
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  重試
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 成功訊息顯示 */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          <div className="flex justify-between">
            <p>{success}</p>
            <button
              onClick={() => setSuccess('')}
              className="text-sm hover:text-green-900"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 訂單表格 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-amber-600 border-r-2 border-amber-600 border-b-2 border-amber-600 border-l-2 border-gray-200"></div>
            <p className="mt-2 text-gray-600">載入訂單中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-600">
            <p>沒有找到符合條件的訂單</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單編號
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶資訊
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶業主
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總金額
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600">
                      <Link href={`/admin/bakery/orders/${order.order_number}`}>
                        {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-500">{order.salesperson?.id}</div>
                      <div className="text-sm font-medium text-gray-900">{order.salesperson?.companyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      NT${typeof order.total_amount === 'number' ? order.total_amount.toLocaleString('zh-TW') : order.total_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusClass(order.status)}>
                        {getStatusDisplay(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderActionButtons(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        
        {/* 分頁控制 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                顯示 <span className="font-medium">{(currentPage - 1) * limit + 1}</span> 到 
                <span className="font-medium">{Math.min(currentPage * limit, totalOrders)}</span> 項，
                共 <span className="font-medium">{totalOrders}</span> 項
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(pageNum)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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

      {/* 匯出訂單模態窗 */}
      <ExportOrdersModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filters={{
          searchQuery,
          statusFilter,
          dateFilter,
          companyNameFilter,
          startDate,
          endDate
        }}
        fetchExportData={fetchExportData}
      />
    </div>
  );
} 
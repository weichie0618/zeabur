'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// 訂單狀態映射 - 確保全部使用大寫鍵
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

// 反向狀態映射 (用於API請求)
const reverseStatusMap: Record<string, string> = {
  '待處理': 'PENDING',
  '處理中': 'PROCESSING',
  '已出貨': 'SHIPPED',
  '已送達': 'DELIVERED',
  '已取消': 'CANCELLED'
};

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
  salesperson_code?: string;
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
  const [limit] = useState<number>(10);
  const [accessToken, setAccessToken] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAuthWarning, setShowAuthWarning] = useState<boolean>(false);

  // 查看訂單詳情
  const [showOrderDetail, setShowOrderDetail] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 編輯訂單狀態
  const [showEditOrder, setShowEditOrder] = useState<boolean>(false);
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

  // 獲取認證令牌
  const getAuthHeaders = () => {
    // 檢查並輸出 accessToken 的值，方便調試
    if (!accessToken) {
      console.warn('getAuthHeaders: accessToken 為空');
    } else {
      console.log('getAuthHeaders: 使用令牌', accessToken.substring(0, 10) + '...');
    }
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  };
  
  // 初始化獲取認證令牌
  useEffect(() => {
    // 從cookies中讀取accessToken
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) {
        console.log(`找到 ${name} cookie`);
        return decodeURIComponent(match[2]);
      } else {
        console.warn(`未找到 ${name} cookie`);
        return '';
      }
    };
    
    // 獲取令牌的函數
    const getToken = () => {
      // 先檢查 localStorage 是否有令牌
      let token = localStorage.getItem('accessToken');
      if (token) {
        console.log('從 localStorage 獲取令牌成功');
        return token;
      }
      
      // 如果 localStorage 沒有，再嘗試從 cookie 獲取
      token = getCookieValue('accessToken');
      if (token) {
        console.log('從 cookie 獲取令牌成功');
        // 將token也保存到localStorage，確保一致性
        localStorage.setItem('accessToken', token);
        return token;
      }
      
      console.error('無法獲取認證令牌');
      return '';
    };
    
    // 嘗試獲取令牌
    const token = getToken();
    
    if (token) {
      console.log('成功獲取令牌，長度:', token.length);
      setAccessToken(token);
    } else {
      setError('未獲取到認證令牌，請確認您已登入系統。請嘗試重新登入後再訪問此頁面。');
      setLoading(false);
    }
    
    // 添加重試機制
    let retryCount = 0;
    const maxRetries = 3;
    
    const retryFetchToken = () => {
      if (retryCount >= maxRetries) return;
      
      console.log(`嘗試重新獲取令牌 (第 ${retryCount + 1} 次)`);
      const newToken = getToken();
      
      if (newToken) {
        console.log('重試獲取令牌成功');
        setAccessToken(newToken);
      } else {
        retryCount++;
        // 延遲重試
        setTimeout(retryFetchToken, 1000);
      }
    };
    
    // 如果沒有token，嘗試重新獲取
    if (!token) {
      setTimeout(retryFetchToken, 1000);
    }
  }, []);
  
  // 第一次載入時獲取訂單數據
  useEffect(() => {
    // 確保已獲取到token後再發起請求
    if (accessToken) {
      console.log('accessToken 已設置，準備獲取訂單');
      fetchOrders();
    } else {
      // 不立即顯示錯誤，等待可能的自動重試
      console.warn('useEffect: 暫時缺少accessToken，等待獲取中...');
    }
  }, [accessToken]);

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
    // 檢查令牌是否存在
    if (!accessToken) {
      // 尋找可能存在但未被狀態捕獲的令牌
      const localToken = localStorage.getItem('accessToken');
      if (localToken) {
        console.log('找到localStorage中的令牌，嘗試使用它');
        setAccessToken(localToken);
        return; // 修改狀態後會觸發useEffect重新調用fetchOrders
      }
      
      // 確實沒有令牌，顯示錯誤
      console.error('獲取訂單時缺少認證令牌');
      setError('認證失敗，請重新登入系統');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(''); // 清除之前的錯誤
      console.log('開始獲取訂單，頁碼:', page);
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

      // 添加日期過濾
      if (dateFilter) {
        const now = new Date();
        let startDate = '';

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            params.append('startDate', startDate);
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            startDate = yesterday.toISOString();
            const endYesterday = new Date(yesterday);
            endYesterday.setHours(23, 59, 59, 999);
            params.append('startDate', startDate);
            params.append('endDate', endYesterday.toISOString());
            break;
          case 'this_week':
            const thisWeekStart = new Date(now);
            thisWeekStart.setDate(now.getDate() - now.getDay());
            thisWeekStart.setHours(0, 0, 0, 0);
            params.append('startDate', thisWeekStart.toISOString());
            break;
          case 'this_month':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            params.append('startDate', thisMonthStart.toISOString());
            break;
          case 'last_month':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            params.append('startDate', lastMonthStart.toISOString());
            params.append('endDate', lastMonthEnd.toISOString());
            break;
        }
      }

      // 如果有搜尋查詢，改為使用查詢API
      if (searchQuery) {
        // 嘗試確定查詢類型 (訂單號或客戶資訊)
        const isOrderNumber = /^ORD-\d+$/.test(searchQuery.trim());
        
        if (isOrderNumber) {
          // 查詢特定訂單
          const orderCheckResponse = await fetch('/api/orders/check', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              order_number: searchQuery.trim(),
            }),
            credentials: 'include',
          });
          
          if (orderCheckResponse.status === 401) {
            handleAuthError('查詢訂單時認證失敗');
            return;
          }
          
          const orderData = await orderCheckResponse.json();
          
          if (orderCheckResponse.ok) {
            // 設置為單一訂單結果
            setOrders([{
              id: orderData.id,
              order_number: orderData.order_number,
              customer_name: orderData.customer_name,
              customer_email: orderData.customer_email,
              customer_phone: orderData.customer_phone,
              status: orderData.status,
              total_amount: orderData.total_amount,
              created_at: new Date(orderData.created_at).toLocaleString('zh-TW'),
              orderItems: orderData.orderItems || [],
              address: orderData.address
            }]);
            setTotalOrders(1);
            setTotalPages(1);
            setCurrentPage(1);
          } else {
            setOrders([]);
            setTotalOrders(0);
            setTotalPages(0);
            setError(orderData.message || '獲取訂單失敗');
          }
        } else {
          // 嘗試作為客戶資訊查詢
          // 假設搜尋字串可能是客戶姓名、電話或郵件，先查詢
          const response = await fetch('/api/orders/query', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              customer_email: searchQuery.includes('@') ? searchQuery : undefined,
              customer_phone: /^[0-9-]+$/.test(searchQuery) ? searchQuery : undefined,
              customer_name: !searchQuery.includes('@') && !/^[0-9-]+$/.test(searchQuery) ? searchQuery : undefined
            }),
            credentials: 'include',
          });
          
          if (response.status === 401) {
            handleAuthError('查詢客戶訂單時認證失敗');
            return;
          }
          
          const data = await response.json();
          
          if (response.ok) {
            setOrders(data.orders.map((order: any) => ({
              id: order.id,
              order_number: order.order_number,
              customer_name: order.customer_name,
              customer_email: order.customer_email || '',
              customer_phone: order.customer_phone || '',
              status: order.status,
              total_amount: order.total_amount,
              created_at: new Date(order.created_at).toLocaleString('zh-TW'),
              orderItems: order.orderItems || []
            })));
            setTotalOrders(data.count);
            setTotalPages(Math.ceil(data.count / limit));
            setCurrentPage(1);
          } else {
            // 如果客戶查詢失敗，回退到標準訂單列表
            const listResponse = await fetch(`/api/orders?${params.toString()}`, {
              headers: getAuthHeaders(),
              credentials: 'include',
            });
            
            if (listResponse.status === 401) {
              handleAuthError('獲取訂單列表時認證失敗');
              return;
            }
            
            const listData: OrdersResponse = await listResponse.json();
            
            if (listResponse.ok) {
              setOrders(listData.orders);
              setTotalOrders(listData.total);
              setTotalPages(listData.totalPages);
              setCurrentPage(listData.page);
            } else {
              throw new Error(listData.message || '獲取訂單失敗');
            }
          }
        }
      } else {
        // 標準訂單列表API調用
        console.log(`發送請求: /api/orders?${params.toString()}`);
        const response = await fetch(`/api/orders?${params.toString()}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        
        // 處理認證失敗
        if (response.status === 401) {
          handleAuthError('獲取訂單列表時認證失敗');
          return;
        }
        
        const data: OrdersResponse = await response.json();
        console.log('訂單數據回應:', data);
        
        if (response.ok) {
          setOrders(data.orders || []);
          setTotalOrders(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.page || 1);
        } else {
          throw new Error(data.message || '獲取訂單失敗');
        }
      }

      setLoading(false);
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        // 網絡錯誤，可能是暫時性問題
        setError('網絡連接問題，請檢查您的網絡連接並稍後重試');
      } else {
        // 其他錯誤
        setError(err.message || '獲取訂單時出錯');
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

  // 處理匯出
  const handleExport = async () => {
    try {
      // 構建查詢參數
      const params = new URLSearchParams({
        format: 'excel',
      });

      // 添加過濾條件
      if (statusFilter) {
        params.append('status', reverseStatusMap[statusFilter] || statusFilter);
      }

      if (dateFilter === 'custom' && dateFilter) {
        // 這裡可以根據需要添加自定義日期範圍
      } else if (dateFilter) {
        const now = new Date();
        let startDate = '';

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            params.append('startDate', startDate);
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            startDate = yesterday.toISOString();
            const endYesterday = new Date(yesterday);
            endYesterday.setHours(23, 59, 59, 999);
            params.append('startDate', startDate);
            params.append('endDate', endYesterday.toISOString());
            break;
          case 'this_week':
            const thisWeekStart = new Date(now);
            thisWeekStart.setDate(now.getDate() - now.getDay());
            thisWeekStart.setHours(0, 0, 0, 0);
            params.append('startDate', thisWeekStart.toISOString());
            break;
          case 'this_month':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            params.append('startDate', thisMonthStart.toISOString());
            break;
          case 'last_month':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            params.append('startDate', lastMonthStart.toISOString());
            params.append('endDate', lastMonthEnd.toISOString());
            break;
        }
      }

      // 設置認證頭
      const headers = getAuthHeaders();
      
      // 使用認證頭建立請求
      const request = new Request(`/api/orders/export?${params.toString()}`, {
        headers: headers,
        credentials: 'include',
      });
      
      // 開始下載
      window.location.href = request.url;
    } catch (err) {
      console.error('匯出訂單錯誤:', err);
      alert('匯出訂單時出錯');
    }
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

  // 處理認證錯誤
  const handleAuthError = (errorMessage: string) => {
    console.error(errorMessage);
    // 先檢查localStorage和cookie，確認令牌是否已丟失
    const hasLocalStorageToken = !!localStorage.getItem('accessToken');
    const hasCookieToken = document.cookie.includes('accessToken=');
    
    if (!hasLocalStorageToken && !hasCookieToken) {
      setError('認證令牌已丟失，請重新登入系統');
    } else {
      // 令牌存在但可能已過期或無效
      setError('認證失敗，請嘗試重新登入系統');
    }
    setLoading(false);
  };
  
  // 重新登入功能
  const handleRelogin = () => {
    console.log('執行重新登入流程');
    
    // 清除當前令牌
    localStorage.removeItem('accessToken');
    
    // 刪除 cookie (透過設置過期時間為過去)
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 記錄當前URL，以便登錄後返回
    const returnUrl = encodeURIComponent(window.location.pathname);
    
    // 跳轉到登入頁面
    window.location.href = `/login?returnUrl=${returnUrl}`;
  };

  // 查看訂單詳情 - 使用新的 API
  const handleViewOrderDetail = async (orderNumber: string) => {
    if (!accessToken) {
      setError('認證失敗，請重新登入系統');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          order_number: orderNumber 
        }),
        credentials: 'include',
      });

      // 處理認證錯誤
      if (response.status === 401) {
        handleAuthError('獲取訂單詳情時認證失敗');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        // 確保 orderItems 的 price 字段正確設置
        if (data.orderItems && data.orderItems.length > 0) {
          console.log('原始訂單項目數據:', data.orderItems);
          
          data.orderItems = data.orderItems.map((item: any) => {
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
          
          console.log('處理後的訂單項目數據:', data.orderItems);
        }
        
        setSelectedOrder(data);
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
    // 預設填入當前訂單資訊
    setEditOrderForm({
      customer_info: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
      shipping_address: order.address ? {
        recipientName: order.address.recipient_name,
        phone: order.address.phone,
        address1: order.address.address1,
        city: order.address.city,
        postal_code: order.address.postal_code,
      } : undefined,
      status: order.status,
      notes: order.notes,
      lineid: order.lineid,
      items: order.orderItems?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    });
    setSelectedOrder(order);
    setShowEditOrder(true);
  };

  // 更新訂單資訊
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
        setShowEditOrder(false);
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
        <button 
          onClick={() => handleViewOrderDetail(order.order_number)}
          className="text-blue-600 hover:text-blue-900"
        >
          詳情
        </button>
        <button 
          onClick={() => handleOpenEditOrder(order)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          編輯
        </button>
        <button 
          onClick={() => handleOpenStatusUpdate(order)}
          className="text-amber-600 hover:text-amber-900"
        >
          狀態
        </button>
       
            </div>
    );
  };

  // 自動隱藏認證警告條
  useEffect(() => {
    if (error && error.includes('認證')) {
      setShowAuthWarning(true);
      
      // 5秒後自動隱藏頂部警告條，但保留錯誤訊息
      const timer = setTimeout(() => {
        setShowAuthWarning(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 獲取訂單狀態的中文顯示
  const getStatusDisplay = (status: string): string => {
    if (!status) return '未知';
    
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

  // 判斷訂單是否可以取消
  const canCancelOrder = (status: string): boolean => {
    if (!status) return false;
    const upperStatus = status.toUpperCase();
    return upperStatus === 'PENDING' || upperStatus === 'PROCESSING';
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
          onClick={handleExport}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
          匯出訂單
        </button>
      </div>

      {/* 過濾器區域 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="訂單編號或客戶名稱"
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

      {/* 錯誤訊息顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex justify-between">
            <p>{error}</p>
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
                  日期
                </th>
                 
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總金額
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  動作
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
        <div className="my-5 flex justify-between items-center">
          {/* 頁碼顯示 */}
          <div className="text-sm text-gray-700">
            共 <span className="font-medium">{totalOrders}</span> 筆訂單，
            頁數 <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
          </div>
          
          {/* 分頁按鈕 */}
          <div className="flex space-x-2">
            <button
              onClick={() => fetchOrders(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-3 py-1 rounded ${
                currentPage <= 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              上一頁
            </button>
            <button
              onClick={() => fetchOrders(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 rounded ${
                currentPage >= totalPages 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              下一頁
            </button>
          </div>
        </div>
      </div>

      {/* 訂單詳情模態視窗 */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">訂單詳情 #{selectedOrder.order_number}</h3>
              <button 
                onClick={handleCloseOrderDetail}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
                <h4 className="font-medium text-gray-700 mb-2">訂單資訊</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">訂單編號：</span> {selectedOrder.order_number}</p>
                  <p><span className="text-gray-600">訂單狀態：</span> <span className={getStatusClass(selectedOrder.status)}>{getStatusDisplay(selectedOrder.status)}</span></p>
                  <p><span className="text-gray-600">訂單日期：</span> {new Date(selectedOrder.created_at).toLocaleString('zh-TW').replace(/\//g, '/')}</p>
                  <p><span className="text-gray-600">總金額：</span> NT${typeof selectedOrder.total_amount === 'number' ? selectedOrder.total_amount.toLocaleString('zh-TW') : selectedOrder.total_amount}</p>
                  {selectedOrder.notes && (
                    <p><span className="text-gray-600">備註：</span> {selectedOrder.notes}</p>
                  )}
                  {selectedOrder.lineid && (
                    <p><span className="text-gray-600">Line ID：</span> {selectedOrder.lineid}</p>
                  )}
                </div>
            </div>
            <div>
                <h4 className="font-medium text-gray-700 mb-2">客戶資訊</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">姓名：</span> {selectedOrder.customer_name}</p>
                  <p><span className="text-gray-600">電話：</span> {selectedOrder.customer_phone}</p>
                  <p><span className="text-gray-600">電子郵件：</span> {selectedOrder.customer_email}</p>
                </div>
                
                {selectedOrder.address && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">收貨地址</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">收件人：</span> {selectedOrder.address.recipient_name}</p>
                      <p><span className="text-gray-600">電話：</span> {selectedOrder.address.phone}</p>
                      <p><span className="text-gray-600">地址：</span> {selectedOrder.address.postal_code} {selectedOrder.address.city} {selectedOrder.address.address1}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">訂單項目</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        商品
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        數量
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        單價
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        小計
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.orderItems && selectedOrder.orderItems.map((item, index) => {
                      // 計算小計
                      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
                      const price = typeof item.price === 'number' ? item.price : 0;
                      const subtotal = quantity * price;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.product?.name || item.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            NT${price.toLocaleString('zh-TW')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            NT${subtotal.toLocaleString('zh-TW')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="text-indigo-600 hover:text-indigo-900"
                                disabled={loading}
                              >
                                編輯
                              </button>
                              <button
                                onClick={() => handleDeleteOrderItem(item.id)}
                                className="text-red-600 hover:text-red-900 ml-2"
                                disabled={loading}
                              >
                                刪除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          訂單中沒有商品
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                        總計:
                      </td>
                      <td className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        NT${typeof selectedOrder.total_amount === 'number' ? selectedOrder.total_amount.toLocaleString('zh-TW') : selectedOrder.total_amount}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={handleOpenAddItem}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          disabled={loading}
                        >
                          新增商品
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseOrderDetail}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                關閉
            </button>
              <button
                onClick={() => {
                  handleCloseOrderDetail();
                  handleOpenEditOrder(selectedOrder);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                編輯訂單
            </button>
              <button
                onClick={() => {
                  handleCloseOrderDetail();
                  handleOpenStatusUpdate(selectedOrder);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                更新狀態
                </button>
              {canCancelOrder(selectedOrder.status) && (
                <button
                  onClick={() => {
                    if (window.confirm('確定要取消此訂單嗎？')) {
                      handleCancelOrder(selectedOrder.order_number);
                      handleCloseOrderDetail();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  取消訂單
                </button>
              )}
          </div>
          </div>
        </div>
      )}

      {/* 編輯訂單模態視窗 */}
      {showEditOrder && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">編輯訂單 #{selectedOrder.order_number}</h3>
              <button 
                onClick={() => setShowEditOrder(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 客戶資訊 */}
            <div>
                <h4 className="font-medium text-gray-700 mb-3">客戶資訊</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.customer_info?.name || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        customer_info: {
                          ...editOrderForm.customer_info,
                          name: e.target.value
                        }
                      })}
                    />
            </div>
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                    <input
                      type="email"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.customer_info?.email || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        customer_info: {
                          ...editOrderForm.customer_info,
                          email: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                    <input
                      type="tel"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.customer_info?.phone || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        customer_info: {
                          ...editOrderForm.customer_info,
                          phone: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* 配送地址 */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">配送地址</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">收件人</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.recipientName || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          recipientName: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                    <input
                      type="tel"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.phone || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          phone: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">郵遞區號</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.postal_code || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          postal_code: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.city || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          city: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">詳細地址</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editOrderForm.shipping_address?.address1 || ''}
                      onChange={(e) => setEditOrderForm({
                        ...editOrderForm,
                        shipping_address: {
                          ...editOrderForm.shipping_address,
                          address1: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">其他資訊</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">訂單狀態</label>
                  <select
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editOrderForm.status || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      status: e.target.value
                    })}
                  >
                    <option value="PENDING">待處理</option>
                    <option value="PROCESSING">處理中</option>
                    <option value="SHIPPED">已出貨</option>
                    <option value="DELIVERED">已送達</option>
                    <option value="CANCELLED">已取消</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">業務代表代碼</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editOrderForm.salesperson_code || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      salesperson_code: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Line ID</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={editOrderForm.lineid || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      lineid: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">訂單備註</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    value={editOrderForm.notes || ''}
                    onChange={(e) => setEditOrderForm({
                      ...editOrderForm,
                      notes: e.target.value
                    })}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 注意: 編輯訂單項目需要更複雜的交互，暫時不實現 */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowEditOrder(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleUpdateOrder}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? '處理中...' : '保存更改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 更新訂單狀態模態視窗 */}
      {showStatusUpdate && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">更新訂單狀態 #{selectedOrder.order_number}</h3>
              <button 
                onClick={() => setShowStatusUpdate(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                當前訂單狀態: <span className={getStatusClass(selectedOrder.status)}>{getStatusDisplay(selectedOrder.status)}</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">新訂單狀態</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editOrderForm.status || selectedOrder.status}
                  onChange={(e) => setEditOrderForm({
                    ...editOrderForm,
                    status: e.target.value
                  })}
                >
                  <option value="PENDING">待處理</option>
                  <option value="PROCESSING">處理中</option>
                  <option value="SHIPPED">已出貨</option>
                  <option value="DELIVERED">已送達</option>
                  <option value="CANCELLED">已取消</option>
                </select>
          </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2"
                  rows={3}
                  placeholder="請輸入狀態變更的原因或其他備註"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                ></textarea>
        </div>
      </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusUpdate(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
                </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? '處理中...' : '更新狀態'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯商品模態視窗 */}
      {showEditItem && selectedOrder && currentItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">編輯商品</h3>
              <button 
                onClick={() => setShowEditItem(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品</label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.product_id}
                  onChange={(e) => {
                    const selectedProduct = availableProducts.find(p => p.id === e.target.value);
                    setEditItemForm({
                      ...editItemForm,
                      product_id: e.target.value,
                      price: selectedProduct?.price || 0
                    });
                  }}
                >
                  <option value="">-- 選擇商品 --</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - NT${typeof product.price === 'number' ? product.price.toLocaleString('zh-TW') : product.price}
                    </option>
                  ))}
                </select>
                {editItemForm.product_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    {availableProducts.find(p => p.id === editItemForm.product_id)?.specification || ''}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">數量</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.quantity}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">單價 (NT$)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.price}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    price: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">若留空，將使用商品的默認價格</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  小計: NT${typeof editItemForm.quantity === 'number' && typeof editItemForm.price === 'number' ? (editItemForm.quantity * editItemForm.price).toLocaleString('zh-TW') : '計算中...'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditItem(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
                </button>
              <button
                onClick={handleUpdateOrderItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading || !editItemForm.product_id}
              >
                {loading ? '處理中...' : '保存更改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加商品模態視窗 */}
      {showAddItem && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">添加商品到訂單</h3>
              <button 
                onClick={() => setShowAddItem(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">選擇商品 <span className="text-red-500">*</span></label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.product_id}
                  onChange={(e) => {
                    const selectedProduct = availableProducts.find(p => p.id === e.target.value);
                    setEditItemForm({
                      ...editItemForm,
                      product_id: e.target.value,
                      price: selectedProduct?.price || 0
                    });
                  }}
                >
                  <option value="">-- 選擇商品 --</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - NT${typeof product.price === 'number' ? product.price.toLocaleString('zh-TW') : product.price}
                    </option>
                  ))}
                </select>
                {editItemForm.product_id && (
                  <p className="mt-1 text-xs text-gray-500">
                    {availableProducts.find(p => p.id === editItemForm.product_id)?.specification || ''}
                  </p>
                )}
          </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">數量</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.quantity}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
        </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">單價 (NT$)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={editItemForm.price}
                  onChange={(e) => setEditItemForm({
                    ...editItemForm,
                    price: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">若留空，將使用商品的默認價格</p>
      </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  預估小計: NT${typeof editItemForm.quantity === 'number' && typeof editItemForm.price === 'number' ? (editItemForm.quantity * editItemForm.price).toLocaleString('zh-TW') : '計算中...'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleAddOrderItem}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading || !editItemForm.product_id}
              >
                {loading ? '處理中...' : '添加商品'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
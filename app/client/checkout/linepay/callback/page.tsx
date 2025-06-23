'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';




interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  order_item_notes?: string;
}

// 建立處理 LinePay 回調的客戶端組件
function LinePayCallbackContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | null>(null);
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingMethod, setShippingMethod] = useState('takkyubin_payment');
  const [shippingFee, setShippingFee] = useState(0);
  const [pickupDateTime, setPickupDateTime] = useState('');
  const [liffUrl, setLiffUrl] = useState('');

  useEffect(() => {
    const handleLinePayCallback = async () => {
      try {
        setLoading(true);

        // 檢查是否為取消付款
        const cancelled = searchParams?.get('cancelled');
        if (cancelled === 'true') {
          setStatus('failed');
          setMessage('您已取消付款');
          setLoading(false);
          return;
        }

        // 從 URL 參數獲取交易資訊
        let orderId = searchParams?.get('orderId');
        let transactionId = searchParams?.get('transactionId');

        console.log('LINE Pay回調參數:', {
          orderId,
          transactionId,
          allParams: Object.fromEntries(searchParams?.entries() || [])
        });

        if (!orderId || !transactionId) {
          setStatus('failed');
          setMessage('缺少必要的參數，無法完成支付確認');
          setLoading(false);
          return;
        }

        // 構造API URL
        const apiUrl = `/api/line-pay/confirm?orderId=${orderId}&transactionId=${transactionId}`;
        console.log('嘗試調用API:', apiUrl);

        // 呼叫後端 API 確認交易
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }).catch(error => {
          console.error('API請求失敗:', error);
          throw new Error(`API請求失敗: ${error.message}`);
        });

        const data = await response.json().catch(error => {
          console.error('解析API回應JSON失敗:', error);
          throw new Error('解析API回應失敗');
        });

        console.log('API回應:', data);

        if (response.ok && data.status === 'success') {
          // 支付成功
          console.log('LINE Pay支付確認成功');
          setStatus('success');
          setMessage(data.message || '支付成功');
          setOrderId(data.orderId);
          setOrderNumber(data.orderNumber);
          setTotalAmount(data.totalAmount);
          setItems(data.items || []);
          setShippingMethod(data.shippingMethod || 'takkyubin_payment');
          setShippingFee(data.shippingFee || 0);
          setPickupDateTime(data.pickupDateTime || '');

          // 清空購物車
          localStorage.removeItem('bakeryCart');
          
       
         
   
        } else {
          // 支付失敗
          setStatus('failed');
          setMessage(data.message || '支付處理失敗');
        }
      } catch (error) {
        console.error('處理 LINE Pay 回調時出錯：', error);
        setStatus('failed');
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        setMessage(`處理支付過程中發生錯誤：${errorMessage}，請聯繫客服`);
      } finally {
        setLoading(false);
      }
    };

    handleLinePayCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-600 mb-6"></div>
            <p className="text-gray-600 text-lg">正在處理您的支付...</p>
            <p className="text-gray-500 text-sm mt-2">請稍候，不要關閉視窗</p>
          </div>
        ) : status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">付款成功！</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">訂單編號</span>
                <span className="text-gray-900 font-semibold">{orderNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">商品金額</span>
                <span className="text-gray-900 font-semibold">${totalAmount - shippingFee}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">運費</span>
                <span className="text-gray-900 font-semibold">${shippingFee}</span>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">總金額</span>
                  <span className="text-xl text-gray-900 font-bold">${totalAmount}</span>
                </div>
              </div>
            </div>

            

            <button
              onClick={() => {
                // 跳轉到 LINE@
                window.location.href = 'https://line.me/R/ti/p/%40989xhjix';
                // 延遲關閉當前頁面，讓跳轉有時間執行
                setTimeout(() => {
                  window.close();
                }, 1000);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center focus:outline-none md:focus-visible:outline-2 md:focus-visible:outline-white touch-manipulation"
            >
              
              完成
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">付款失敗</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-800 text-sm">如需協助，請聯繫客服</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 加載時顯示的內容
function LoadingFallback() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
        <div className="py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-gray-600">正在載入支付資訊...</p>
        </div>
      </div>
    </div>
  );
}

export default function LinePayCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LinePayCallbackContent />
    </Suspense>
  );
} 
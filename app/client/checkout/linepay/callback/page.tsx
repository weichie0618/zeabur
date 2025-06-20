'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLiff } from '@/lib/LiffProvider';
import Script from 'next/script';

// 定義LIFF ID常量
const LIFF_ID = '2006231077-GmRwevra';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { liff } = useLiff();
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
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);

  // 初始化LIFF
  useEffect(() => {
    // 檢查是否已有liff對象
    if (typeof window !== 'undefined' && window.liff) {
      try {
        if (!window.liff.isReady) {
          console.log('初始化LIFF:', LIFF_ID);
          window.liff.init({
            liffId: LIFF_ID,
            withLoginOnExternalBrowser: true,
          }).then(() => {
            console.log('LIFF初始化成功');
            setIsLiffInitialized(true);
          }).catch((err: Error) => {
            console.error('LIFF初始化失敗:', err);
          });
        } else {
          console.log('LIFF已經初始化');
          setIsLiffInitialized(true);
        }
      } catch (error) {
        console.error('LIFF初始化過程中出錯:', error);
      }
    }
  }, []);

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
        // 檢查是否包含 liff.state 參數
        let orderId = null;
        let orderNo = null;
        let transactionId = null;
        let totalAmount = null;
        
        const liffState = searchParams?.get('liff.state');
        
        if (liffState) {
          // 解碼 liff.state 參數
          const decoded = decodeURIComponent(liffState);
          console.log('解碼後的 liff.state:', decoded);
          
          // 從解碼的字符串中提取參數
          // liff.state 通常格式為 '?param1=value1&param2=value2'
          const stateParams = new URLSearchParams(decoded.startsWith('?') ? decoded.substring(1) : decoded);
          
          orderId = stateParams.get('orderId');
          orderNo = stateParams.get('orderno') || stateParams.get('orderNo');
          transactionId = stateParams.get('transactionId');
          totalAmount = stateParams.get('totalAmount');
        } else {
          // 如果沒有 liff.state，則直接從 URL 獲取
          orderId = searchParams?.get('orderId');
          orderNo = searchParams?.get('orderno');
          transactionId = searchParams?.get('transactionId');
          totalAmount = searchParams?.get('totalAmount');
        }

        console.log('LINE Pay回調參數:', {
          orderId,
          orderNo,
          transactionId,
          totalAmount,
          liffState,
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
          
          // 延遲 1 秒後重定向到 LIFF 確認頁面
          setTimeout(() => {
            const encodedItems = encodeURIComponent(JSON.stringify(data.items || []));
            const pickupDateTimeParam = data.pickupDateTime ? `&pickupDateTime=${data.pickupDateTime}` : '';
            
            // 構建 LIFF URL 和查詢參數
            const queryParams = `?orderNumber=${data.orderNumber}&orderId=${data.orderId}&totalAmount=${data.totalAmount}&items=${encodedItems}&shippingMethod=${data.shippingMethod}&paymentMethod=linepay&shippingFee=${data.shippingFee}${pickupDateTimeParam}`;
            const liffUrl = `https://liff.line.me/${LIFF_ID}/client/checkout/confirmation${queryParams}`;
            console.log('即將導向到 LIFF 確認頁面:', liffUrl);
            
            // 在新窗口打開LIFF URL
           
            window.location.href = liffUrl;
            // 嘗試關閉當前窗口
            setTimeout(() => {
              try {
                window.close();
                
                // 如果窗口未關閉（通常是主窗口），顯示提示消息
                setTimeout(() => {
                  document.getElementById('closeMessage')?.classList.remove('hidden');
                }, 300);
              } catch (error) {
                console.error('關閉窗口失敗', error);
                document.getElementById('closeMessage')?.classList.remove('hidden');
              }
            }, 1000);
          }, 1000);
        } else {
          // 支付失敗
          setStatus('failed');
          setMessage(data.message || '支付處理失敗');
        }
      } catch (error) {
        console.error('處理 LINE Pay 回調時出錯：', error);
        setStatus('failed');
        
        // 提供更詳細的錯誤訊息
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        setMessage(`處理支付過程中發生錯誤：${errorMessage}，請聯繫客服`);
        
        // 檢查API端點是否存在
        fetch('/api/line-pay/confirm', { method: 'HEAD' })
          .then(response => {
            console.log('API端點檢查結果:', response.status, response.statusText);
          })
          .catch(err => {
            console.error('API端點檢查失敗:', err);
          });
      } finally {
        setLoading(false);
      }
    };

    handleLinePayCallback();
  }, [searchParams, router]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
        {loading ? (
          <div className="py-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600">正在處理您的支付...</p>
          </div>
        ) : status === 'success' ? (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">付款成功！</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <div className="mt-6 bg-amber-50 p-4 rounded-lg">
              <p className="text-gray-800">訂單編號: <span className="font-semibold">{orderNumber}</span></p>
              <p className="text-gray-800">總金額: <span className="font-semibold">${totalAmount}</span></p>
            </div>
            <p className="text-gray-500 text-sm mt-6">正在跳轉到訂單確認頁面...</p>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">付款失敗</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            
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
    <>
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js" 
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('LIFF SDK 已載入');
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <LinePayCallbackContent />
      </Suspense>
    </>
  );
}

// 擴展Window介面以支持LIFF
declare global {
  interface Window {
    liff: any;
  }
} 
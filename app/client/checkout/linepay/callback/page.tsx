'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLiff } from '@/lib/LiffProvider';

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

  useEffect(() => {
    const handleLinePayCallback = async () => {
      try {
        setLoading(true);

        // 檢查是否為取消付款
        const cancelled = searchParams.get('cancelled');
        if (cancelled === 'true') {
          setStatus('failed');
          setMessage('您已取消付款');
          setLoading(false);
        
          return;
        }

        // 從 URL 參數獲取交易資訊
        const orderId = searchParams.get('orderId');
        const orderNo = searchParams.get('orderno');
        const transactionId = searchParams.get('transactionId');
        const totalAmount = searchParams.get('totalAmount');

        if (!orderId || !transactionId) {
          setStatus('failed');
          setMessage('缺少必要的參數，無法完成支付確認');
          setLoading(false);
          return;
        }

        // 呼叫後端 API 確認交易
        const response = await fetch(`/api/line-pay/confirm?orderId=${orderId}&transactionId=${transactionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          // 支付成功
          setStatus('success');
          setMessage(data.message || '支付成功');
          setOrderId(data.orderId);
          setOrderNumber(data.orderNumber);
          setTotalAmount(data.totalAmount);
          setItems(data.items || []);
          setShippingMethod(data.shippingMethod || 'takkyubin_payment');
          setShippingFee(data.shippingFee || 0);

          // 清空購物車
          localStorage.removeItem('bakeryCart');

          // 延遲 3 秒後重定向到確認頁面
          setTimeout(() => {
            const encodedItems = encodeURIComponent(JSON.stringify(data.items || []));
            router.push(`/client/checkout/confirmation?orderNumber=${data.orderNumber}&orderId=${data.orderId}&totalAmount=${data.totalAmount}&items=${encodedItems}&shippingMethod=${data.shippingMethod}&paymentMethod=linepay&shippingFee=${data.shippingFee}`);
          }, 1000);
        } else {
          // 支付失敗
          setStatus('failed');
          setMessage(data.message || '支付處理失敗');
        }
      } catch (error) {
        console.error('處理 LINE Pay 回調時出錯：', error);
        setStatus('failed');
        setMessage('處理支付過程中發生錯誤，請聯繫客服');
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
            <div className="mt-6">
              <Link href="/client/checkout" className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 inline-block">
                返回結帳
              </Link>
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
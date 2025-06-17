'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLiff } from '@/lib/LiffProvider';
import Script from 'next/script';

// 訂單項目接口
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  order_item_notes?: string; // 添加口味備註欄位
}

// 訂單接口
interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  shipping_fee?: number;
  items: OrderItem[];
}

// 包裝搜索參數部分以避免直接在組件內使用 useSearchParams
function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const orderId = searchParams.get('orderId');
  const { liff, isLoggedIn, isLoading: liffLoading, profile } = useLiff();
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLineApp, setIsLineApp] = useState<boolean | null>(null);
  const [autoClosing, setAutoClosing] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState(2);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDevEnvironment = process.env.NODE_ENV === 'development';
  // 從URL獲取配送方式
  const shippingMethod = searchParams.get('shippingMethod') || 'takkyubin_payment';
  // 獲取支付方式
  const paymentMethod = searchParams.get('paymentMethod') || 'bank_transfer';
  // 獲取自取日期時間
  const pickupDateTime = searchParams.get('pickupDateTime') || '';
  
  // 格式化日期時間顯示
  const formatPickupDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '未指定';
    try {
      const dt = new Date(dateTimeStr);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } catch (e) {
      console.error('日期格式化錯誤', e);
      return dateTimeStr; // 如果格式化失敗，返回原始字符串
    }
  };

  // 銀行帳戶資訊（這些資訊通常會從設定或API獲取）
  const bankInfo = {
    bankName: '玉山銀行',
    accountName: '屹澧股份有限公司',
    accountNumber: '1322-940-012648',
    bankCode: '808'
  };

  // 從URL參數中獲取訂單詳細信息
  useEffect(() => {
    try {
      setLoading(true);
      let debug = debugInfo + '從URL參數獲取訂單詳細信息...\n';
      
      const totalAmount = searchParams.get('totalAmount');
      const encodedItems = searchParams.get('items');
      const shippingFee = searchParams.get('shippingFee');
      
      if (!orderId || !orderNumber || !totalAmount || !encodedItems) {
        debug += '訂單參數不完整，無法獲取訂單詳細信息\n';
        setDebugInfo(debug);
        setError('訂單參數不完整，請返回重試');
        setLoading(false);
        return;
      }
      
      // 記錄自取日期時間
      if (shippingMethod === 'pickup' && pickupDateTime) {
        debug += `自取日期時間: ${pickupDateTime}\n`;
      }
      
      try {
        // 解析訂單項目JSON
        const decodedItems = JSON.parse(decodeURIComponent(encodedItems));
        
        // 創建訂單對象
        const orderData: Order = {
          id: orderId,
          order_number: orderNumber,
          total_amount: parseFloat(totalAmount),
          items: decodedItems
        };
        
        if (shippingFee) {
          orderData.shipping_fee = parseFloat(shippingFee);
          debug += `運費: ${orderData.shipping_fee}\n`;
        }
        
        setOrderData(orderData);
        
        debug += `訂單詳細信息獲取成功，訂單號: ${orderData.order_number}\n`;
        debug += `訂單總金額: ${orderData.total_amount}\n`;
        debug += `訂單項目數量: ${orderData.items.length}\n`;
        setDebugInfo(debug);
      } catch (parseError: any) {
        debug += `解析訂單數據失敗: ${parseError.message}\n`;
        setDebugInfo(debug);
        setError('訂單數據格式錯誤，請返回重試');
      }
    } catch (error: any) {
      console.error('獲取訂單詳細信息失敗', error);
      setError(error.message || '獲取訂單資料時發生錯誤');
      setDebugInfo(prev => prev + `獲取訂單詳細信息失敗: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  }, [orderId, orderNumber, searchParams]);

  // 手動初始化 LIFF SDK（如果 LiffProvider 失敗）
  useEffect(() => {
    // 只有當 LiffProvider 中的 LIFF 對象不存在，且腳本已載入時才進行手動初始化
    if (!liff && isLiffScriptLoaded && window.liff) {
      let debug = debugInfo + '嘗試手動初始化 LIFF...\n';
      
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';
        if (!liffId) {
          debug += '錯誤: LIFF ID 未設定\n';
          setDebugInfo(debug);
          return;
        }
        
        debug += `使用 LIFF ID: ${liffId}\n`;
        
        window.liff.init({
          liffId: liffId,
        })
        .then(() => {
          debug += '手動 LIFF 初始化成功!\n';
          debug += `LIFF 版本: ${window.liff.getVersion()}\n`;
          debug += `是否在 LINE 應用中: ${window.liff.isInClient() ? '是' : '否'}\n`;
          debug += `登入狀態: ${window.liff.isLoggedIn() ? '已登入' : '未登入'}\n`;
          
          setManualLiff(window.liff);
          setIsLineApp(window.liff.isInClient());
          
          // 如果未登入但在 LINE 中，自動登入
          if (!window.liff.isLoggedIn() && window.liff.isInClient()) {
            debug += '嘗試自動登入...\n';
            window.liff.login();
          }
        })
        .catch((error: any) => {
          debug += `手動 LIFF 初始化失敗: ${error}\n`;
        });
      } catch (error: any) {
        debug += `手動初始化出錯: ${error.message}\n`;
      }
      
      setDebugInfo(debug);
    }
  }, [isLiffScriptLoaded, liff]);

  // 檢查是否在 LINE 應用程式內以及 LIFF 狀態
  useEffect(() => {
    // 添加更多詳細的調試信息
    let debug = '初始化中...\n';
    
    try {
      debug += `LIFF 載入狀態: ${liffLoading ? '載入中' : '已載入'}\n`;
      debug += `LIFF 物件: ${liff ? '存在' : '不存在'}\n`;
      debug += `手動 LIFF 物件: ${manualLiff ? '存在' : '不存在'}\n`;
      debug += `LIFF 腳本: ${isLiffScriptLoaded ? '已載入' : '未載入'}\n`;
      debug += `window.liff: ${typeof window !== 'undefined' && window.liff ? '存在' : '不存在'}\n`;
      
      // 優先使用 LiffProvider 的 liff，如果不存在則使用手動初始化的 liff
      const activeLiff = liff || manualLiff;
      
      if (activeLiff) {
        debug += `LIFF 版本: ${activeLiff.getVersion ? activeLiff.getVersion() : '無法獲取'}\n`;
        debug += `是否在 LINE 應用中: ${activeLiff.isInClient ? (activeLiff.isInClient() ? '是' : '否') : '方法不存在'}\n`;
        debug += `登入狀態: ${(isLoggedIn || (manualLiff && manualLiff.isLoggedIn())) ? '已登入' : '未登入'}\n`;
        
        // 檢查 LIFF 是否具有必要的方法
        debug += `sendMessages 方法: ${activeLiff.sendMessages ? '存在' : '不存在'}\n`;
        debug += `closeWindow 方法: ${activeLiff.closeWindow ? '存在' : '不存在'}\n`;
        
        // 設置是否在 LINE 應用中的狀態
        if (activeLiff.isInClient) {
          const inClient = activeLiff.isInClient();
          setIsLineApp(inClient);
          debug += `已設置 isLineApp 狀態為: ${inClient}\n`;
        }
        
        // 檢查是否需要登入
        if ((!isLoggedIn && !manualLiff?.isLoggedIn?.()) && activeLiff.isInClient && activeLiff.isInClient()) {
          debug += '嘗試登入 LIFF...\n';
          try {
            activeLiff.login();
            debug += '已呼叫 liff.login()\n';
          } catch (loginError) {
            debug += `登入錯誤: ${loginError}\n`;
          }
        }
      } else {
        debug += '無可用的 LIFF 對象，等待載入...\n';
      }
    } catch (error) {
      debug += `初始化檢查錯誤: ${error}\n`;
    }
    
    setDebugInfo(debug);
  }, [liff, liffLoading, isLoggedIn, manualLiff, isLiffScriptLoaded]);

  // 當頁面載入時嘗試發送 LINE 訊息
  useEffect(() => {
    // 防止重複發送
    if (messageSent || sendingMessage) return;
    
    const activeLiff = liff || manualLiff;
    const isActiveLoggedIn = isLoggedIn || (manualLiff && manualLiff.isLoggedIn && manualLiff.isLoggedIn());
    
    // 如果在 LINE 瀏覽器中並且已登入，自動發送訊息
    if (activeLiff && isActiveLoggedIn && orderNumber && !messageSent && 
        activeLiff.isInClient && activeLiff.isInClient() && orderData) {
      let debug = debugInfo + '準備自動發送訊息...\n';
      setDebugInfo(debug);
      
      // 使用一次性計時器避免重複發送
      const timer = setTimeout(() => {
        sendLineMessage();
      }, 1000); // 稍微延遲以確保 LIFF 完全初始化
      
      // 清理計時器
      return () => clearTimeout(timer);
    }
  }, [liff, isLoggedIn, manualLiff, orderData]);

  // 處理自動關閉倒數計時
  useEffect(() => {
    if (autoClosing && closeCountdown > 0) {
      const timer = setTimeout(() => {
        setCloseCountdown(closeCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoClosing && closeCountdown === 0) {
      let debug = debugInfo + '準備關閉視窗...\n';
      setDebugInfo(debug);
      setTimeout(() => {
        handleCloseLiff();
      }, 500);
    }
  }, [autoClosing, closeCountdown, debugInfo]);

  // 發送 LINE 訊息函數
  const sendLineMessage = async () => {
    let debug = debugInfo;
    const activeLiff = liff || manualLiff;
    
    if (!activeLiff) {
      debug += 'LIFF 物件不存在\n';
      setDebugInfo(debug);
      setLiffError('LINE SDK 未正確載入，請重新整理頁面');
      return;
    }
    
    const isActiveLoggedIn = isLoggedIn || (manualLiff && manualLiff.isLoggedIn && manualLiff.isLoggedIn());
    if (!isActiveLoggedIn) {
      debug += '用戶未登入\n';
      setDebugInfo(debug);
      setLiffError('您尚未登入 LINE，請先登入');
      return;
    }
    
    if (!orderNumber) {
      debug += '訂單編號不存在\n';
      setDebugInfo(debug);
      setLiffError('訂單資訊不完整，請返回重試');
      return;
    }
    
    if (!activeLiff.sendMessages) {
      debug += 'sendMessages 方法不存在\n';
      setDebugInfo(debug);
      setLiffError('LINE SDK 缺少發送訊息功能，請確保使用最新版本的 LIFF SDK');
      return;
    }
    
    if (!orderData) {
      debug += '訂單數據不存在，無法構建詳細的 Flex 消息\n';
      setDebugInfo(debug);
      setLiffError('訂單數據不完整，將發送簡單訊息');
    }
    
    try {
      setSendingMessage(true);
      setLiffError(null);
      debug += '開始構建 Flex Message...\n';
      
      // 建立簡單文字訊息（作為備用）
      let textMessage;
      
      // 根據配送方式和付款方式組合，提供對應的訊息
      if (shippingMethod === 'pickup') {
        // 自取訊息
        if (paymentMethod === 'linepay') {
          textMessage = {
            type: 'text',
            text: `🎂 感謝您的訂購！
訂單編號：${orderNumber}
您已使用LINE Pay完成付款
請至桃園市蘆竹區油管路一段696號自取商品

📍 自取地址：
桃園市蘆竹區油管路一段696號

⏰ 預計自取時間：
${formatPickupDateTime(pickupDateTime)}

若有任何問題，請透過LINE與我們聯繫\n謝謝！`
          };
        } else {
          // 取貨時付款
          textMessage = {
            type: 'text',
            text: `🎂 感謝您的訂購！
訂單編號：${orderNumber}
請至桃園市蘆竹區油管路一段696號自取商品並現場付款

📍 自取地址：
桃園市蘆竹區油管路一段696號

⏰ 預計自取時間：
${formatPickupDateTime(pickupDateTime)}

若有任何問題，請透過LINE與我們聯繫\n謝謝！`
          };
        }
      } else if (paymentMethod === 'linepay') {
        // 黑貓宅配 + LINE Pay
        textMessage = {
          type: 'text',
          text: `🎂 感謝您的訂購！
訂單編號：${orderNumber}
您已使用LINE Pay完成付款
我們將盡快安排宅配

📦 宅配說明：
商品會以黑貓宅急便低溫冷凍配送
${orderData?.shipping_fee && orderData.shipping_fee > 0 ? `運費：$${orderData.shipping_fee}` : '免運費'}

若有任何問題，請透過LINE與我們聯繫\n謝謝！`
        };
      } else if (paymentMethod === 'cod') {
        // 黑貓宅配 + 貨到付款
        textMessage = {
          type: 'text',
          text: `🎂 感謝您的訂購！
訂單編號：${orderNumber}
我們將盡快安排宅配，收貨時付款即可

📦 宅配說明：
商品會以黑貓宅急便低溫冷凍配送
${orderData?.shipping_fee && orderData.shipping_fee > 0 ? `運費：$${orderData.shipping_fee}` : '免運費'}
若有任何問題，請透過LINE與我們聯繫\n謝謝！`
        };
      } else {
        // 黑貓宅配 + 匯款
        textMessage = {
          type: 'text',
          text: `🎂 感謝您的訂購！
訂單編號：${orderNumber}
請於3日內完成匯款

🏦 匯款資訊：
銀行：${bankInfo.bankName}（${bankInfo.bankCode}）
戶名：${bankInfo.accountName}
帳號：${bankInfo.accountNumber}
金額：$${orderData?.total_amount || '0'}
${orderData?.shipping_fee && orderData.shipping_fee > 0 ? `運費：$${orderData.shipping_fee}（已含在金額中）` : '免運費'}

完成匯款後，請將匯款收據與訂單編號透過LINE傳送給我們，謝謝！`
        };
      }
      
      // 使用從URL參數獲取的訂單項目
      const orderItems = orderData?.items || [];
      
      // 計算訂單總額
      const totalAmount = orderData?.total_amount || 0;
      
      // 獲取運費信息
      const shippingFee = orderData?.shipping_fee || 0;
      
      debug += `訂單項目數量: ${orderItems.length}\n`;
      debug += `訂單總金額: ${totalAmount}\n`;
      debug += `運費: ${shippingFee}\n`;
      debug += `配送方式: ${shippingMethod}\n`;
      
      // 根據配送方式選擇不同的 Flex Message
      let flexMessage;
      
      if (shippingMethod === 'pickup') {
        // 自取的 Flex Message
        flexMessage = [{
          type: 'text',
          text: orderNumber // 添加普通文字訊息
        },{
          type: "flex",
          altText: paymentMethod === 'linepay' 
            ? `${orderNumber} 建立成功，請至店面自取商品，已用LINE Pay付款` 
            : `${orderNumber} 建立成功，請至店面自取並現場付款`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "訂單已建立 ",
                  size: "xl",
                  align: "center",
                  weight: "bold",
                  color: "#ffffff"
                }
              ],
              backgroundColor: paymentMethod === 'linepay' ? "#06C755" : "#673AB7", // LINE Pay為綠色，取貨時付款為紫色
              paddingAll: "md"
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: paymentMethod === 'linepay' ? "#E6F7ED" : "#EDE7F6",
                  paddingAll: "md",
                  cornerRadius: "md",
                  contents: [
                    {
                      type: "text",
                      text: paymentMethod === 'linepay' 
                        ? "LINE Pay 付款已完成" 
                        : "請於取貨時現場付款",
                      size: "md",
                      weight: "bold",
                      align: "center",
                      color: paymentMethod === 'linepay' ? "#06C755" : "#512DA8",
                      wrap: true
                    }
                  ]
                },
                {
                  type: "separator",
                  margin: "md"
                },
                {
                  type: "text",
                  text: `訂單編號：${orderNumber || "未提供"}`,
                  size: "sm",
                  color: "#333333",
                  margin: "md"
                },
                {
                  type: "text",
                  text: "訂單明細",
                  weight: "bold",
                  color: "#512DA8",
                  margin: "lg",
                  size: "md"
                },
                ...(orderItems.length > 0 ? orderItems.map((item: OrderItem) => ({
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: `${item.product_name.replace(/\r\n/g, '')} x${item.quantity}`,
                          size: "sm",
                          color: "#555555",
                          flex: 5,
                          margin: "sm"
                        },
                        {
                          type: "text",
                          text: `$${item.subtotal}`,
                          size: "sm",
                          align: "end",
                          color: "#111111",
                          flex: 2
                        }
                      ]
                    },
                    // 添加口味備註的顯示
                    ...(item.order_item_notes ? [{
                      type: "text",
                      text: `[口味: ${item.order_item_notes}]`,
                      size: "xs",
                      color: "#888888",
                      margin: "sm",
                      wrap: true
                    }] : [])
                  ]
                })) : [{
                  type: "text",
                  text: "無法獲取訂單明細",
                  size: "sm",
                  color: "#555555",
                  align: "center"
                }]),
                
                // 自取模式 - 運費顯示（如果有運費）
                ...(shippingFee > 0 ? [{
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "運費",
                      size: "sm",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${shippingFee}`,
                      size: "sm",
                      align: "end",
                      color: "#111111"
                    }
                  ]
                }] : []),
                
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "總計",
                      size: "sm",
                      weight: "bold",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${totalAmount}`,
                      size: "sm",
                      align: "end",
                      weight: "bold",
                      color: "#111111"
                    }
                  ]
                },
                
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#EDE7F6",
                  paddingAll: "md",
                  cornerRadius: "md",
                  margin: "lg",
                  contents: [
                    {
                      type: "text",
                      text: "自取地址",
                      weight: "bold",
                      color: "#512DA8",
                      size: "md",
                      align: "center"
                    },
                    {
                      type: "text",
                      text: "桃園市蘆竹區油管路一段696號",
                      size: "sm",
                      color: "#673AB7",
                      align: "center",
                      margin: "sm"
                    },
                    {
                      type: "text",
                      text: "請於取貨時現場付款",
                      size: "sm",
                      color: "#673AB7",
                      align: "center",
                      margin: "sm",
                      weight: "bold"
                    },
                    // 添加自取日期時間顯示
                    {
                      type: "text",
                      text: "預計自取時間",
                      weight: "bold",
                      color: "#512DA8",
                      size: "sm",
                      align: "center",
                      margin: "md"
                    },
                    {
                      type: "text",
                      text: formatPickupDateTime(pickupDateTime),
                      size: "sm",
                      color: "#673AB7",
                      align: "center",
                      margin: "sm",
                      weight: "bold"
                    }
                  ]
                },
                {
                  type: "text",
                  text: "若有任何問題，請透過LINE與我們聯繫\n謝謝！",
                  size: "xs",
                  color: "#888888",
                  align: "center",
                  wrap: true,
                  margin: "md"
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "感謝您的訂購",
                  size: "sm",
                  align: "center",
                  color: "#aaaaaa"
                }
              ]
            }
          }
        }];
      } else if (shippingMethod === 'takkyubin_cod') {
        // 貨到付款的 Flex Message
        flexMessage = [{
          type: 'text',
          text: orderNumber // 添加普通文字訊息
        },{
          type: "flex",
          altText: `訂單編號 ${orderNumber} 建立成功，將安排宅配，收貨時付款`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "訂單已建立",
                  size: "xl",
                  align: "center",
                  weight: "bold",
                  color: "#ffffff"
                }
              ],
              backgroundColor: "#2E7D32",
              paddingAll: "md"
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#E8F5E9",
                  paddingAll: "md",
                  cornerRadius: "md",
                  contents: [
                    {
                      type: "text",
                      text: "請於貨到時付款",
                      size: "md",
                      weight: "bold",
                      align: "center",
                      color: "#2E7D32",
                      wrap: true
                    }
                  ]
                },
                {
                  type: "separator",
                  margin: "md"
                },
                {
                  type: "text",
                  text: `訂單編號：${orderNumber || "未提供"}`,
                  size: "sm",
                  color: "#333333",
                  margin: "md"
                },
                {
                  type: "text",
                  text: "訂單明細",
                  weight: "bold",
                  color: "#33691E",
                  margin: "lg",
                  size: "md"
                },
                ...(orderItems.length > 0 ? orderItems.map((item: OrderItem) => ({
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: `${item.product_name.replace(/\r\n/g, '')} x${item.quantity}`,
                          size: "sm",
                          color: "#555555",
                          flex: 5,
                          margin: "sm"
                        },
                        {
                          type: "text",
                          text: `$${item.subtotal}`,
                          size: "sm",
                          align: "end",
                          color: "#111111",
                          flex: 2
                        }
                      ]
                    },
                    // 添加口味備註的顯示
                    ...(item.order_item_notes ? [{
                      type: "text",
                      text: `[口味: ${item.order_item_notes}]`,
                      size: "xs",
                      color: "#888888",
                      margin: "sm",
                      wrap: true
                    }] : [])
                  ]
                })) : [{
                  type: "text",
                  text: "無法獲取訂單明細",
                  size: "sm",
                  color: "#555555",
                  align: "center"
                }]),
                
                // 貨到付款模式 - 運費顯示（如果有運費）
                ...(shippingFee > 0 ? [{
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "運費",
                      size: "sm",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${shippingFee}`,
                      size: "sm",
                      align: "end",
                      color: "#111111"
                    }
                  ]
                }] : []),
                
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "總計",
                      size: "sm",
                      weight: "bold",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${totalAmount}`,
                      size: "sm",
                      align: "end",
                      weight: "bold",
                      color: "#111111"
                    }
                  ]
                },
                
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#E3F2FD",
                  paddingAll: "md",
                  cornerRadius: "md",
                  margin: "lg",
                  contents: [
                    {
                      type: "text",
                      text: "配送資訊",
                      weight: "bold",
                      color: "#0D47A1",
                      size: "md",
                      align: "center"
                    },
                    {
                      type: "text",
                      text: "商品以黑貓宅急便低溫冷凍配送\n貨到付款",
                      size: "sm",
                      color: "#1976D2",
                      align: "center",
                      margin: "sm",
                      wrap: true
                    }
                  ]
                },
                {
                  type: "text",
                  text: "若有任何問題，請透過LINE與我們聯繫\n謝謝！",
                  size: "xs",
                  color: "#888888",
                  align: "center",
                  wrap: true,
                  margin: "md"
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "感謝您的訂購",
                  size: "sm",
                  align: "center",
                  color: "#aaaaaa"
                }
              ]
            }
          }
        }];
      } else if (paymentMethod === 'linepay') {
        // LINE Pay 的 Flex Message
        flexMessage = [{
          type: 'text',
          text: orderNumber // 添加普通文字訊息
        },{
          type: "flex",
          altText: `訂單編號 ${orderNumber} 建立成功，LINE Pay支付已完成`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "訂單已建立",
                  size: "xl",
                  align: "center",
                  weight: "bold",
                  color: "#ffffff"
                }
              ],
              backgroundColor: "#06C755",  // LINE Pay綠色
              paddingAll: "md"
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#E6F7ED",  // 淺綠色背景
                  paddingAll: "md",
                  cornerRadius: "md",
                  contents: [
                    {
                      type: "text",
                      text: "LINE Pay 付款已完成",
                      size: "md",
                      weight: "bold",
                      align: "center",
                      color: "#06C755",
                      wrap: true
                    }
                  ]
                },
                {
                  type: "separator",
                  margin: "md"
                },
                {
                  type: "text",
                  text: `訂單編號：${orderNumber || "未提供"}`,
                  size: "sm",
                  color: "#333333",
                  margin: "md"
                },
                {
                  type: "text",
                  text: "訂單明細",
                  weight: "bold",
                  color: "#06C755",
                  margin: "lg",
                  size: "md"
                },
                ...(orderItems.length > 0 ? orderItems.map((item: OrderItem) => ({
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: `${item.product_name.replace(/\r\n/g, '')} x${item.quantity}`,
                          size: "sm",
                          color: "#555555",
                          flex: 5,
                          margin: "sm"
                        },
                        {
                          type: "text",
                          text: `$${item.subtotal}`,
                          size: "sm",
                          align: "end",
                          color: "#111111",
                          flex: 2
                        }
                      ]
                    },
                    // 添加口味備註的顯示
                    ...(item.order_item_notes ? [{
                      type: "text",
                      text: `[口味: ${item.order_item_notes}]`,
                      size: "xs",
                      color: "#888888",
                      margin: "sm",
                      wrap: true
                    }] : [])
                  ]
                })) : [{
                  type: "text",
                  text: "無法獲取訂單明細",
                  size: "sm",
                  color: "#555555",
                  align: "center"
                }]),
                
                // LINE Pay模式 - 運費顯示（如果有運費）
                ...(shippingFee > 0 ? [{
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "運費",
                      size: "sm",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${shippingFee}`,
                      size: "sm",
                      align: "end",
                      color: "#111111"
                    }
                  ]
                }] : []),
                
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "總計",
                      size: "sm",
                      weight: "bold",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${totalAmount}`,
                      size: "sm",
                      align: "end",
                      weight: "bold",
                      color: "#111111"
                    }
                  ]
                },
                
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#E6F7ED",
                  paddingAll: "md",
                  cornerRadius: "md",
                  margin: "lg",
                  contents: [
                    {
                      type: "text",
                      text: "配送資訊",
                      weight: "bold",
                      color: "#06C755",
                      size: "md",
                      align: "center"
                    },
                    {
                      type: "text",
                      text: "商品將以黑貓宅急便低溫冷凍配送",
                      size: "sm",
                      color: "#444444",
                      align: "center",
                      margin: "sm",
                      wrap: true
                    }
                  ]
                },
                {
                  type: "text",
                  text: "若有任何問題，請透過LINE與我們聯繫\n謝謝！",
                  size: "xs",
                  color: "#888888",
                  align: "center",
                  wrap: true,
                  margin: "md"
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "感謝您的訂購",
                  size: "sm",
                  align: "center",
                  color: "#aaaaaa"
                }
              ]
            }
          }
        }];
      } else {
        // 預設匯款的 Flex Message (原有的)
        flexMessage =[ {
          type: 'text',
          text: orderNumber // 添加普通文字訊息
        },{
          type: "flex",
          altText: `訂單編號 ${orderNumber} 建立成功，請於3日內完成匯款`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "訂單已建立",
                  size: "xl",
                  align: "center",
                  weight: "bold",
                  color: "#ffffff"
                }
              ],
              backgroundColor: "#A05800",
              paddingAll: "md"
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#FFF3E0",
                  paddingAll: "md",
                  cornerRadius: "md",
                  contents: [
                    {
                      type: "text",
                      text: "請於 3 日內完成匯款",
                      size: "md",
                      weight: "bold",
                      align: "center",
                      color: "#D32F2F",
                      wrap: true
                    }
                  ]
                },
                {
                  type: "separator",
                  margin: "md"
                },
                {
                  type: "text",
                  text: `訂單編號：${orderNumber || "未提供"}`,
                  size: "sm",
                  color: "#333333",
                  margin: "md"
                },
                {
                  type: "text",
                  text: "訂單明細",
                  weight: "bold",
                  color: "#7B3F00",
                  margin: "lg",
                  size: "md"
                },
                ...(orderItems.length > 0 ? orderItems.map((item: OrderItem) => ({
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: `${item.product_name.replace(/\r\n/g, '')} x${item.quantity}`,
                          size: "sm",
                          color: "#555555",
                          flex: 5,
                          margin: "sm"
                        },
                        {
                          type: "text",
                          text: `$${item.subtotal}`,
                          size: "sm",
                          align: "end",
                          color: "#111111",
                          flex: 2
                        }
                      ]
                    },
                    // 添加口味備註的顯示
                    ...(item.order_item_notes ? [{
                      type: "text",
                      text: `[口味: ${item.order_item_notes}]`,
                      size: "xs",
                      color: "#888888",
                      margin: "sm",
                      wrap: true
                    }] : [])
                  ]
                })) : [{
                  type: "text",
                  text: "無法獲取訂單明細",
                  size: "sm",
                  color: "#555555",
                  align: "center"
                }]),
                
                // 匯款模式 - 運費顯示（如果有運費）
                ...(shippingFee > 0 ? [{
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "運費",
                      size: "sm",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${shippingFee}`,
                      size: "sm",
                      align: "end",
                      color: "#111111"
                    }
                  ]
                }] : []),
                
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "總計",
                      size: "sm",
                      weight: "bold",
                      color: "#333333"
                    },
                    {
                      type: "text",
                      text: `$${totalAmount}`,
                      size: "sm",
                      align: "end",
                      weight: "bold",
                      color: "#111111"
                    }
                  ]
                },
                
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "text",
                  text: "匯款資訊",
                  weight: "bold",
                  color: "#7B3F00",
                  margin: "lg",
                  size: "md"
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "銀行名稱",
                          size: "sm",
                          color: "#555555"
                        },
                        {
                          type: "text",
                          text: `${bankInfo.bankName} (${bankInfo.bankCode})`,
                          size: "sm",
                          color: "#111111",
                          align: "end"
                        }
                      ]
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "戶名",
                          size: "sm",
                          color: "#555555"
                        },
                        {
                          type: "text",
                          text: bankInfo.accountName,
                          size: "sm",
                          color: "#111111",
                          align: "end"
                        }
                      ]
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "帳號",
                          size: "sm",
                          color: "#555555"
                        },
                        {
                          type: "text",
                          text: bankInfo.accountNumber,
                          size: "sm",
                          color: "#111111",
                          align: "end"
                        }
                      ]
                    }
                  ]
                },
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "text",
                  text: "匯款完成後請將匯款收據與訂單編號\n傳送給我們（LINE客服）",
                  size: "xs",
                  color: "#888888",
                  align: "center",
                  wrap: true,
                  margin: "md"
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "感謝您的訂購",
                  size: "sm",
                  align: "center",
                  color: "#aaaaaa"
                }
              ]
            }
          }
        }
        ];
      }
      
      debug += '檢查是否在 LINE 應用中...\n';
      
      if (activeLiff.isInClient && activeLiff.isInClient()) {
        debug += '正在 LINE 應用中，嘗試發送訊息...\n';
        
        try {
          // 只發送一則訊息
          debug += '嘗試發送 Flex Message...\n';
          
          // 記錄 FLEX 消息結構以便調試
          debug += '檢查 Flex 消息結構...\n';
          if (orderData && orderData.items) {
            debug += `訂單項目數量: ${orderData.items.length}\n`;
            debug += `首個訂單項目: ${orderData.items[0] ? JSON.stringify(orderData.items[0]) : '無項目'}\n`;
          } else {
            debug += '訂單項目未找到或為空\n';
          }
          
          await activeLiff.sendMessages(flexMessage);
          debug += 'Flex Message 發送成功\n';
          
          setMessageSent(true);
          debug += '設置訊息發送成功狀態\n';
          
          // 設置自動關閉計時器
          setAutoClosing(true);
          debug += '設置自動關閉計時器\n';
        } catch (error: any) {
          console.error('發送LINE訊息失敗', error);
          debug += `訊息發送過程出錯: ${error}\n`;
          setLiffError(`發送訊息失敗：${error.message || '未知錯誤'}`);
        }
      } else {
        debug += '不在 LINE 應用中，無法發送訊息\n';
        setLiffError('您目前不在 LINE 應用程式中，無法自動發送訊息');
      }
    } catch (error: any) {
      console.error('發送LINE訊息失敗', error);
      debug += `訊息發送過程出錯: ${error}\n`;
      setLiffError(`發送訊息失敗：${error.message || '未知錯誤'}`);
    } finally {
      setSendingMessage(false);
      setDebugInfo(debug);
    }
    console.log(debug);
  };

  // 處理關閉 LIFF 視窗（僅在 LINE App 內有效）
  const handleCloseLiff = () => {
    let debug = debugInfo + '執行關閉視窗...\n';
    const activeLiff = liff || manualLiff;
    
    try {
      if (activeLiff && activeLiff.isInClient && activeLiff.isInClient()) {
        debug += '檢測到在 LINE 應用中，嘗試關閉視窗\n';
        
        if (activeLiff.closeWindow) {
          debug += '呼叫 liff.closeWindow()...\n';
          activeLiff.closeWindow();
          debug += 'closeWindow 已呼叫\n';
        } else {
          debug += 'closeWindow 方法不存在\n';
          setLiffError('LIFF SDK 缺少關閉視窗功能');
        }
      } else {
        debug += '不在 LINE 應用中，導向到商店頁面\n';
        router.push('/client/bakery');
      }
    } catch (error: any) {
      debug += `關閉視窗錯誤: ${error}\n`;
      console.error('關閉 LIFF 視窗失敗', error);
      setLiffError(`關閉視窗失敗：${error.message || '未知錯誤'}`);
      // 如果關閉失敗，仍然嘗試導航
      setTimeout(() => {
        router.push('/client/bakery');
      }, 1000);
    }
    
    setDebugInfo(debug);
  };

  // 處理 LIFF 腳本載入完成事件
  const handleLiffScriptLoad = () => {
    setIsLiffScriptLoaded(true);
    setDebugInfo(prev => prev + 'LIFF 腳本載入完成\n');
  };

  // 判斷是否顯示手動 LIFF 發送按鈕
  const shouldShowSendButton = () => {
    const activeLiff = liff || manualLiff;
    const isActiveLoggedIn = isLoggedIn || (manualLiff && manualLiff.isLoggedIn && manualLiff.isLoggedIn());
    
    return false; // 始終返回false，不顯示發送按鈕
  };

  // 判斷是否顯示關閉視窗按鈕
  const shouldShowCloseButton = () => {
    const activeLiff = liff || manualLiff;
    
    return false; // 始終返回false，不顯示關閉按鈕
  };

  // 返回原始的 JSX
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* 加載 LIFF SDK */}
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        onLoad={handleLiffScriptLoad}
      />
      
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600">正在載入訂單資訊...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">載入訂單資訊失敗</h1>
            <p className="text-gray-600 mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">訂單已建立成功！</h1>
              <p className="text-gray-600 mt-2">我們已收到您的訂單，感謝您的購買。</p>
              {profile && (
                <p className="text-gray-600 mt-2">您好，{profile.displayName}</p>
              )}
            </div>

            <div className="border-t border-b py-4 my-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-700">訂單編號</h2>
                  <p className="text-gray-900">{orderNumber || '未提供'}</p>
                </div>
                {/* 配送方式 */}
                <div>
                  <h2 className="font-semibold text-gray-700">配送方式</h2>
                  <p className="text-gray-900">
                    {shippingMethod === 'pickup' ? '自取' : '黑貓宅配(冷凍)'}
                    {shippingMethod === 'pickup' && pickupDateTime && (
                      <span className="block text-xs text-gray-500">預計自取時間: {formatPickupDateTime(pickupDateTime)}</span>
                    )}
                  </p>
                </div>
               
                {/* 運費 */}
                {orderData && orderData.shipping_fee !== null && orderData.shipping_fee !== undefined && orderData.shipping_fee > 0 ? (
                  <div>
                    <h2 className="font-semibold text-gray-700">運費</h2>
                    <p className="text-gray-900">${orderData.shipping_fee}</p>
                  </div>
                ) : null}
                {/* 訂單總額 */}
                <div>
                  <h2 className="font-semibold text-gray-700">訂單總額</h2>
                  <p className="text-gray-900">${orderData?.total_amount || '0'}</p>
                </div>
              </div>
            </div>

            {liffError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-center">
                <p className="text-red-600">{liffError}</p>
              </div>
            )}

            {messageSent && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-center">
                <p className="text-green-700">
                  訂單與匯款資訊已發送至您的LINE！
                  {autoClosing && <span className="ml-2">（{closeCountdown}秒後自動關閉）</span>}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-gray-600 mt-2">此視窗將在數秒後自動關閉</p>
              <p className="text-gray-600 mt-1">如果沒有自動關閉，請手動返回LINE</p>
            </div>
          </>
        )}

        {/* 只在開發環境顯示調試信息 */}
        {isDevEnvironment && (
          <div className="mt-8 p-4 border border-gray-300 rounded-md">
            <h3 className="font-bold mb-2 text-sm">LIFF 調試資訊</h3>
            <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded h-48">
              {debugInfo}
            </pre>
            <div className="mt-2 flex space-x-2 flex-wrap gap-2">
              <button 
                onClick={() => console.log({ liff, manualLiff, profile, isLoggedIn, window: typeof window !== 'undefined' ? window.liff : null })} 
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
              >
                輸出 LIFF 到控制台
              </button>
              <button 
                onClick={sendLineMessage} 
                className="text-xs bg-green-600 text-white px-2 py-1 rounded"
              >
                強制重試發送
              </button>
              <button 
                onClick={handleCloseLiff} 
                className="text-xs bg-red-600 text-white px-2 py-1 rounded"
              >
                強制關閉視窗
              </button>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.liff) {
                    setManualLiff(window.liff);
                    setDebugInfo(prev => prev + '手動設置 LIFF 對象\n');
                  }
                }} 
                className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
              >
                手動獲取 LIFF
              </button>
              <button 
                onClick={() => {
                  console.log('訂單數據:', orderData);
                  const debugStr = `
訂單數據檢查:
- 訂單ID: ${orderData?.id || '未知'}
- 訂單編號: ${orderData?.order_number || '未知'}
- 總金額: ${orderData?.total_amount || '未知'}
- 項目數量: ${orderData?.items?.length || 0}
- 項目數據: ${JSON.stringify(orderData?.items || [])}
                  `;
                  setDebugInfo(prev => prev + debugStr);
                }} 
                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded"
              >
                檢查訂單數據
              </button>
              <button 
                onClick={() => {
                  // 生成FLEX消息結構
                  const orderItems = orderData?.items || [];
                  const totalAmount = orderData?.total_amount || 0;
                  
                  const flexMessage = {
                    type: "flex",
                    altText: `訂單編號 ${orderNumber} 建立成功，請於3日內完成匯款`,
                    contents: {
                      type: "bubble",
                      header: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          {
                            type: "text",
                            text: "訂單已建立",
                            size: "xl",
                            align: "center",
                            weight: "bold",
                            color: "#ffffff"
                          }
                        ],
                        backgroundColor: "#A05800",
                        paddingAll: "md"
                      },
                      body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "md",
                        contents: [
                          {
                            type: "box",
                            layout: "vertical",
                            backgroundColor: "#FFF3E0",
                            paddingAll: "md",
                            cornerRadius: "md",
                            contents: [
                              {
                                type: "text",
                                text: "請於 3 日內完成匯款",
                                size: "md",
                                weight: "bold",
                                align: "center",
                                color: "#D32F2F",
                                wrap: true
                              }
                            ]
                          },
                          {
                            type: "separator",
                            margin: "md"
                          },
                          {
                            type: "text",
                            text: `訂單編號：${orderNumber || "未提供"}`,
                            size: "sm",
                            color: "#333333",
                            margin: "md"
                          },
                          {
                            type: "text",
                            text: "訂單明細",
                            weight: "bold",
                            color: "#7B3F00",
                            margin: "lg",
                            size: "md"
                          },
                          ...(orderItems.length > 0 ? orderItems.map((item: OrderItem) => ({
                            type: "box",
                            layout: "vertical",
                            margin: "md",
                            contents: [
                              {
                                type: "box",
                                layout: "horizontal",
                                contents: [
                                  {
                                    type: "text",
                                    text: `${item.product_name.replace(/\r\n/g, '')} x${item.quantity}`,
                                    size: "sm",
                                    color: "#555555",
                                    flex: 5,
                                    margin: "sm"
                                  },
                                  {
                                    type: "text",
                                    text: `$${item.subtotal}`,
                                    size: "sm",
                                    align: "end",
                                    color: "#111111",
                                    flex: 2
                                  }
                                ]
                              },
                              // 添加口味備註的顯示
                              ...(item.order_item_notes ? [{
                                type: "text",
                                text: `[口味: ${item.order_item_notes}]`,
                                size: "xs",
                                color: "#888888",
                                margin: "sm",
                                wrap: true
                              }] : [])
                            ]
                          })) : [{
                            type: "text",
                            text: "無法獲取訂單明細",
                            size: "sm",
                            color: "#555555",
                            align: "center"
                          }]),
                          {
                            type: "box",
                            layout: "horizontal",
                            margin: "md",
                            contents: [
                              {
                                type: "text",
                                text: "總計",
                                size: "sm",
                                weight: "bold",
                                color: "#333333"
                              },
                              {
                                type: "text",
                                text: `$${totalAmount}`,
                                size: "sm",
                                align: "end",
                                weight: "bold",
                                color: "#111111"
                              }
                            ]
                          },
                          {
                            type: "separator",
                            margin: "lg"
                          },
                          {
                            type: "text",
                            text: "匯款資訊",
                            weight: "bold",
                            color: "#7B3F00",
                            margin: "lg",
                            size: "md"
                          },
                          {
                            type: "box",
                            layout: "vertical",
                            margin: "md",
                            spacing: "sm",
                            contents: [
                              {
                                type: "box",
                                layout: "horizontal",
                                contents: [
                                  {
                                    type: "text",
                                    text: "銀行名稱",
                                    size: "sm",
                                    color: "#555555"
                                  },
                                  {
                                    type: "text",
                                    text: `${bankInfo.bankName} (${bankInfo.bankCode})`,
                                    size: "sm",
                                    color: "#111111",
                                    align: "end"
                                  }
                                ]
                              },
                              {
                                type: "box",
                                layout: "horizontal",
                                contents: [
                                  {
                                    type: "text",
                                    text: "戶名",
                                    size: "sm",
                                    color: "#555555"
                                  },
                                  {
                                    type: "text",
                                    text: bankInfo.accountName,
                                    size: "sm",
                                    color: "#111111",
                                    align: "end"
                                  }
                                ]
                              },
                              {
                                type: "box",
                                layout: "horizontal",
                                contents: [
                                  {
                                    type: "text",
                                    text: "帳號",
                                    size: "sm",
                                    color: "#555555"
                                  },
                                  {
                                    type: "text",
                                    text: bankInfo.accountNumber,
                                    size: "sm",
                                    color: "#111111",
                                    align: "end"
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            type: "separator",
                            margin: "lg"
                          },
                          {
                            type: "text",
                            text: "匯款完成後請將匯款收據與訂單編號\n傳送給我們（LINE客服）",
                            size: "xs",
                            color: "#888888",
                            align: "center",
                            wrap: true,
                            margin: "md"
                          }
                        ]
                      },
                      footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          {
                            type: "text",
                            text: "感謝您的訂購",
                            size: "sm",
                            align: "center",
                            color: "#aaaaaa"
                          }
                        ]
                      }
                    }
                  };
                  
                  // 輸出FLEX消息到控制台
                  console.log('FLEX消息結構:', flexMessage);
                  
                  // 在調試信息中添加記錄
                  setDebugInfo(prev => prev + '\nFLEX消息已輸出到控制台，請查看開發者工具\n');
                }} 
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
              >
                輸出FLEX到控制台
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 主組件使用 Suspense 包裝含有 useSearchParams 的內容
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}

// 為 TypeScript 添加全局 window.liff 定義
declare global {
  interface Window {
    liff: any;
  }
} 
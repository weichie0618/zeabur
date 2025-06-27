'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useLiff } from '@/lib/LiffProvider';

// 包裝搜索參數部分以避免直接在組件內使用 useSearchParams
function VirtualCardConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { liff, isLoggedIn, isLoading: liffLoading, profile } = useLiff();
  
  // 從 URL 參數獲取數據
  const type = searchParams.get('type');
  const totalAmount = searchParams.get('totalAmount');
  const totalPoints = searchParams.get('totalPoints');
  const itemCount = searchParams.get('itemCount');
  const paymentMethod = searchParams.get('paymentMethod');
  
  // 狀態管理
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLineApp, setIsLineApp] = useState<boolean | null>(null);
  const [autoClosing, setAutoClosing] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState(3);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);
  
  const isDevEnvironment = process.env.NODE_ENV === 'development';

  // 格式化數字顯示
  const formatNumber = (num: string | null): string => {
    if (!num) return '0';
    return parseInt(num).toLocaleString();
  };

  // 手動初始化 LIFF SDK
  useEffect(() => {
    if (!liff && isLiffScriptLoaded && typeof window !== 'undefined' && window.liff) {
      let debug = debugInfo + '嘗試手動初始化 LIFF...\n';
      
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '';
        if (!liffId) {
          debug += '錯誤: LIFF ID 未設定\n';
          setDebugInfo(debug);
          setLiffError('LIFF ID 未設定，請檢查環境變數');
          return;
        }
        
        debug += `使用 LIFF ID: ${liffId}\n`;
        
        // 檢查 LIFF 是否已經初始化
        if (window.liff.isReady && window.liff.isReady()) {
          debug += 'LIFF 已經初始化完成\n';
          setManualLiff(window.liff);
          setIsLineApp(window.liff.isInClient());
          setDebugInfo(debug);
          return;
        }
        
        window.liff.init({
          liffId: liffId,
          withLoginOnExternalBrowser: true
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
          
          setDebugInfo(debug);
        })
        .catch((error: any) => {
          debug += `手動 LIFF 初始化失敗: ${error}\n`;
          setDebugInfo(debug);
          setLiffError(`LIFF 初始化失敗: ${error.message}`);
        });
      } catch (error: any) {
        debug += `手動初始化出錯: ${error.message}\n`;
        setDebugInfo(debug);
        setLiffError(`手動初始化出錯: ${error.message}`);
      }
    }
  }, [liff, isLiffScriptLoaded, debugInfo]);

  // 發送 LINE 訊息
  const sendLineMessage = async () => {
    const activeLiff = liff || manualLiff;
    
    if (!activeLiff) {
      setLiffError('LIFF 未初始化');
      return;
    }

    if (!activeLiff.isInClient()) {
      setLiffError('此功能僅在 LINE 應用中可用');
      return;
    }

    if (!activeLiff.isLoggedIn()) {
      setLiffError('請先登入 LINE');
      return;
    }

    setSendingMessage(true);
    
    try {
      // 構建 FLEX 訊息
      const flexMessage = [{
        type: 'text',
        text: `🎉 虛擬點數卡購買成功！`
      }, {
        type: "flex",
        altText: `虛擬點數卡購買確認 - 獲得 ${formatNumber(totalPoints)} 點數`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "購買成功",
                size: "xl",
                align: "center",
                weight: "bold",
                color: "#ffffff"
              }
            ],
            backgroundColor: "#FFB800",  // 金色
            paddingAll: "md"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎁 虛擬點數卡購買完成",
                size: "md",
                weight: "bold",
                margin: "none"
              },
              {
                type: "separator",
                margin: "md"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "購買金額",
                        size: "sm",
                        color: "#666666",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: `NT$ ${formatNumber(totalAmount)}`,
                        size: "sm",
                        weight: "bold",
                        flex: 3,
                        align: "end"
                      }
                    ],
                    spacing: "sm"
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "獲得點數",
                        size: "sm",
                        color: "#666666",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: `${formatNumber(totalPoints)} 點`,
                        size: "sm",
                        weight: "bold",
                        color: "#FFB800",
                        flex: 3,
                        align: "end"
                      }
                    ],
                    spacing: "sm"
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "商品數量",
                        size: "sm",
                        color: "#666666",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: `${formatNumber(itemCount)} 張`,
                        size: "sm",
                        weight: "bold",
                        flex: 3,
                        align: "end"
                      }
                    ],
                    spacing: "sm"
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "付款方式",
                        size: "sm",
                        color: "#666666",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: paymentMethod === 'line_pay' ? 'LINE Pay' : '銀行轉帳',
                        size: "sm",
                        weight: "bold",
                        flex: 3,
                        align: "end"
                      }
                    ],
                    spacing: "sm"
                  }
                ],
                margin: "md",
                spacing: "sm"
              },
              {
                type: "separator",
                margin: "md"
              },
              {
                type: "text",
                text: "💰 點數已自動加入您的帳戶，可立即使用！",
                size: "sm",
                color: "#666666",
                margin: "md",
                wrap: true
              }
            ],
            spacing: "md"
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "查看點數餘額",
                  uri: `${window.location.origin}/client/bakery/points`
                },
                style: "primary",
                color: "#FFB800"
              }
            ]
          }
        }
      }];

      await activeLiff.sendMessages(flexMessage);
      setMessageSent(true);
      
      // 3秒後自動關閉 LIFF
      setTimeout(() => {
        setAutoClosing(true);
        const countdown = setInterval(() => {
          setCloseCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              handleCloseLiff();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 2000);
      
    } catch (error: any) {
      console.error('發送訊息失敗:', error);
      setLiffError(`發送訊息失敗: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  // 關閉 LIFF
  const handleCloseLiff = () => {
    const activeLiff = liff || manualLiff;
    if (activeLiff && activeLiff.closeWindow) {
      try {
        activeLiff.closeWindow();
      } catch (error) {
        console.error('關閉 LIFF 視窗失敗:', error);
        // 如果無法關閉視窗，導航到點數頁面
        router.push('/client/bakery/points');
      }
    } else {
      // 如果不在 LINE 中，導航到點數頁面
      router.push('/client/bakery/points');
    }
  };

  // LIFF 腳本載入完成處理
  const handleLiffScriptLoad = () => {
    console.log('LIFF 腳本載入完成');
    setIsLiffScriptLoaded(true);
  };

  // 檢查是否應該顯示發送按鈕
  const shouldShowSendButton = () => {
    const activeLiff = liff || manualLiff;
    return activeLiff && activeLiff.isInClient && activeLiff.isInClient() && !messageSent;
  };

  // 檢查是否應該顯示關閉按鈕
  const shouldShowCloseButton = () => {
    const activeLiff = liff || manualLiff;
    return activeLiff && activeLiff.isInClient && activeLiff.isInClient() && messageSent;
  };

  // 驗證必要參數
  if (type !== 'virtual_card' || !totalAmount || !totalPoints) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">頁面參數錯誤</h3>
            <p className="text-red-700 mb-4">無法顯示購買確認資訊</p>
            <Link 
              href="/client/bakery/points" 
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              返回點數頁面
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        onLoad={handleLiffScriptLoad}
      />
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 成功訊息 */}
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-900 mb-2">購買成功！</h1>
            <p className="text-green-700">您的虛擬點數卡已成功下訂，請等待核帳完成後點數將自動入帳</p>
          </div>
        </div>

        {/* 購買詳情 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">購買詳情</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">購買金額</span>
              <span className="text-xl font-bold text-gray-900">NT$ {formatNumber(totalAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">獲得點數</span>
              <span className="text-xl font-bold text-amber-600">{formatNumber(totalPoints)} 點</span>
            </div>
            
           
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">付款方式</span>
              <span className="text-lg font-medium text-gray-900">
                {paymentMethod === 'line_pay' ? 'LINE Pay' : '銀行轉帳'}
              </span>
            </div>
          </div>
        </div>

        {/* 點數餘額提醒 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-amber-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <div>
              <h3 className="font-medium text-amber-900 mb-1">點數已下訂</h3>
              <p className="text-amber-800 text-sm">
                您購買的 {formatNumber(totalPoints)} 點數已下訂，請等待核帳完成後點數將自動入帳。
                點數無使用期限，請安心使用！
              </p>
            </div>
          </div>
        </div>

        {/* 調試資訊 (僅開發環境) */}
        {isDevEnvironment && debugInfo && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">調試資訊</h3>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}

        {/* 錯誤訊息 */}
        {liffError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{liffError}</span>
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="space-y-4">
          {/* 發送 LINE 訊息按鈕 */}
          {shouldShowSendButton() && (
            <button
              onClick={sendLineMessage}
              disabled={sendingMessage}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                sendingMessage
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg'
              }`}
            >
              {sendingMessage ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  發送中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
                  </svg>
                  傳送至 LINE 聊天室
                </div>
              )}
            </button>
          )}

          {/* 關閉按鈕 (訊息發送後顯示) */}
          {shouldShowCloseButton() && (
            <button
              onClick={handleCloseLiff}
              disabled={autoClosing}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                autoClosing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
              }`}
            >
              {autoClosing ? (
                `自動關閉中... (${closeCountdown}s)`
              ) : (
                '關閉視窗'
              )}
            </button>
          )}

          {/* 查看點數餘額按鈕 */}
          <Link
            href="/client/bakery/points"
            className="block w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-center transition-colors"
          >
            查看點數餘額
          </Link>

        
        </div>

        {/* 使用說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            點數使用說明
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              點數可在購物結帳時直接折抵現金
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              1 點數 = 1 元新台幣
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              點數無使用期限，請安心使用
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              可在「點數頁面」查看詳細的交易記錄
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default function VirtualCardConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      <VirtualCardConfirmationContent />
    </Suspense>
  );
}

// 擴展 Window 介面以支援 LIFF
declare global {
  interface Window {
    liff: any;
  }
} 
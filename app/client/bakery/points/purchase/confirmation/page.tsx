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
  const orderNumber = searchParams.get('orderNumber');
  
  // 狀態管理
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendCountdown, setSendCountdown] = useState(3); // 發送訊息的倒計時
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLineApp, setIsLineApp] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [manualLiff, setManualLiff] = useState<any>(null);
  const [isLiffScriptLoaded, setIsLiffScriptLoaded] = useState(false);
  
  const isDevEnvironment = process.env.NODE_ENV === 'development';

  // 銀行帳戶資訊
  const bankInfo = {
    bankName: '玉山銀行',
    accountName: '屹澧股份有限公司',
    accountNumber: '1322-940-012648',
    bankCode: '808'
  };

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

  // 自動開始倒計時和發送訊息
  useEffect(() => {
    const activeLiff = liff || manualLiff;
    
    // 檢查 LIFF 是否就緒且在 LINE 應用中
    if (activeLiff && activeLiff.isInClient && activeLiff.isInClient() && 
        activeLiff.isLoggedIn && activeLiff.isLoggedIn() && !messageSent && !sendingMessage) {
      
      // 自動開始發送流程
      setTimeout(() => {
        sendLineMessage();
      }, 1000); // 1秒後自動開始
    }
  }, [liff, manualLiff, messageSent, sendingMessage]);

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
    
    // 啟動倒計時
    const countdownInterval = setInterval(() => {
      setSendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // 3秒後發送訊息
    setTimeout(async () => {
      try {
        await sendMessagesWithDelay();
      } catch (error: any) {
        console.error('發送訊息失敗:', error);
        setLiffError(`發送訊息失敗: ${error.message}`);
      } finally {
        setSendingMessage(false);
        setSendCountdown(3); // 重置倒計時
      }
    }, 3000);
  };

  // 實際發送訊息的函數
  const sendMessagesWithDelay = async () => {
    const activeLiff = liff || manualLiff;
    
    try {
      // 構建 FLEX 訊息
      const flexMessage = [{
        type: 'text',
        text: `points-#${orderNumber}`
      }, {
        type: "flex",
        altText: paymentMethod === 'bank_transfer' 
          ? `點數卡訂單確認 - 待匯款 ${formatNumber(totalPoints)} 點數`
          : `點數卡購買確認 - 獲得 ${formatNumber(totalPoints)} 點數`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "購買點數",
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
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "💰 購買詳情",
                    size: "lg",
                    weight: "bold",
                    color: "#2D3748",
                    margin: "none"
                  }
                ],
                backgroundColor: "#F7FAFC",
                paddingAll: "md",
                cornerRadius: "8px",
                margin: "none"
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
                        size: "md",
                        color: "#4A5568",
                        flex: 3,
                        weight: "bold"
                      },
                      {
                        type: "text",
                        text: `NT$ ${formatNumber(totalAmount)}`,
                        size: "lg",
                        weight: "bold",
                        color: "#2D3748",
                        flex: 4,
                        align: "end"
                      }
                    ],
                    spacing: "md"
                  },
                  {
                    type: "separator",
                    margin: "md",
                    color: "#E2E8F0"
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "獲得點數",
                        size: "md",
                        color: "#4A5568",
                        flex: 3,
                        weight: "bold"
                      },
                      {
                        type: "text",
                        text: `+${formatNumber(totalPoints)} 點`,
                        size: "xl",
                        weight: "bold",
                        color: "#FF6B35",
                        flex: 4,
                        align: "end"
                      }
                    ],
                    spacing: "md"
                  },
                  {
                    type: "separator",
                    margin: "md",
                    color: "#E2E8F0"
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: "付款方式",
                        size: "md",
                        color: "#4A5568",
                        flex: 3,
                        weight: "bold"
                      },
                      {
                        type: "text",
                        text: paymentMethod === 'line_pay' ? 'LINE Pay' : '銀行轉帳',
                        size: "md",
                        weight: "bold",
                        color: "#2D3748",
                        flex: 4,
                        align: "end"
                      }
                    ],
                    spacing: "md"
                  }
                ],
                margin: "lg",
                spacing: "md",
                paddingAll: "md",
                backgroundColor: "#FFFFFF",
                cornerRadius: "8px"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: paymentMethod === 'bank_transfer' 
                      ? "✨ 點數將於核帳完成後自動加入帳戶！" 
                      : "✨ 點數已自動加入您的帳戶，可立即使用！",
                    size: "sm",
                    color: "#38A169",
                    margin: "none",
                    wrap: true,
                    weight: "bold",
                    align: "center"
                  }
                ],
                margin: "lg",
                paddingAll: "md",
                backgroundColor: "#F0FFF4",
                cornerRadius: "8px"
              },
              // 當付款方式為銀行轉帳時，顯示銀行資訊
              ...(paymentMethod === 'bank_transfer' ? [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "🏦 匯款資訊",
                      weight: "bold",
                      color: "#2D3748",
                      margin: "none",
                      size: "lg"
                    }
                  ],
                  backgroundColor: "#FFF5E6",
                  paddingAll: "md",
                  cornerRadius: "8px",
                  margin: "lg"
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "md",
                  paddingAll: "md",
                  backgroundColor: "#FFFFFF",
                  cornerRadius: "8px",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "text",
                          text: "銀行名稱",
                          size: "md",
                          color: "#4A5568",
                          flex: 3,
                          weight: "bold"
                        },
                        {
                          type: "text",
                          text: `${bankInfo.bankName} (${bankInfo.bankCode})`,
                          size: "md",
                          weight: "bold",
                          color: "#2D3748",
                          flex: 4,
                          align: "end"
                        }
                      ],
                      spacing: "md"
                    },
                    {
                      type: "separator",
                      margin: "md",
                      color: "#E2E8F0"
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "text",
                          text: "戶名",
                          size: "md",
                          color: "#4A5568",
                          flex: 3,
                          weight: "bold"
                        },
                        {
                          type: "text",
                          text: bankInfo.accountName,
                          size: "md",
                          weight: "bold",
                          color: "#2D3748",
                          flex: 4,
                          align: "end"
                        }
                      ],
                      spacing: "md"
                    },
                    {
                      type: "separator",
                      margin: "md",
                      color: "#E2E8F0"
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "text",
                          text: "帳號",
                          size: "md",
                          color: "#4A5568",
                          flex: 3,
                          weight: "bold"
                        },
                        {
                          type: "text",
                          text: bankInfo.accountNumber,
                          size: "md",
                          weight: "bold",
                          color: "#E53E3E",
                          flex: 4,
                          align: "end"
                        }
                      ],
                      spacing: "md"
                    }
                  ]
                }
              ] : [])
            ],
            spacing: "md",
            paddingAll: "lg"
          },
          ...(paymentMethod === 'bank_transfer' ? {
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "請於 3 日內完成匯款",
                  size: "md",
                  color: "#888888",
                  align: "center",
                  wrap: true
                },
                {
                  type: "text",
                  text: "並將訊息傳送給我們",
                  size: "md",
                  color: "#888888",
                  align: "center",
                  wrap: true,
                  margin: "xs"
                }
              ],
              backgroundColor: "#F8F9FA",
              paddingAll: "md"
            }
          } : {}),
          
        }
      }];

      await activeLiff.sendMessages(flexMessage);
      setMessageSent(true);
      
      // 訊息發送成功後立即關閉 LIFF
      setTimeout(() => {
        handleCloseLiff();
      }, 1000); // 1秒後關閉
      
    } catch (error: any) {
      console.error('發送訊息失敗:', error);
      setLiffError(`發送訊息失敗: ${error.message}`);
      throw error; // 重新拋出錯誤給上層處理
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
            <h1 className="text-2xl font-bold text-green-900 mb-2">
              {paymentMethod === 'bank_transfer' ? '訂單確認！' : '購買成功！'}
            </h1>
            <p className="text-green-700">
              {paymentMethod === 'bank_transfer' 
                ? '您的點數卡訂單已確認，請於 3 日內完成匯款，核帳完成後點數將自動入帳'
                : '您的點數卡已成功下訂，請等待核帳完成後點數將自動入帳'
              }
            </p>
          </div>
        </div>


        {/* 操作按鈕 */}
        <div className="space-y-4">
          {/* 自動發送狀態顯示 */}
          {shouldShowSendButton() && (
            <div className="w-full py-3 px-4 bg-blue-200 text-white rounded-lg font-medium text-center">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {sendingMessage ? (
                  sendCountdown > 0 ? `${sendCountdown}秒後將資訊傳到 LINE` : '正在傳送到 LINE...'
                ) : (
                  '準備自動傳送到 LINE...'
                )}
              </div>
            </div>
          )}

          {/* 自動關閉狀態顯示 */}
          {messageSent && (
            <div className="w-full py-3 px-4 bg-green-200 text-white rounded-lg font-medium text-center">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                訊息已傳送，即將自動關閉...
              </div>
            </div>
          )}

        

        
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


        {/* 銀行轉帳資訊 (僅當付款方式為銀行轉帳時顯示) */}
        {paymentMethod === 'bank_transfer' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              匯款資訊
            </h3>
            
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">銀行名稱</span>
                <span className="font-medium text-gray-900">{bankInfo.bankName} ({bankInfo.bankCode})</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">戶名</span>
                <span className="font-medium text-gray-900">{bankInfo.accountName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">帳號</span>
                <span className="font-medium text-gray-900 font-mono">{bankInfo.accountNumber}</span>
              </div>
            </div>
            
            
          </div>
        )}

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
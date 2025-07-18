'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSalesperson } from '../context/SalespersonContext';
import { QRCodeSVG } from 'qrcode.react';
import liff from '@line/liff';

export default function QRCodePage() {
  const { salesperson, storeId } = useSalesperson();
  const [lineUrl, setLineUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const qrRef = useRef(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        if (!window.liff) {
          setLiffError('LIFF SDK 尚未載入');
          return;
        }

        if (!window.liff.isLoggedIn()) {
          await window.liff.login();
        }

        setIsLiffReady(true);
      } catch (error) {
        console.error('LIFF 初始化失敗:', error);
        setLiffError('LIFF 初始化失敗');
      }
    };

    initializeLiff();
  }, []);

  useEffect(() => {
    if (storeId) {
      const url = `https://line.me/R/app/2006231077-Add1OBJ8?services=${storeId}`;
      setLineUrl(url);
    }
  }, [storeId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lineUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  // 創建精美的 Flex 訊息
  const createPromotionFlexMessage = () => {
    return {
      type: "flex" as const,
      altText: "晴朗家烘焙麵包",
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "晴朗家烘焙麵包訂購",
              color: "#ffffff",
              align: "center",
              size: "xl",
              gravity: "center",
              weight: "bold"
            }
          ],
          backgroundColor: "#E4A853",
          paddingAll: "10px"
        },
        hero: {
          type: "image",
          url: "https://i.ibb.co/5WLJ6sNk/LINE-ALBUM-2025-1-17-1-250117-7-2-1.jpg",
          size: "full",
          aspectRatio: "20:8",
          aspectMode: "cover"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "晴朗家烘焙邀請您",
              weight: "bold",
              size: "lg",
              color: "#8B4513",
              align: "center",
              margin: "md"
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
                  type: "text",
                  text: "🥖 精選烘焙商品",
                  size: "md",
                  color: "#C87941"
                },
                {
                  type: "text",
                  text: "💰 會員點數回饋",
                  size: "md",
                  color: "#C87941",
                  margin: "sm"
                },
                {
                  type: "text",
                  text: "🚚 低溫配送服務",
                  size: "md",
                  color: "#C87941",
                  margin: "sm"
                }
              ],
              margin: "lg",
              spacing: "md"
            },
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#FFF8E1",
              cornerRadius: "md",
              paddingAll: "10px",
              contents: [
                {
                  type: "text",
                  text: "限時優惠",
                  weight: "bold",
                  color: "#D14C32",
                  align: "center",
                  size: "lg"
                },
                {
                  type: "text",
                  text: "新用戶首單 95 折優惠\n折扣碼：SUNNY888",
                  wrap: true,
                  size: "sm",
                  color: "#5C3A1E",
                  align: "center",
                  margin: "sm"
                }
              ],
              margin: "sm"
            }
          ],
          paddingBottom: "md",
          spacing: "md"
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              color: "#E4A853",
              action: {
                type: "uri",
                label: "來去看看",
                uri: lineUrl
              }
            }
          ],
          spacing: "sm"
        },
        styles: {
          footer: {
            separator: true
          }
        }
      }
    };
  };

  const sendToLineChat = async () => {
    if (!isLiffReady) {
      alert('LIFF 尚未準備就緒，請稍後再試');
      return;
    }

    try {
      // 檢查是否在 LINE 環境中
      if (!liff.isInClient()) {
        alert('此功能需要在 LINE APP 中使用');
        return;
      }

      if (!lineUrl) {
        alert('推廣連結尚未生成');
        return;
      }

      // 使用 QR Server API
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(lineUrl)}&size=300x300`;
      
      try {
        // 發送訊息
        await liff.sendMessages([
          {
            type: 'image',
            originalContentUrl: qrImageUrl,
            previewImageUrl: qrImageUrl
          },
          {
            type: 'text',
            text: `晴朗家麵包：
            ${lineUrl}`
          }
        ]);
        
        alert('已成功發送到 LINE 聊天室！');
      } catch (error) {
        console.error('發送失敗:', error);
        alert('發送失敗，請稍後再試');
      }
    } catch (err) {
      console.error('發送失敗:', err);
      alert('發送失敗，請確認是否在 LINE APP 中使用');
    }
  };

  const shareToFriends = async () => {
    if (!isLiffReady) {
      alert('LIFF 尚未準備就緒，請稍後再試');
      return;
    }

    try {
      // 檢查是否支援分享功能
      if (!liff.isApiAvailable('shareTargetPicker')) {
        alert('此裝置不支援分享功能');
        return;
      }

      const flexMessage = createPromotionFlexMessage();
      
      // 執行分享
      const result = await liff.shareTargetPicker([flexMessage as any]);
      
      if (result) {
        alert('已成功分享！');
      } else {
        alert('分享已取消');
      }
    } catch (error) {
      console.error('分享失敗:', error);
      if (!liff.isInClient()) {
        alert('請在 LINE APP 中使用此功能');
      } else {
        alert('分享失敗，請稍後再試');
      }
    }
  };

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {liffError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-medium">錯誤</p>
          <p className="text-sm">{liffError}</p>
        </div>
      )}

      {/* 頁面標題 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">專屬 QR Code</h1>
        <p className="text-gray-600">
          您的專屬推廣 QR Code
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code 顯示區 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            {lineUrl ? (
              <div className="space-y-4">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <QRCodeSVG
                    ref={qrRef}
                    value={lineUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={sendToLineChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    📤 QR Code傳送到LINE
                  </button>
                  <button
                    onClick={shareToFriends}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    👥 分享給好友
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">生成 QR Code 中...</div>
              </div>
            )}
          </div>
        </div>

        {/* 連結資訊區 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">連結資訊</h2>
          
          <div className="space-y-4">
            {/* LINE 連結 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LINE 推廣連結
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={lineUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 border border-l-0 border-gray-300 rounded-r-lg text-sm font-medium transition-colors ${
                    copied 
                      ? 'bg-green-50 text-green-700 border-green-300' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {copied ? '已複製' : '複製'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                您也可以直接分享此連結給客戶
              </p>
            </div>

            {/* 分享功能說明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分享功能說明
              </label>
              <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
                <ul className="space-y-1">
                  <li>• 📤 傳送到LINE：將QR Code發送到您的LINE聊天室</li>
                  <li>• 👥 分享給好友：使用精美的Flex訊息分享給LINE好友</li>
                  <li>• 🎨 Flex訊息包含您的專屬推廣連結和聯絡資訊</li>
                  <li>• 🔗 好友點擊按鈕即可直接綁訂您的資訊</li>
                </ul>
              </div>
            </div>

            {/* 使用說明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用說明
              </label>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <ul className="space-y-1">
                  <li>• 客戶掃描 QR Code 後會自動開啟 LINE</li>
                  <li>• 系統會自動將客戶串聯到您的帳號</li>
                  <li>• 所有透過此連結產生的訂單都會計入您的業績</li>
                 
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
} 
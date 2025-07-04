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
      if (!qrRef.current) return;
      
      const svg = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
        
        const imageData = canvas.toDataURL("image/png");
        
        try {
          await liff.sendMessages([
            {
              type: 'image',
              originalContentUrl: imageData,
              previewImageUrl: imageData
            },
            {
              type: 'text',
              text: `推廣連結：${lineUrl}`
            }
          ]);
          alert('已成功發送到LINE聊天室！');
        } catch (error) {
          console.error('發送到LINE失敗:', error);
          alert('發送失敗，請稍後再試');
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('處理QR Code失敗:', err);
      alert('發送失敗，請稍後再試');
    }
  };

  const shareToFriends = async () => {
    if (!isLiffReady) {
      alert('LIFF 尚未準備就緒，請稍後再試');
      return;
    }

    try {
      const flexMessage = createPromotionFlexMessage();
      
      if (liff.isApiAvailable('shareTargetPicker')) {
        await liff.shareTargetPicker([flexMessage as any]);
        alert('已成功分享給好友！');
      } else {
        alert('此功能需要在LINE應用程式中使用');
      }
    } catch (error) {
      console.error('分享失敗:', error);
      alert('分享失敗，請稍後再試');
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
                  <li>• 🔗 好友點擊按鈕即可直接進入購買頁面</li>
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
                  <li>• 建議在名片或宣傳資料上印製此 QR Code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">注意事項</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>分享功能需要在LINE應用程式中使用才能正常運作</li>
                <li>如發現異常使用情況，請立即聯絡系統管理員</li>
                <li>請確保您的聯絡資訊正確，以便客戶能夠聯繫您</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
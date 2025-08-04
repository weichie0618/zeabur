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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingToImgBB, setIsUploadingToImgBB] = useState(false);
  // 新增 modal 相關狀態
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const qrRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // 生成底圖 + QR Code 的合成圖片
  const generateCompositeImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('系統異常，請稍後再試'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('系統異常，請稍後再試'));
          return;
        }

        // 設定超時
        const timeout = setTimeout(() => {
          reject(new Error('系統異常，請稍後再試'));
        }, 15000); // 15秒超時

        // 載入底圖
        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';
        
        baseImage.onload = () => {
          try {
            // 設定 Canvas 尺寸為底圖尺寸
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            
            // 繪製底圖
            ctx.drawImage(baseImage, 0, 0);

            // 使用 QR Server API 生成 QR Code 圖片
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(lineUrl)}&size=200x200&format=png&margin=2&color=000000&bgcolor=FFFFFF`;
            
            const qrImage = new Image();
            qrImage.crossOrigin = 'anonymous';
            
            qrImage.onload = () => {
              try {
                // 計算 QR Code 位置（正中間偏上）
                const qrSize = Math.min(190, canvas.width * 0.3); // QR Code 最大 190px 或底圖寬度的 30%
                const qrX = (canvas.width - qrSize) / 2; // 水平置中
                const qrY = (canvas.height - qrSize) / 2 - 210; // 垂直置中偏上 210px
                
                // 繪製 QR Code
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                
                // 轉換為 base64
                const dataUrl = canvas.toDataURL('image/png', 0.9);
                clearTimeout(timeout);
                resolve(dataUrl);
                             } catch (error) {
                 clearTimeout(timeout);
                 reject(new Error('QR Code 繪製失敗: ' + (error instanceof Error ? error.message : '未知錯誤')));
               }
            };
            
            qrImage.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('系統異常，請稍後再試'));
            };
            
            qrImage.src = qrImageUrl;
                     } catch (error) {
             clearTimeout(timeout);
             reject(new Error('底圖處理失敗: ' + (error instanceof Error ? error.message : '未知錯誤')));
           }
        };
        
        baseImage.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('系統異常，請稍後再試'));
        };
        
        // 載入底圖
        baseImage.src = '/bakery/images/thbs9-98unc.jpg';
        
      } catch (error) {
        reject(error);
      }
    });
  };

  // 上傳圖片到本地伺服器
  const uploadToLocalServer = async (imageDataUrl: string, retryCount = 0): Promise<string> => {
    const maxRetries = 2;
    
    try {
      // 將 base64 轉換為純 base64 字串（移除 data:image/jpeg;base64, 前綴）
      const base64Data = imageDataUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('系統異常，請稍後再試');
      }

      console.log(`📤 開始上傳到本地伺服器... (嘗試 ${retryCount + 1}/${maxRetries + 1})`);
      
      // 將 base64 轉換為二進制數據
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // 創建 blob
      const jpegBlob = new Blob([bytes], { type: 'image/jpeg' });
      console.log('📤 Blob 創建成功，大小:', jpegBlob.size, 'bytes');
      
      if (jpegBlob.size === 0) {
        throw new Error('生成的圖片文件為空');
      }
      
      // 生成檔案名稱
      const fileName = `qrcode_${storeId}_${Date.now()}.jpg`;
      
      console.log('📤 準備上傳，檔案名稱:', fileName);
      
      // 建立 FormData
      const formData = new FormData();
      formData.append('file', jpegBlob, fileName);
      formData.append('destination', 'uploads/qrcode');
      
      // 上傳到伺服器
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // 使用 HttpOnly Cookie 認證
        signal: AbortSignal.timeout(30000) // 30秒超時
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('上傳錯誤回應:', errorText);
        throw new Error('系統異常，請稍後再試');
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('✅ 本地上傳成功:', uploadResult);
      
      if (uploadResult.success && uploadResult.filePath) {
        // 返回完整的 URL
        const fullUrl = `${window.location.origin}${uploadResult.filePath}`;
        console.log('✅ 完整圖片 URL:', fullUrl);
        return fullUrl;
      } else {
        throw new Error('系統異常，請稍後再試');
      }
      
    } catch (error) {
      console.error(`本地上傳失敗 (嘗試 ${retryCount + 1}):`, error);
      
      // 如果是超時錯誤或網路錯誤，且還有重試次數，則重試
      if (retryCount < maxRetries && (
        error instanceof Error && (
          error.name === 'TimeoutError' || 
          error.message.includes('fetch') ||
          error.message.includes('network')
        )
      )) {
        console.log(`🔄 重試上傳... (${retryCount + 1}/${maxRetries})`);
        // 等待 2 秒後重試
        await new Promise(resolve => setTimeout(resolve, 2000));
        return uploadToLocalServer(imageDataUrl, retryCount + 1);
      }
      
      // 統一錯誤訊息
      throw new Error('系統異常，請稍後再試');
    }
  };

  // 生成並上傳合成圖片，然後傳送到 LINE
  const generateAndSendCompositeImage = async () => {
    if (!isLiffReady) {
      alert('LIFF 尚未準備就緒，請稍後再試');
      return;
    }

    if (!liff.isInClient()) {
      alert('此功能需要在 LINE APP 中使用');
      return;
    }

    if (!lineUrl) {
      alert('推廣連結尚未生成');
      return;
    }

    try {
      // 顯示處理中 modal
      setShowProcessingModal(true);
      setProcessingStep('準備中');
      setProcessingMessage('正在初始化圖片生成流程...');
      setIsGeneratingImage(true);
      
      // 1. 生成合成圖片
      setProcessingStep('生成圖片');
      setProcessingMessage('正在生成精美的推廣文宣圖片...');
      console.log('🖼️ 開始生成合成圖片...');
      const compositeImageDataUrl = await generateCompositeImage();
      console.log('✅ 合成圖片生成完成');
      
      setIsGeneratingImage(false);
      setIsUploadingToImgBB(true);
      
      // 2. 上傳到 ImgBB
      setProcessingStep('上傳圖片');
      setProcessingMessage('正在上傳圖片到雲端儲存空間...');
      console.log('📤 開始上傳到 ImgBB...');
      
      // 監聽上傳進度
      let uploadAttempt = 0;
      const updateUploadMessage = () => {
        uploadAttempt++;
        if (uploadAttempt > 1) {
          setProcessingMessage(`正在重試上傳圖片... (第 ${uploadAttempt} 次嘗試)`);
        }
      };
      
      let imageUrl;
      try {
        imageUrl = await uploadToLocalServer(compositeImageDataUrl);
        console.log('✅ 本地上傳完成:', imageUrl);
      } catch (uploadError) {
        console.error('本地上傳失敗:', uploadError);
        setProcessingMessage('系統異常，請稍後再試');
        
        // 延遲關閉 modal，讓使用者看到錯誤訊息
        setTimeout(() => {
          setShowProcessingModal(false);
          setProcessingStep('');
          setProcessingMessage('');
        }, 3000);
        
        // 拋出錯誤，停止後續流程
        throw new Error('系統異常，請稍後再試');
      }
      
      setIsUploadingToImgBB(false);
      
      // 3. 使用 LIFF 傳送圖片
      setProcessingStep('發送訊息');
      setProcessingMessage('正在發送圖片到 LINE 聊天室...');
      console.log('📱 開始傳送到 LINE...');
      await liff.sendMessages([
        {
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl
        }
      ]);
      
      // 完成處理
      setProcessingStep('完成');
      setProcessingMessage('圖片已成功發送到 LINE！');
      
      // 延遲關閉 modal，讓使用者看到完成訊息
      setTimeout(() => {
        setShowProcessingModal(false);
        setProcessingStep('');
        setProcessingMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('❌ 處理失敗:', error);
      setIsGeneratingImage(false);
      setIsUploadingToImgBB(false);
      
      // 顯示統一的錯誤訊息
      setProcessingStep('錯誤');
      setProcessingMessage('系統異常，請稍後再試');
      
      // 延遲關閉 modal
      setTimeout(() => {
        setShowProcessingModal(false);
        setProcessingStep('');
        setProcessingMessage('');
      }, 3000);
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

      {/* 隱藏的 Canvas 用於圖片合成 */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />

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
                    onClick={generateAndSendCompositeImage}
                    disabled={isGeneratingImage || isUploadingToImgBB}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      isGeneratingImage || isUploadingToImgBB
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isGeneratingImage ? '🖼️ 生成圖片中...' : 
                     isUploadingToImgBB ? '📤 上傳中...' : 
                     '🎨 生成推廣文宣圖片'}
                  </button>
                  
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
   
      {/* 處理中 Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* 動態載入動畫 */}
              <div className="mb-6">
                {processingStep === '完成' ? (
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : processingStep === '錯誤' ? (
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-600 border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              {/* 步驟標題 */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {processingStep === '完成' ? '🎉 處理完成' : 
                 processingStep === '錯誤' ? '❌ 處理失敗' : 
                 '🔄 正在處理...'}
              </h3>
              
              {/* 步驟說明 */}
              <p className="text-base text-gray-700 mb-6 leading-relaxed">
                {processingMessage}
              </p>
              
              {/* 進度指示器 */}
              {processingStep !== '完成' && processingStep !== '錯誤' && (
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-3">
                    {/* 步驟 1: 準備中 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        processingStep === '準備中' 
                          ? 'bg-purple-600 text-white scale-110' 
                          : processingStep === '生成圖片' || processingStep === '上傳圖片' || processingStep === '發送訊息'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {processingStep === '準備中' || processingStep === '生成圖片' || processingStep === '上傳圖片' || processingStep === '發送訊息' ? '✓' : '1'}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">準備</span>
                    </div>
                    
                    {/* 連接線 */}
                    <div className={`w-8 h-0.5 transition-all duration-300 ${
                      processingStep === '生成圖片' || processingStep === '上傳圖片' || processingStep === '發送訊息' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    
                    {/* 步驟 2: 生成圖片 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        processingStep === '生成圖片' 
                          ? 'bg-purple-600 text-white scale-110' 
                          : processingStep === '上傳圖片' || processingStep === '發送訊息'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {processingStep === '生成圖片' || processingStep === '上傳圖片' || processingStep === '發送訊息' ? '✓' : '2'}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">生成</span>
                    </div>
                    
                    {/* 連接線 */}
                    <div className={`w-8 h-0.5 transition-all duration-300 ${
                      processingStep === '上傳圖片' || processingStep === '發送訊息' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    
                    {/* 步驟 3: 上傳圖片 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        processingStep === '上傳圖片' 
                          ? 'bg-purple-600 text-white scale-110' 
                          : processingStep === '發送訊息'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {processingStep === '上傳圖片' || processingStep === '發送訊息' ? '✓' : '3'}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">上傳</span>
                    </div>
                    
                    {/* 連接線 */}
                    <div className={`w-8 h-0.5 transition-all duration-300 ${
                      processingStep === '發送訊息' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    
                    {/* 步驟 4: 發送訊息 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        processingStep === '發送訊息' 
                          ? 'bg-purple-600 text-white scale-110' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {processingStep === '發送訊息' ? '✓' : '4'}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">發送</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 底部說明文字 */}
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                {processingStep === '準備中' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <span>正在初始化系統...</span>
                  </div>
                )}
                {processingStep === '生成圖片' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <span>正在合成您的專屬推廣圖片...</span>
                  </div>
                )}
                {processingStep === '上傳圖片' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <span>正在將圖片上傳到伺服器...</span>
                  </div>
                )}
                {processingStep === '發送訊息' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <span>正在發送圖片到您的 LINE 聊天室...</span>
                  </div>
                )}
                {processingStep === '完成' && (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>圖片已成功發送！</span>
                  </div>
                )}
                {processingStep === '錯誤' && (
                  <div className="flex items-center justify-center space-x-2 text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>系統異常，請稍後再試</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
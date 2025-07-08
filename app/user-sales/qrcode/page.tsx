'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSalesperson } from '../context/SalespersonContext';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodePage() {
  const { salesperson, storeId } = useSalesperson();
  const [lineUrl, setLineUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    if (storeId) {
      // 生成推廣連結（這裡可以根據實際需求調整 URL 格式）
      const url = `https://your-domain.com/bakery?ref=${storeId}`;
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
      // 降級方案：使用舊的複製方法
      const textArea = document.createElement('textarea');
      textArea.value = lineUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('降級複製也失敗:', fallbackErr);
        alert('複製失敗，請手動複製連結');
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    try {
      // 創建 canvas 來下載 QR Code
      const svg = qrRef.current as unknown as SVGElement;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 300;
      canvas.height = 300;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 300, 300);
        const pngFile = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.download = `推廣QRCode_${storeId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (error) {
      console.error('下載失敗:', error);
      alert('下載失敗，請稍後再試');
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
      {/* 頁面標題 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">專屬推廣 QR Code</h1>
        <p className="text-gray-600">
          您的專屬推廣 QR Code，客戶掃描後可直接進入您的推廣頁面
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
                    onClick={downloadQRCode}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    📥 下載 QR Code
                  </button>
                  <p className="text-sm text-gray-500">
                    下載 QR Code 圖片，可列印或分享使用
                  </p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">推廣資訊</h2>
          
          <div className="space-y-4">
            {/* 業務員資訊 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業務員資訊
              </label>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm">
                  <p><span className="font-medium">姓名：</span>{salesperson?.name}</p>
                  <p><span className="font-medium">代號：</span>{storeId}</p>
                  <p><span className="font-medium">郵箱：</span>{salesperson?.email}</p>
                  {salesperson?.phone && (
                    <p><span className="font-medium">電話：</span>{salesperson.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 推廣連結 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                推廣連結
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
                您可以直接分享此連結給客戶
              </p>
            </div>

            {/* 使用說明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用說明
              </label>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <ul className="space-y-1">
                  <li>• 客戶掃描 QR Code 或點擊連結可進入您的推廣頁面</li>
                  <li>• 系統會自動將客戶關聯到您的帳號</li>
                  <li>• 所有透過此連結產生的訂單都會計入您的業績</li>
                  <li>• 您可以下載 QR Code 圖片用於印刷品或電子媒體</li>
                </ul>
              </div>
            </div>

            {/* 分享方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                推廣方式建議
              </label>
              <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
                <ul className="space-y-1">
                  <li>• 📱 將 QR Code 設為手機桌布或 LINE 頭像</li>
                  <li>• 📄 列印 QR Code 製作名片或傳單</li>
                  <li>• 💬 在社群媒體分享推廣連結</li>
                  <li>• 📧 透過 Email 發送給潛在客戶</li>
                  <li>• 🏪 在實體店面展示 QR Code</li>
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
                <li>請妥善保管您的推廣連結，避免被他人濫用</li>
                <li>如發現異常使用情況，請立即聯絡系統管理員</li>
                <li>請確保您的聯絡資訊正確，以便客戶能夠聯繫您</li>
                <li>推廣連結的有效性與您的帳號狀態相關</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
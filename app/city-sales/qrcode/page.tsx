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

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    try {
      const canvas = document.createElement("canvas");
      const svg = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${storeId}_QRCode.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('下載失敗:', err);
    }
  };

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 p-2 sm:p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <div className="text-gray-500">載入中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* 頁面標題 */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-2xl shadow-2xl shadow-orange-500/20 p-6 sm:p-8 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-yellow-600/20">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11a9 9 0 11-18 0 9 9 0 0118 0zm-9 8a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  專屬 QR Code
                </h1>
                <p className="text-orange-100 text-sm sm:text-base opacity-90 mt-1">
                  您的專屬推廣 QR Code
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code 顯示區 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/20 p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full mr-4"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">QR Code</h2>
            </div>
            
            <div className="text-center">
              {lineUrl ? (
                <div className="space-y-6">
                  <div className="inline-block p-6 bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200/50 rounded-2xl shadow-lg">
                    <QRCodeSVG
                      ref={qrRef}
                      value={lineUrl}
                      size={256}
                      level="H"
                      includeMargin={true}
                      className="mx-auto"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={downloadQRCode}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      下載 QR Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <div className="text-gray-500">生成 QR Code 中...</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 連結資訊區 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/20 p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-500 rounded-full mr-4"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">連結資訊</h2>
            </div>
            
            <div className="space-y-6">
              {/* LINE 連結 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LINE 推廣連結
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                  <input
                    type="text"
                    value={lineUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 text-sm focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-6 py-3 text-sm font-medium transition-all duration-300 ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {copied ? '已複製' : '複製'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  您也可以直接分享此連結給客戶
                </p>
              </div>

              {/* 使用說明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  使用說明
                </label>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-xl p-4 text-sm text-orange-800">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      客戶掃描 QR Code 後會自動開啟 LINE
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      系統會自動將客戶串聯到您的帳號
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      所有透過此連結產生的訂單都會計入您的業績
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      建議在名片或宣傳資料上印製此 QR Code
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">注意事項</h3>
              <div className="text-sm text-yellow-700">
                <ul className="space-y-1">
                  <li>• 如發現異常使用情況，請立即聯絡系統管理員</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import React, { useState, useEffect } from "react";
import { FlexTemplates } from "../../../utils/flexTemplates";
import { sendLineMessages, getServiceExpiryDate } from "../../../services/lineService";
import { createActivationSuccessMessage } from "../../../utils/flexTemplates";

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl: string;
};

type LineActivationFormProps = {
  lineProfile: LineProfile | null;
  liff: any;
};

export default function LineActivationForm({ lineProfile, liff }: LineActivationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messageResult, setMessageResult] = useState<{status: "success" | "error" | null, message: string}>({
    status: null, 
    message: ""
  });
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果沒有LINE資料，仍允許提交，但顯示提示
    const isLineConnected = !!lineProfile;
    
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setMessageResult({status: null, message: ""});

    try {
      // 檢查是否有LINE資料，如果沒有則顯示提示但仍允許繼續
      if (!isLineConnected) {
        setErrorMessage("您尚未連接LINE帳號，系統將嘗試根據您提供的資料開通，但可能需要稍後再次嘗試");
      }
      
      // 優先使用 lineProfile 中的 userId 作為 lineId
      const lineId = lineProfile?.userId || "";
      
      // 準備請求體，確保包含 lineId 和 phone
      const requestBody = {
        email: formData.email,
        phone: formData.phone,
        lineId: lineId,
        displayName: lineProfile?.displayName || "未知用戶",
      };
      
      // 記錄送出的資料
      console.log("提交開通數據:", requestBody);
      
      const response = await fetch("/api/customer/line/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      // 檢查API回應的msg字段，"0"表示成功，"1"表示失敗
      if (data.msg === "1") {
        throw new Error(data.message || "開通失敗，請檢查您的信息是否正確");
      }
      
      // 根據LINE連接狀態顯示不同的成功訊息
      if (isLineConnected) {
        setSuccessMessage("LINE帳號開通成功！");
        
        // 如果在LINE LIFF環境中，發送消息
        if (liff && liff.isInClient()) {
          try {
            // 獲取客戶名稱 (從API響應的data.customer或使用默認值)
            const customerName = data.data?.customer || "尊敬的客戶";
            
           
            
            // 直接使用 createActivationSuccessMessage 生成訊息
            const messages = createActivationSuccessMessage(
              customerName, 
              lineProfile.displayName, 
             
            );
            console.log("開通成功消息:", messages);
            
            // 直接使用 liff.sendMessages 發送訊息
            try {
              await liff.sendMessages(messages);
              setMessageResult({
                status: "success", 
                message: "訊息發送成功！"
              });
              console.log("訊息發送成功");
              
              // 僅在訊息發送成功後才關閉視窗
              setTimeout(() => {
                liff.closeWindow();
              }, 1000);
            } catch (sendError) {
              console.error("發送訊息失敗", sendError);
              setMessageResult({
                status: "error", 
                message: "發送訊息失敗: " + (sendError instanceof Error ? sendError.message : "未知錯誤")
              });
              // 訊息發送失敗時不關閉視窗，讓用戶看到錯誤訊息
            }
          } catch (error) {
            console.error("準備訊息失敗", error);
            setMessageResult({
              status: "error", 
              message: "準備訊息失敗: " + (error instanceof Error ? error.message : "未知錯誤")
            });
          }
        }
      } else {
        setSuccessMessage("帳號資料驗證成功！請使用LINE重新開啟本頁面完成開通。");
      }
    } catch (error) {
      console.error("開通LINE失敗:", error);
      setErrorMessage(error instanceof Error ? error.message : "發生未知錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 成功提交後的訊息
  if (successMessage) {
    return (
      <div className="py-8 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">開通成功！</h3>
        <p className="text-gray-600 mb-6">{successMessage}</p>
        
        {/* 顯示訊息發送結果 */}
        {messageResult.status && (
          <div className={`mt-3 p-3 rounded-md text-sm mx-auto max-w-xs ${
            messageResult.status === "success" 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {messageResult.message}
          </div>
        )}
        
        {liff && liff.isInClient() && lineProfile && messageResult.status === "success" && (
          <p className="text-sm text-gray-500 mt-4">此視窗將在幾秒後自動關閉...</p>
        )}
      </div>
    );
  }

  // 不再顯示LINE連接的警告提示
  const isLineConnected = !!lineProfile;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md flex items-start">
          <svg className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-blue-800 font-medium mb-2 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          開通說明
        </h3>
        <p className="text-blue-700 text-sm">
          請輸入您註冊時使用的電子郵件和電話號碼來開通LINE。
        </p>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            電子郵件 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="您註冊時使用的電子郵件"
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            電話號碼 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="您註冊時使用的電話號碼"
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              處理中...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              開通LINE帳號
            </span>
          )}
        </button>
        <p className="mt-2 text-xs text-gray-500 text-center">
          點擊開通，即表示您同意我們的使用條款和隱私政策
        </p>
      </div>
    </form>
  );
} 
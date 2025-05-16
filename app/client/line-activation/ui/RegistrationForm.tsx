"use client";

import React, { useState, useEffect } from "react";


type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl: string;
};

type RegistrationFormProps = {
  lineProfile: LineProfile | null;
  liff: any;
  handleViewChange: (view: "activate" | "register") => void;
};

export default function RegistrationForm({ lineProfile, liff, handleViewChange }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    companyName: "",
    companyId: "",
    industry: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證第一步的所有必填欄位
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setErrorMessage("請填寫所有必填欄位");
      return;
    }
    
    setErrorMessage("");
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證第二步的所有必填欄位
    if (!formData.companyName || !formData.companyId || !formData.industry) {
      setErrorMessage("請填寫所有必填欄位");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // 確保備註欄位為空字串，並添加 lineId (如果有)
    const submissionData = {
      ...formData,
      notes: "",
      lineId: lineProfile?.userId || "",  // 仍然包含 lineId，但不填充其他 LINE 資料
    };

    // 記錄送出的資料
    console.log("提交註冊資料:", submissionData);

    // 檢查LINE連接狀態
    const isLineConnected = !!lineProfile;

    try {
      // 第一步：註冊客戶
      const registerResponse = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || "註冊失敗");
      }

      const registerData = await registerResponse.json();
      
      // 第二步：如果有LINE資料則開通LINE帳號
      if (isLineConnected) {
        try {
          const lineActivateResponse = await fetch("/api/customer/line/activate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              phone: formData.phone,
              lineId: lineProfile.userId,
              displayName: lineProfile.displayName,
            }),
          });

          const lineData = await lineActivateResponse.json();
          
          // 檢查API回應的msg字段，"0"表示成功，"1"表示失敗
          if (lineData.msg === "1") {
            // 顯示LINE開通錯誤但不中斷流程
            console.error("LINE帳號開通失敗:", lineData);
            setSuccessMessage("註冊成功！但LINE帳號開通過程中發生錯誤，請稍後再試。");
          } else {
            setSuccessMessage("註冊成功並已開通LINE帳號！");
            
            // 如果在LINE LIFF環境中，嘗試關閉視窗
            if (liff && liff.isInClient()) {
              try {
                // setTimeout(() => {
                //   liff.closeWindow();
                // }, 3000);
              } catch (windowError) {
                console.error("關閉LIFF視窗失敗", windowError);
              }
            }
          }
        } catch (lineError) {
          console.error("開通LINE出現網絡問題:", lineError);
          setSuccessMessage("註冊成功！但無法連接LINE服務，請稍後再試開通。");
        }
      } else {
        setSuccessMessage("註冊成功！可隨時通過LINE開通帳號連結");
      }

    } catch (error) {
      console.error("註冊或開通LINE失敗:", error);
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
        <h3 className="text-xl font-semibold text-gray-800 mb-2">註冊成功！</h3>
        <p className="text-gray-600 mb-6">{successMessage}</p>
        <p className="text-gray-600 mb-6">請立即返回開通頁面</p>
        <button
           onClick={() => handleViewChange("activate")}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          返回開通頁面
        </button>
      </div>
    );
  }

  // 顯示LINE連接的警告提示（但不阻止使用）
  const showLineWarning = !lineProfile;

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* 步驟指示器 */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">聯絡資料</span>
        </div>
        <div className="flex-1 h-0.5 mx-4 bg-gray-200"></div>
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">企業資料</span>
        </div>
      </div>

      {currentStep === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              姓名(請留全名) <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件(帳號用) <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              電話(密碼用) <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              送貨地址 <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              繼續填寫企業資料
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              公司名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
              統一編號 <span className="text-red-500">*</span>
            </label>
            <input
              id="companyId"
              name="companyId"
              type="text"
              required
              value={formData.companyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              行業類別 <span className="text-red-500">*</span>
            </label>
            <select
              id="industry"
              name="industry"
              required
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">請選擇行業</option>
              <option value="烘焙坊／麵包店">烘焙坊／麵包店</option>
              <option value="咖啡廳">咖啡廳</option>
              <option value="餐廳">餐廳</option>
              <option value="零售業">零售業</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "處理中..." : lineProfile ? "註冊並開通LINE" : "完成註冊"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RegistrationForm from "./RegistrationForm";
import LineActivationForm from "./LineActivationForm";

// LINE LIFF SDK
declare global {
  interface Window {
    liff: any;
  }
}

// 分離處理 SearchParams 的組件
function ActivationContent() {
  const searchParams = useSearchParams();
  const [liffObject, setLiffObject] = useState<any>(null);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<"activate" | "register">("activate");
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLineConnecting, setIsLineConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // 最大重試次數

  // 初始化LIFF - 背景運行，不影響頁面顯示
  useEffect(() => {
    // 檢查 URL 參數決定初始視圖
    const view = searchParams.get("view");
    if (view === "register") {
      setCurrentView("register");
    }

    const initializeLiff = async () => {
      // 從環境變數獲取 LIFF ID
      // 嘗試獲取 NEXT_PUBLIC_LINE_LIFF_ID，如果沒有則使用 NEXT_PUBLIC_LIFF_ID
      const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID;
      
      // 確保 LIFF ID 存在
      if (!liffId) {
        console.error("找不到 LIFF ID 環境變數");
        setLiffError("系統配置不完整，請聯繫管理員");
        return;
      }
      
      try {
        const liff = (await import("@line/liff")).default;
        
        setIsLineConnecting(true);
        try {
          await liff.init({ liffId });
          console.log("LIFF初始化成功");
        } catch (initError) {
          console.error("LIFF初始化失敗", initError);
          
          // 如果初始化失敗且未達到最大重試次數，嘗試登入後再次初始化
          if (retryCount < maxRetries) {
            console.log(`初始化失敗，嘗試登入後重新初始化 (${retryCount + 1}/${maxRetries})`);
            setRetryCount(prev => prev + 1);
            try {
              // 嘗試登入 LINE
              await liff.login();
              return; // 登入後頁面將重新加載，所以這裡可以直接返回
            } catch (loginError) {
              console.error("LINE登入失敗", loginError);
              throw loginError; // 將錯誤拋出，讓外層 catch 處理
            }
          } else {
            throw initError; // 達到最大重試次數，將錯誤拋出
          }
        }
        
        // 自動登入 LINE（如果用戶尚未登入）
        if (!liff.isLoggedIn()) {
          try {
            console.log("嘗試自動連接 LINE...");
            await liff.login();
            return; // 登入後頁面將重新加載，所以這裡可以直接返回
          } catch (loginError) {
            console.error("LINE自動登入失敗", loginError);
            // 登入失敗時，繼續執行後續代碼，提供基本功能
          }
        }
        
        // 如果已登入或登入失敗後繼續執行
        if (liff.isLoggedIn()) {
          try {
            // 獲取用戶基本個人資料
            const profile = await liff.getProfile();
            
            // 嘗試獲取更多用戶資訊，包括電話號碼
            // 注意：這需要適當的權限範圍 (scope)
            let userInfo = profile;
            
            // 如果 LIFF 有支援獲取電話號碼的方法，嘗試獲取
            try {
              if (liff.getIDToken) {
                const idToken = liff.getIDToken();
                if (idToken) {
                  // 有些 LIFF 版本可以通過 idToken 解析用戶信息
                  console.log("成功獲取 ID Token");
                  
                  // 如果需要，可以將 token 發送到後端解析更多信息
                  // 此處省略實現
                }
              }
            } catch (tokenError) {
              console.warn("獲取 ID Token 失敗", tokenError);
            }
            
            // 設置用戶 LINE 資料
            setLineProfile({
              ...userInfo,
              // 確保 userId 存在，這將作為 lineId 使用
              userId: userInfo.userId || ""
            });
            
            console.log("成功獲取 LINE 個人資料:", userInfo);
          } catch (profileError) {
            console.error("獲取LINE個人資料失敗", profileError);
          }
        }
        
        setLiffObject(liff);
        // 重置重試計數器，因為初始化成功
        setRetryCount(0);
      } catch (error) {
        console.error("LIFF完全初始化失敗", error);
        setLiffError("無法連接LINE服務，但您仍可使用基本功能");
      } finally {
        setIsLineConnecting(false);
      }
    };

    initializeLiff();
  }, [searchParams, retryCount]);

  // 處理視圖切換
  const handleViewChange = (view: "activate" | "register") => {
    setCurrentView(view);
    // 可以加入網址參數，支持分享和書籤
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.pushState({}, "", url.toString());
  };

  // 手動重試 LIFF 初始化
  const handleRetryLiff = () => {
    setLiffError(null);
    setRetryCount(prev => prev + 1);
  };

  return (
    <>
      {/* 錯誤提示 */}
      {liffError && (
        <div className="mx-6 mt-3 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
          {liffError}
          <button 
            onClick={handleRetryLiff}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            重試連接
          </button>
        </div>
      )}
      
      {/* LINE 連接中提示 */}
      {isLineConnecting && (
        <div className="mx-6 mt-3 p-3 bg-blue-100 text-blue-800 rounded-md text-sm flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-blue-500 rounded-full"></div>
          正在連接 LINE 服務...
        </div>
      )}
      
      {/* 內容區域 */}
      <div className="p-6">
        {/* 視圖標題和描述 */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentView === "activate" ? "開通LINE帳號" : "新商家註冊"}
          </h2>
        </div>
        
        {/* 表單區域 */}
        <div className="mt-4">
          {currentView === "activate" ? (
            <LineActivationForm lineProfile={lineProfile} liff={liffObject} />
          ) : (
            <RegistrationForm 
              lineProfile={lineProfile} 
              liff={liffObject} 
              handleViewChange={handleViewChange}
            />
          )}
        </div>

        {/* 底部切換區 */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          {currentView === "activate" ? (
            <div>
              <p className="text-gray-600">還沒有帳號？</p>
              <button
                onClick={() => handleViewChange("register")}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium underline"
              >
                立即註冊商家帳號
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">已經有帳號？</p>
              <button
                onClick={() => handleViewChange("activate")}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium underline"
              >
                返回開通LINE帳號
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 主組件使用 Suspense 包裝
export function LineActivationClient() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">載入中...</h2>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div>
        </div>
      </div>
    }>
      <ActivationContent />
    </Suspense>
  );
} 
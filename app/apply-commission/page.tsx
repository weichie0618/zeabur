'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  PencilIcon,
  ArrowPathIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
// 🔧 新增：引入LIFF相關功能
import { useLiff } from './SimpleLiffProvider';
import { sendLineMessages } from '@/app/services/lineService';
import { createImageMessage, createTextMessage } from '@/app/services/lineMessageTemplates';

interface ContractData {
  storeName: string;        // 門市名稱
  companyName: string;      // 公司名稱
  taxId: string;            // 統一編號
  representativeName: string; // 負責人姓名
  representativeId: string;   // 負責人身分證號
  address: string;          // 地址
  commissionRate: string;
  signatureData: string;
  signDate: string;
  contractImage?: string;
  contractImageUrl?: string; // 🔧 新增：伺服器上的合約圖片URL
  lineUserId?: string;      // 🔧 新增：LINE用戶ID
  account?: string;         // 🔧 新增：門市帳號（用於檢查客戶是否存在）
}

export default function OnlineContractPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 🔧 新增：LIFF相關狀態
  const { liff, profile, isLoggedIn, isInClient, isLoading: liffLoading, error: liffError } = useLiff();
  
  // 🔧 新增：動態設置頁面標題
  useEffect(() => {
    document.title = '分潤合約申請 - 城市漢堡';
  }, []);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasReadContract, setHasReadContract] = useState(false);
  const contractContentRef = useRef<HTMLDivElement>(null);

  const [contractData, setContractData] = useState<ContractData>({
    storeName: '',
    companyName: '',
    taxId: '',
    representativeName: '',
    representativeId: '',
    address: '',
    commissionRate: '', // 🔧 修改：預設為空白，讓用戶必須選擇
    signatureData: '',
    signDate: '',
    lineUserId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  // 🔧 新增：LINE訊息發送相關狀態
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  // 🔧 修改：LIFF初始化和用戶資料預填
  useEffect(() => {
    if (!liffLoading) {
      if (!isLoggedIn && liff) {
        // 如果未登入，進行LINE登入
        console.log('用戶未登入，開始登入流程');
        liff.login();
        return;
      }

      // 如果已登入且有用戶資料，先預填 lineUserId，然後獲取門市資訊
      if (profile) {
        setContractData(prev => ({
          ...prev,
          lineUserId: profile.userId
        }));
        
        console.log('預填用戶資料:', {
          userId: profile.userId
        });

        // 獲取門市資訊
        fetchStoreInfo(profile.userId);
      }
    }
  }, [liffLoading, isLoggedIn, profile, liff]);

  // 獲取門市資訊的函數
  const fetchStoreInfo = async (userId: string) => {
    try {
      console.log('開始獲取門市資訊:', userId);
      
      const response = await fetch('/get-store-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('獲取門市資訊失敗');
      }

      const result = await response.json();
      console.log('門市資訊API回應:', result);
      
      if (result.isValid && result.data) {
        const { account, companyName, storeName, address, taxId } = result.data;
        
        // 儲存account供後續檢查使用
        setContractData(prev => ({
          ...prev,
          companyName: companyName || '',
          storeName: storeName || '',
          address: address || '',
          taxId: taxId || '',
          // 儲存account供後續檢查
          account: account || ''
        }));
        
        console.log('門市資訊預填成功:', {
          account,
          companyName,
          storeName, 
          address,
          taxId
        });
      } else {
        console.log('門市資訊API無有效數據');
      }
    } catch (error) {
      console.error('獲取門市資訊失敗:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContractData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    setLastX(x);
    setLastY(y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    // 根據畫布的實際大小調整座標
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo(lastX * scaleX, lastY * scaleY);
    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setContractData(prev => ({
        ...prev,
        signatureData: canvas.toDataURL()
      }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setContractData(prev => ({
      ...prev,
      signatureData: ''
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 上傳合約圖片到伺服器
  const uploadContractImage = async (imageDataUrl: string) => {
    try {
      console.log('📤 開始上傳合約圖片，數據長度:', imageDataUrl.length);
      
      // 🔧 改進：直接從 base64 創建 blob，避免二次轉換
      const base64Data = imageDataUrl.split(',')[1]; // 移除 'data:image/jpeg;base64,' 前綴
      if (!base64Data) {
        throw new Error('無效的 base64 圖片數據');
      }
      
      console.log('🖼️ base64 數據長度:', base64Data.length);
      
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
      const fileName = `contract_${contractData.storeName}_${contractData.representativeName}_${Date.now()}.jpg`;
      
      console.log('📤 準備上傳，檔案名稱:', fileName);
      
      // 建立 FormData
      const formData = new FormData();
      formData.append('file', jpegBlob, fileName);
      formData.append('destination', 'uploads/contracts');
      
      // 上傳到伺服器
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // 使用 HttpOnly Cookie 認證
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`合約圖片上傳失敗: ${uploadResponse.status} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('✅ 上傳成功:', uploadResult);
      
      return uploadResult.filePath; // 返回伺服器上的圖片路徑
    } catch (error) {
      console.error('❌ 上傳合約圖片失敗:', error);
      throw error;
    }
  };

  const generateContractImage = async () => {
    // 設定 A4 尺寸 (210mm x 297mm)，以 96 DPI 轉換為像素
    const tempDiv = document.createElement('div');
    tempDiv.className = 'contract-template';
    tempDiv.style.width = '794px';  // 210mm = 794px @ 96dpi
    tempDiv.style.height = '1123px'; // 🔧 設定固定高度，確保填滿A4
    tempDiv.style.padding = '15px';  // 🔧 增加padding讓內容更飽滿
    tempDiv.style.background = 'white';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.position = 'relative';
    tempDiv.style.margin = '0 auto';
    tempDiv.style.overflow = 'hidden'; // 🔧 防止內容溢出
    
    // 🔧 修復：在HTML中直接嵌入簽名圖片，然後一起截圖，大幅增強顯示效果
    const signatureImageHtml = contractData.signatureData 
      ? `<img src="${contractData.signatureData}" style="height: 60px; max-width: 200px; object-fit: contain; filter: contrast(300%) brightness(60%) saturate(200%) invert(0%) sepia(0%) hue-rotate(0deg) drop-shadow(0 0 1px #000000); background: white;" />` 
      : '';
    
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; font-size: 9px; line-height: 1.4; width: 100%; height: 100%; display: flex; flex-direction: column;">
        <!-- 🔧 合約標題 - h2樣式，增加margin-bottom -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="font-size:25px; margin: 0; font-weight: bold; color: #000; line-height: 1.3;">
            城市漢堡加盟主參與分潤計畫協議書
          </h2>
        </div>
        
        <!-- 左右分頁內容區域 - 使用flex填滿剩餘空間 -->
        <div style="display: flex; width: 100%; flex: 1; min-height: 0;">
          <!-- 左頁 -->
          <div style="width: 50%; padding: 15px; border-right: 2px solid #000; height: 100%; display: flex; flex-direction: column;">
            <div style="margin-bottom: 15px;">
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 10px;">甲方：</strong><span style="font-size: 9px;">屹澧股份有限公司(以下簡稱"總部")</span><br/>
                <strong style="font-size: 10px;">地址：</strong><span style="font-size: 9px;">桃園市蘆竹區內厝里油管路一段696號</span><br/>
                <strong style="font-size: 10px;">統一編號：</strong><span style="font-size: 9px;">54938525</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 10px;">乙方：</strong><span style="font-size: 9px;">${contractData.companyName}（以下簡稱「加盟主」）</span><br/>
                <strong style="font-size: 10px;">門市名稱：</strong><span style="font-size: 9px;">${contractData.storeName}</span><br/>
                <strong style="font-size: 10px;">地址：</strong><span style="font-size: 9px;">${contractData.address}</span><br/>
                <strong style="font-size: 10px;">統一編號：</strong><span style="font-size: 9px;">${contractData.taxId}</span><br/>
                <strong style="font-size: 10px;">負責人：</strong><span style="font-size: 9px;">${contractData.representativeName}</span>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第一條 目的</h2>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">為推動城市漢堡品牌線上訂購銷售，提升加盟門市附加收入，雙方同意乙方參與總部所推動之【分潤計畫】，並依本協議書約定條款執行。</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第二條 計畫內容</h2>
              <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 0; font-size: 9px; line-height: 1.4;">
                <li style="margin-bottom: 4px;">乙方透過總部核發之專屬 QR Code 或推廣連結，推廣總部指定之線上商品（以下簡稱「推廣商品」）。</li>
                <li>消費者於推廣連結完成訂購並完成付款，訂單即認列為有效訂單。</li>
              </ol>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第三條 分潤方案與簽約費用</h2>
              <p style="margin-bottom: 6px; text-indent: 1em; font-size: 9px;">乙方選擇 ${contractData.commissionRate} 分潤方案，簽約費用：${
                contractData.commissionRate === '5%' ? '免簽約費' :
                contractData.commissionRate === '10%' ? 'NT$5,000' :
                contractData.commissionRate === '15%' ? 'NT$10,000' :
                'NT$15,000'
              }</p>
              <p style="margin-bottom: 6px; font-size: 9px;">分潤方案說明：</p>
              <!-- 🔧 增加表格高度 -->
              <table style="width: 100%; margin: 6px 0; border-collapse: collapse; font-size: 8px;">
                <tr>
                  <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid #000; background-color: #f5f5f5;">比例</th>
                  <th style="padding: 8px; text-align: center; font-weight: bold; border: 1px solid #000; background-color: #f5f5f5;">簽約費</th>
                </tr>
                <tr style="${contractData.commissionRate === '5%' ? 'background-color: #f8f9fa;' : ''}">
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">5%</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">免費</td>
                </tr>
                <tr style="${contractData.commissionRate === '10%' ? 'background-color: #f8f9fa;' : ''}">
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">10%</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">NT$5,000</td>
                </tr>
                <tr style="${contractData.commissionRate === '15%' ? 'background-color: #f8f9fa;' : ''}">
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">15%</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">NT$10,000</td>
                </tr>
                <tr style="${contractData.commissionRate === '20%' ? 'background-color: #f8f9fa;' : ''}">
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">20%</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">NT$15,000</td>
                </tr>
              </table>
              <div style="font-size: 8px; line-height: 1.3;">
                <p style="margin: 2px 0;">1. 乙方一經選定後，分潤比例及簽約費不得變更或退還。</p>
                <p style="margin: 2px 0;">2. 簽約費須於簽署後7日內繳清。</p>
                <p style="margin: 2px 0;">3. 分潤於每月結算，次月底前撥付。</p>
                <p style="margin: 2px 0;">4. 計算基準扣除運費、稅金5%。</p>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第四條 權利義務</h2>
              <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 0; font-size: 9px; line-height: 1.4;">
                <li style="margin-bottom: 3px;">乙方須依總部規範使用文宣及推廣素材。</li>
                <li style="margin-bottom: 3px;">不得將QR Code提供給第三方平台進行非授權商業用途。</li>
                <li style="margin-bottom: 3px;">所有訂單由總部統一處理及出貨。</li>
                <li>乙方應配合總部要求，協助推廣培訓。</li>
              </ol>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第五條 保密義務</h2>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">乙方不得向第三人洩露任何與本計畫有關之商業機密、行銷策略、顧客資料及任何未公開資訊。</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第七條 計畫變更與終止</h2>
              <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 4px; font-size: 9px; line-height: 1.4;">
                <li style="margin-bottom: 3px;">總部有權依市場需求調整推廣內容、分潤比例，並以書面通知乙方後生效。</li>
                <li style="margin-bottom: 3px;">若乙方有下列情形，總部得隨時終止本協議：
                  <ul style="list-style-type: disc; margin-left: 1em; margin-top: 2px; font-size: 8px;">
                    <li>違反規範或影響品牌商譽</li>
                    <li>逾期或拒絕提供結算資料</li>
                    <li>涉嫌違法行為</li>
                  </ul>
                </li>
                <li>雙方可提前30日書面通知終止本協議。</li>
              </ol>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第六條 知識產權</h2>
              <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 0; font-size: 9px; line-height: 1.4;">
                <li style="margin-bottom: 3px;">所有推廣素材、文宣、QR Code之智慧財產權歸總部所有。</li>
                <li>乙方僅有非專屬、不可轉讓之使用權。</li>
              </ol>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第八條 免責條款</h2>
              <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 0; font-size: 9px; line-height: 1.4;">
                <li style="margin-bottom: 3px;">總部對於消費者糾紛、退貨、退款等，保有最終處理權。</li>
                <li>因不可抗力導致訂單或分潤延遲，總部不負損害賠償責任。</li>
              </ol>
            </div>
          </div>
          
          <!-- 右頁 -->
          <div style="width: 50%; padding: 15px; height: 100%; display: flex; flex-direction: column;">
            <div style="flex: 1;">
              <div style="margin-bottom: 12px;">
                <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第九條 準據法與管轄</h2>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">本協議書依中華民國法律解釋，若有爭議，以總部所在地法院為管轄法院。</p>
              </div>

              <div style="margin-bottom: 12px;">
                <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第十條 其他</h2>
                <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 0; font-size: 9px; line-height: 1.4;">
                  <li style="margin-bottom: 3px;">本協議未盡事宜，雙方得另以書面補充約定。</li>
                  <li>本協議一式二份，雙方各執一份為憑。</li>
                </ol>
              </div>

              <div style="margin-bottom: 12px;">
                <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第十一條 關聯性及自動失效條款</h2>
                <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 0; font-size: 9px; line-height: 1.4;">
                  <li style="margin-bottom: 3px;">本協議為《加盟合約書》之附加協議，須依附原合約存在。</li>
                  <li>當《加盟合約書》終止後，本協議亦自動失效。</li>
                </ol>
              </div>

              <div style="margin-bottom: 15px;">
                <h2 style="font-size: 10px; margin-bottom: 8px; font-weight: bold;">附件一：分潤計算說明</h2>
                
                <div style="margin-bottom: 8px;">
                  <h3 style="font-size: 9px; margin-bottom: 4px; font-weight: bold;">💡 分潤計算基準說明</h3>
                  <ul style="list-style-type: none; margin-left: 0; font-size: 8px; line-height: 1.3;">
                    <li style="margin-bottom: 2px;">• 訂單金額採「實際付款金額」為基礎</li>
                    <li style="margin-bottom: 2px;">• 需先扣除運費、稅金（5%）再計算分潤</li>
                    <li style="margin-bottom: 2px;">• 分潤金額依加盟主所選擇之方案比例計算</li>
                  </ul>
                  <div style="border-bottom: 1px solid #ddd; margin: 8px 0;"></div>
                </div>

                <div style="margin-bottom: 8px;">
                  <h3 style="font-size: 9px; margin-bottom: 4px; font-weight: bold;">💰 範例說明</h3>
                  <div style="margin-bottom: 6px;">
                    <h4 style="font-size: 8px; margin-bottom: 3px; font-weight: bold;">✅ 假設情境</h4>
                    <ul style="list-style-type: none; margin-left: 0; font-size: 7px; line-height: 1.3;">
                      <li style="margin-bottom: 1px;">• 單月總訂單金額（含稅含運費）：NT$50,000</li>
                      <li style="margin-bottom: 1px;">• 其中運費：NT$3,000</li>
                      <li style="margin-bottom: 1px;">• 稅金（5%）：NT$2,500</li>
                    </ul>
                    <div style="border-bottom: 1px solid #ddd; margin: 6px 0;"></div>
                  </div>

                  <div style="margin-bottom: 6px;">
                    <h4 style="font-size: 8px; margin-bottom: 3px; font-weight: bold;">✅ 計算流程</h4>
                    <div style="font-size: 7px; line-height: 1.3;">
                      <p style="margin-bottom: 2px;">1️⃣ 扣除運費</p>
                      <p style="margin-bottom: 2px; margin-left: 10px;">NT$50,000 − NT$3,000 ＝ NT$47,000</p>
                      <p style="margin-bottom: 2px;">2️⃣ 再扣除稅金 5%</p>
                      <p style="margin-bottom: 2px; margin-left: 10px;">NT$47,000 × 0.95 ＝ NT$44,650（為分潤基礎金額）</p>
                    </div>
                    <div style="border-bottom: 1px solid #ddd; margin: 6px 0;"></div>
                  </div>

                  <div style="margin-bottom: 6px;">
                    <h4 style="font-size: 8px; margin-bottom: 3px; font-weight: bold;">✅ 分潤計算</h4>
                    <table style="width: 100%; margin: 4px 0; border-collapse: collapse; font-size: 6px;">
                      <tr>
                        <th style="padding: 4px; text-align: center; border: 1px solid #000; background-color: #f5f5f5; font-weight: bold;">分潤方案</th>
                        <th style="padding: 4px; text-align: center; border: 1px solid #000; background-color: #f5f5f5; font-weight: bold;">分潤比例</th>
                        <th style="padding: 4px; text-align: center; border: 1px solid #000; background-color: #f5f5f5; font-weight: bold;">分潤金額 (NT$)</th>
                      </tr>
                      <tr>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">5%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">5%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">NT$44,650 × 5% = NT$2,232</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">10%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">10%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">NT$44,650 × 10% = NT$4,465</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">15%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">15%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">NT$44,650 × 15% = NT$6,698</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">20%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">20%</td>
                        <td style="padding: 4px; text-align: center; border: 1px solid #000;">NT$44,650 × 20% = NT$8,930</td>
                      </tr>
                    </table>
                    <div style="border-bottom: 1px solid #ddd; margin: 6px 0;"></div>
                  </div>

                  <div style="margin-bottom: 6px;">
                    <h4 style="font-size: 8px; margin-bottom: 3px; font-weight: bold;">✅ 結論（以20%方案為例）</h4>
                    <ul style="list-style-type: none; margin-left: 0; font-size: 7px; line-height: 1.3;">
                      <li style="margin-bottom: 1px;">• 單月總訂單：NT$50,000</li>
                      <li style="margin-bottom: 1px;">• 最終實拿分潤：約 NT$8,930</li>
                    </ul>
                    <div style="border-bottom: 1px solid #ddd; margin: 6px 0;"></div>
                  </div>
                </div>

                <div style="margin-bottom: 8px;">
                  <h3 style="font-size: 8px; margin-bottom: 3px; font-weight: bold;">🟢 ⚖️ 重要提醒</h3>
                  <ul style="list-style-type: none; margin-left: 0; font-size: 7px; line-height: 1.3;">
                    <li style="margin-bottom: 2px;">• 若發生退款或取消，將於後續月份分潤中扣回</li>
                    <li>• 每月結算後，於次月底前撥款給加盟主</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 🔧 簽名區 - 放置右下方，上下排列 -->
            <div style="margin-top: auto; padding-top: 15px; border-top: 2px solid #000;">
              <!-- 甲方簽名區 -->
              <div style="margin-bottom: 20px;">
                <p style="font-size: 10px; margin-bottom: 3px; font-weight: bold;">甲方</p>
                <p style="font-size: 9px; margin-bottom: 2px;">屹澧股份有限公司</p>
                <p style="font-size: 9px; margin-bottom: 10px;">統編：54938525</p>
               
              </div>
              
              <!-- 乙方簽名區 -->
              <div>
                <p style="font-size: 10px; margin-bottom: 3px; font-weight: bold;">乙方</p>
                <p style="font-size: 8px; margin-bottom: 1px;">公司名稱：${contractData.companyName}</p>
                <p style="font-size: 8px; margin-bottom: 1px;">統一編號：${contractData.taxId}</p>
                <p style="font-size: 8px; margin-bottom: 1px;">負責人姓名：${contractData.representativeName}</p>
                <p style="font-size: 8px; margin-bottom: 1px;">負責人身分證號：${contractData.representativeId}</p>
                <p style="font-size: 8px; margin-bottom: 8px;">地址：${contractData.address}</p>
                <div style="height: 35px; border-bottom: 1px solid #000; display: flex; align-items: flex-end; justify-content: flex-start;">
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 9px; font-weight: bold;">簽名：</span>
                    <div style="margin-left: 120px;">${signatureImageHtml}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 🔧 日期區 - 最下方，不受左右分頁限制，h3字體大小和增加字間距 -->
        <div style="text-align: center; margin-top: 15px; padding: 10px; border-top: 1px solid #ddd;">
          <h3 style="font-size: 14px; margin: 0; font-weight: bold; letter-spacing: 3px;">
            簽約日期：${new Date().toLocaleDateString('zh-TW')}
          </h3>
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      // 🔧 等待圖片載入完成再截圖
      if (contractData.signatureData) {
        await new Promise((resolve) => {
          const img = tempDiv.querySelector('img');
          if (img) {
            if (img.complete) {
              resolve(null);
            } else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null); // 即使圖片載入失敗也繼續
            }
          } else {
            resolve(null);
          }
        });
      }

      const canvas = await html2canvas(tempDiv, {
        scale: 2, // 提高解析度
        useCORS: true,
        backgroundColor: 'white',
        allowTaint: true, // 允許跨域圖片
        imageTimeout: 0,  // 不限制圖片載入時間
        windowWidth: 794, // A4 寬度
        windowHeight: 1123, // A4 高度
        logging: false, // 關閉除錯日誌
        onclone: (clonedDoc) => {
          // 確保克隆的文檔中的元素也具有正確的尺寸
          const clonedDiv = clonedDoc.querySelector('.contract-template') as HTMLDivElement;
          if (clonedDiv) {
            clonedDiv.style.width = '794px';
            clonedDiv.style.height = '1123px';
            clonedDiv.style.padding = '15px';
            clonedDiv.style.overflow = 'hidden';
          }
        }
      });

      const contractImage = canvas.toDataURL('image/jpeg', 0.95);
      setContractData(prev => ({ ...prev, contractImage }));

      document.body.removeChild(tempDiv);
      return contractImage;
    } catch (error) {
      document.body.removeChild(tempDiv);
      throw error;
    }
  };

  // 🔧 改進：驗證圖片URL可用性的函數
  const verifyImageAvailability = async (imageUrl: string, maxRetries: number = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`檢驗圖片可用性 - 嘗試 ${attempt}/${maxRetries}: ${imageUrl}`);
        
        const response = await fetch(imageUrl, {
          method: 'HEAD', // 只檢查標頭，不下載整個圖片
          cache: 'no-cache' // 避免快取影響
        });
        
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          console.log(`✅ 圖片驗證成功 (嘗試 ${attempt}): ${response.status}`);
          return true;
        }
        
        console.warn(`⚠️ 圖片驗證失敗 (嘗試 ${attempt}): ${response.status}`);
      } catch (error) {
        console.warn(`⚠️ 圖片驗證錯誤 (嘗試 ${attempt}):`, error);
      }
      
      // 等待後重試 (遞增延遲: 1s, 2s, 3s)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    return false;
  };

  // 🔧 新增：發送合約簽署通知給管理員的函數
  const sendContractNotification = async (storeName: string, representativeName: string) => {
    try {
      console.log('📨 開始發送分潤合約簽署通知給管理員:', { storeName, representativeName });
      
      const response = await fetch('/api/line-message/send/contract-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ilovecityburger'
        },
        body: JSON.stringify({
          storeName,
          representativeName,
          contractType: '分潤合約'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '發送通知失敗');
      }
      
      const result = await response.json();
      console.log('✅ 合約簽署通知發送成功:', result);
      
    } catch (error) {
      console.error('❌ 發送合約簽署通知失敗:', error);
      // 不拋出錯誤，避免影響主流程
    }
  };

  // 🔧 改進：發送LINE圖片訊息的函數（增加驗證和重試機制）
  const sendContractImageToLine = async (imageUrl: string) => {
    if (!liff || !isInClient) {
      console.log('不在LINE環境中，跳過發送訊息');
      return;
    }

    try {
      setSendingMessage(true);
      
      // 構建完整的圖片URL並進行URL編碼
      const fullImageUrl = imageUrl.startsWith('http') 
        ? encodeURI(imageUrl)
        : `${window.location.origin}${encodeURI(imageUrl)}`;

      console.log('🖼️ 準備發送合約圖片:', fullImageUrl);

      // 🔧 關鍵改進：驗證圖片URL在發送前確實可用
      console.log('🔍 開始驗證圖片可用性...');
      const isImageAvailable = await verifyImageAvailability(fullImageUrl);
      
      if (!isImageAvailable) {
        throw new Error('圖片尚未完全上傳完成，請稍後再試');
      }

      console.log('✅ 圖片驗證通過，開始發送LINE訊息...');

      // 創建文字訊息，根據分潤比例添加簽約費提醒
      let messageText = '您的分潤合約已成功簽署！';
      
      // 只有付費方案才需要簽約費提醒
      if (contractData.commissionRate !== '5%') {
        const contractFee = 
          contractData.commissionRate === '10%' ? 'NT$5,000' :
          contractData.commissionRate === '15%' ? 'NT$10,000' :
          contractData.commissionRate === '20%' ? 'NT$15,000' : '';
        
        if (contractFee) {
          messageText += `\n\n提醒您：簽約費${contractFee}須於7日內付款`;
        }
      }
      
      const textMessage = createTextMessage(messageText);
      
      // 創建圖片訊息
      const imageMessage = createImageMessage(fullImageUrl, fullImageUrl);
      console.log('📤 發送訊息 (文字+圖片):', [textMessage, imageMessage]);
      
      // 先發送文字訊息，再發送圖片訊息
      const result = await sendLineMessages(liff, [textMessage, imageMessage]);
      
      if (result.success) {
        console.log('🎉 合約圖片發送成功');
        setMessageSent(true);
        
        // 發送成功後，延遲2秒自動關閉LIFF視窗
        setTimeout(() => {
          if (liff && liff.closeWindow) {
            console.log('🚪 自動關閉LIFF視窗');
            liff.closeWindow();
          }
        }, 2000);
              } else {
          console.error('❌ 合約圖片發送失敗:', result.error);
          const errorMsg = typeof result.error === 'string' ? result.error : '訊息發送失敗';
          throw new Error(errorMsg);
        }
    } catch (error) {
      console.error('💥 發送合約圖片時發生錯誤:', error);
      
      // 更友好的錯誤提示
      const errorMessage = error instanceof Error ? error.message : '發送圖片時發生未知錯誤';
      alert(`圖片發送失敗：${errorMessage}\n\n請稍候再試或聯繫客服。`);
    } finally {
      setSendingMessage(false);
    }
  };

    const generateContract = async () => {
    setIsSubmitting(true);
    const startTime = Date.now();
    
    try {
      const signDate = new Date().toLocaleDateString('zh-TW');
      console.log('🚀 開始生成合約流程...');
      
      // 🔍 檢查客戶是否存在
      if (contractData.account) {
        console.log('🔍 檢查客戶是否存在:', contractData.account);
        
        try {
          const checkResponse = await fetch('/api/customers/check-and-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              account: contractData.account,
              representativeName: contractData.representativeName,
              representativeId: contractData.representativeId,
              storeName: contractData.storeName,
              address: contractData.address,
              commissionRate: contractData.commissionRate
            }),
            credentials: 'include'
          });

          if (!checkResponse.ok) {
            throw new Error('檢查客戶資料失敗');
          }

          const checkResult = await checkResponse.json();
          console.log('客戶檢查結果:', checkResult);

          // 如果客戶已存在，顯示提示並停止流程
          if (checkResult.exists) {
            alert(checkResult.message);
            setIsSubmitting(false);
            return;
          }

          console.log('✅ 客戶資料檢查完成，可以繼續簽約流程');
        } catch (error) {
          console.error('❌ 檢查客戶資料時發生錯誤:', error);
          alert('檢查客戶資料時發生錯誤，請稍後再試');
          setIsSubmitting(false);
          return;
        }
      }
      
      // 📄 步驟1：生成合約圖片
      console.log('📄 步驟1：開始生成合約圖片...');
      const step1Start = Date.now();
      const contractImage = await generateContractImage();
      console.log(`✅ 步驟1完成：合約圖片生成成功 (${Date.now() - step1Start}ms)`);
      
      // 📝 步驟3：更新合約資料（即時完成）
      console.log('📝 步驟3：更新合約資料...');
      const finalContractData = {
        ...contractData,
        signDate,
        contractImage,
        contractImageUrl: '' // 初始為空，後續更新
      };
      setContractData(finalContractData);
      console.log('✅ 步驟3完成：合約資料更新成功');
      
      // 🚀 並行執行步驟2+4 和 步驟5
      console.log('🚀 開始並行執行剩餘步驟...');
      const parallelStart = Date.now();
      
      const promises = [];
      
      // 任務A：步驟2（上傳圖片）+ 步驟4（發送LINE圖片）
      const uploadAndSendLine = async () => {
        try {
          // 📤 步驟2：上傳合約圖片到伺服器
          console.log('📤 步驟2：開始上傳合約圖片到伺服器...');
          const step2Start = Date.now();
          const contractImageUrl = await uploadContractImage(contractImage);
          console.log(`✅ 步驟2完成：圖片上傳成功 (${Date.now() - step2Start}ms)`, {
            url: contractImageUrl,
            imageSize: contractImage.length
          });
          
          // 更新合約資料中的圖片URL
          setContractData(prev => ({ ...prev, contractImageUrl }));
          
          // 🔧 步驟4：如果在LINE環境中，發送合約圖片
          if (isInClient && liff) {
            console.log('📱 步驟4：開始發送LINE圖片訊息...');
            const step4Start = Date.now();
            await sendContractImageToLine(contractImageUrl);
            console.log(`✅ 步驟4完成：LINE訊息發送流程完成 (${Date.now() - step4Start}ms)`);
          } else {
            console.log('ℹ️ 步驟4：跳過LINE訊息發送（不在LINE環境中）');
          }
        } catch (error) {
          console.error('❌ 上傳圖片和發送LINE訊息失敗:', error);
          throw error;
        }
      };
      
      // 任務B：步驟5（發送管理員通知）
      const sendAdminNotification = async () => {
        try {
          console.log('📨 步驟5：開始發送合約簽署通知給管理員...');
          const step5Start = Date.now();
          await sendContractNotification(finalContractData.storeName, finalContractData.representativeName);
          console.log(`✅ 步驟5完成：管理員通知發送完成 (${Date.now() - step5Start}ms)`);
        } catch (error) {
          console.error('❌ 發送管理員通知失敗:', error);
          // 不拋出錯誤，避免影響主流程
        }
      };
      
      // 添加任務到並行執行列表
      promises.push(uploadAndSendLine());
      promises.push(sendAdminNotification());
      
      // 等待所有並行任務完成
      await Promise.all(promises);
      console.log(`🎉 並行任務全部完成！並行耗時: ${Date.now() - parallelStart}ms`);
      
      setIsCompleted(true);
      console.log(`🎉 合約生成流程全部完成！總耗時: ${Date.now() - startTime}ms`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知錯誤';
      console.error('💥 合約生成流程失敗:', {
        error: errorMsg,
        totalTime: Date.now() - startTime,
        step: '流程執行中斷'
      });
      
      alert('生成合約失敗：' + errorMsg + '\n\n請稍後再試或聯繫客服。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadContract = async () => {
    try {
      // 🔧 優先使用伺服器URL，如果沒有則使用本地base64圖片
      const imageUrl = contractData.contractImageUrl || contractData.contractImage;
      
      if (!imageUrl) {
        alert('找不到合約圖片，請重新生成');
        return;
      }
      
      if (contractData.contractImageUrl) {
        // 📥 從伺服器下載圖片
        const response = await fetch(contractData.contractImageUrl);
        if (!response.ok) {
          throw new Error('無法從伺服器下載圖片');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `分潤合約_${contractData.representativeName}_${contractData.signDate?.replace(/\//g, '-') || new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理臨時URL
        window.URL.revokeObjectURL(url);
      } else {
        // 📥 使用本地base64圖片下載（備用方案）
        const link = document.createElement('a');
        link.href = contractData.contractImage!;
        link.download = `分潤合約_${contractData.representativeName}_${contractData.signDate?.replace(/\//g, '-') || new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert('下載失敗：' + (error instanceof Error ? error.message : '請稍後再試'));
    }
  };

  // 🔧 新增：處理LIFF載入中的狀態
  if (liffLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
          <p className="text-sm text-gray-500 mt-2">正在初始化LINE服務...</p>
        </div>
      </div>
    );
  }

  // 🔧 新增：處理LIFF錯誤
  if (liffError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">初始化失敗</div>
            <p className="text-gray-600 mb-4">{liffError.message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

{/* 合約簽屬完成 */}
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            合約簽署完成
          </h1>
          
          <div className="text-gray-600 mb-6 space-y-2">
            <p className="text-sm">
              您的分潤合約已成功簽署！
            </p>
            
            {/* LINE訊息發送狀態 */}
            {isInClient && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                {sendingMessage ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-600">
                      📱 正在發送合約圖片到LINE...
                    </p>
                  </div>
                ) : messageSent ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">
                      ✅ 合約圖片已發送到您的LINE聊天室
                    </p>
                    <p className="text-xs text-gray-500">
                      視窗將自動關閉...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    🔗 您在LINE環境中，合約圖片將自動發送
                  </p>
                )}
              </div>
            )}
            
            {/* 非LINE環境的提示 */}
            {!isInClient && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  合約已成功生成
                </p>
              </div>
            )}
          </div>

          {/* 只在非LINE環境或發送失敗時顯示手動關閉按鈕 */}
          {(!isInClient || (!sendingMessage && !messageSent)) && (
            <div className="space-y-3">
              {!isInClient && (
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  返回首頁
                </button>
              )}
              
              {isInClient && liff && liff.closeWindow && (
                <button
                  onClick={() => liff.closeWindow()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  關閉視窗
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4">
      <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
        {/* 進度條 */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="flex items-start space-x-12 md:space-x-16">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center relative">
                  <div className={`text-xs md:text-sm font-medium mb-2 whitespace-nowrap text-center ${
                    step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step === 1 && '填寫資料'}
                    {step === 2 && '審閱合約'}
                    {step === 3 && '電子簽名'}
                  </div>
                  <div className="flex items-center relative">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm relative ${
                      step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`absolute left-full top-1/2 -translate-y-1/2 w-12 md:w-16 h-0.5 md:h-1 ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} style={{ marginLeft: '0.5rem' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 步驟1: 填寫資料 */}
          {currentStep === 1 && (
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-blue-100 mb-4">
                  <UserIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  填寫合約資料
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  請填寫完整的公司及負責人資料
                </p>
              </div>

              <form className="space-y-6">
                <div className="max-w-lg mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      門市名稱 *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      required
                      value={contractData.storeName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入門市名稱"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司名稱 *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={contractData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入公司名稱"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      統一編號 *
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      required
                      value={contractData.taxId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入統一編號"
                      pattern="[0-9]{8}"
                      maxLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      負責人姓名 *
                    </label>
                    <input
                      type="text"
                      name="representativeName"
                      required
                      value={contractData.representativeName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入負責人姓名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      負責人身分證號 *
                    </label>
                    <input
                      type="text"
                      name="representativeId"
                      required
                      value={contractData.representativeId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入身分證號"
                      pattern="[A-Z][0-9]{9}"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      地址 *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={contractData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入完整地址"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分潤比例 *
                    </label>
                    <div className="relative">
                      <select
                        name="commissionRate"
                        value={contractData.commissionRate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base appearance-none bg-white pr-10"
                        required
                      >
                      <option value="" disabled className="text-gray-500">
                        請選擇分潤比例...
                      </option>
                      <option value="5%" className="text-gray-900">
                        5% - 免簽約費
                      </option>
                      <option value="10%" className="text-gray-900">
                        10% - NT$5,000
                      </option>
                      <option value="15%" className="text-gray-900">
                        15% - NT$10,000
                      </option>
                      <option value="20%" className="text-gray-900">
                        20% - NT$15,000
                      </option>
                    </select>
                    
                   </div>
                   
                   
                  </div>
                </div>
              </form>

              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNextStep}
                  disabled={!contractData.storeName.trim() || !contractData.companyName.trim() || !contractData.taxId.trim() || !contractData.representativeName.trim() || !contractData.representativeId.trim() || !contractData.address.trim() || !contractData.commissionRate}
                  className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步驟2: 審閱合約 */}
          {currentStep === 2 && (
            <div className="py-6 px-2 md:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  審閱合約內容
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  請詳細閱讀合約條款
                </p>
              </div>

              <div 
                className="bg-gray-50 rounded-lg p-4 md:p-8 max-h-[60vh] md:max-h-[65vh] overflow-y-auto relative"
                ref={contractContentRef}
                onScroll={(e) => {
                  const element = e.currentTarget;
                  const isAtBottom = Math.abs(
                    element.scrollHeight - element.scrollTop - element.clientHeight
                  ) < 10;
                  if (isAtBottom) {
                    setHasReadContract(true);
                  }
                }}
              >
                <div className="prose prose-sm md:prose-base max-w-none">
                  <h3 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">城市漢堡<br />加盟主參與分潤計畫協議書</h3>
                  
                  <div className="space-y-4 md:space-y-6 text-sm md:text-base">
                    <div>
                      <strong>甲方：</strong>屹澧股份有限公司(以下簡稱"總部")
                      <br />
                      <strong>地址：</strong>桃園市蘆竹區內厝里油管路一段696號<br />
                      <strong>統一編號：</strong>54938525
                    </div>
                    <div>
                      <strong>乙方：</strong>{contractData.companyName}（以下簡稱「加盟主」）
                      <br />
                      <strong>門市名稱：</strong>{contractData.storeName}
                      <br />
                      <strong>地址：</strong>{contractData.address}
                      <br />
                      <strong>統一編號：</strong>{contractData.taxId}
                      <br />
                      <strong>負責人：</strong>{contractData.representativeName}
                    </div>
                    
                    <div className="border-t pt-4 md:pt-6">
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第一條 目的</h4>
                      <p>為推動城市漢堡品牌線上訂購銷售，提升加盟門市附加收入，雙方同意乙方參與總部所推動之【分潤計畫】，並依本協議書約定條款執行。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第二條 計畫內容</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>乙方透過總部核發之專屬 QR Code 或推廣連結，推廣總部指定之線上商品（以下簡稱「推廣商品」）。</li>
                        <li>消費者於推廣連結完成訂購並完成付款，訂單即認列為有效訂單。</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第三條 分潤方案與簽約費用</h4>
                      <p>乙方選擇 {contractData.commissionRate} 分潤方案</p>
                        <p>簽約費用：
                      {contractData.commissionRate === '5%' && '免簽約費'}
                      {contractData.commissionRate === '10%' && 'NT$5,000'}
                      {contractData.commissionRate === '15%' && 'NT$10,000'}
                      {contractData.commissionRate === '20%' && 'NT$15,000'}
                      </p>
                      <p className="mt-2">分潤方案說明：</p>
                      <table className="min-w-full mt-2 mb-4">
                        <thead>
                          <tr>
                            <th className="text-left py-2 px-4 bg-gray-50">分潤比例</th>
                            <th className="text-left py-2 px-4 bg-gray-50">簽約費用 (一次性)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={contractData.commissionRate === '5%' ? 'bg-blue-50' : ''}>
                            <td className="py-2 px-4">5%</td>
                            <td className="py-2 px-4">免簽約費</td>
                          </tr>
                          <tr className={contractData.commissionRate === '10%' ? 'bg-blue-50' : ''}>
                            <td className="py-2 px-4">10%</td>
                            <td className="py-2 px-4">NT$5,000</td>
                          </tr>
                          <tr className={contractData.commissionRate === '15%' ? 'bg-blue-50' : ''}>
                            <td className="py-2 px-4">15%</td>
                            <td className="py-2 px-4">NT$10,000</td>
                          </tr>
                          <tr className={contractData.commissionRate === '20%' ? 'bg-blue-50' : ''}>
                            <td className="py-2 px-4">20%</td>
                            <td className="py-2 px-4">NT$15,000</td>
                          </tr>
                        </tbody>
                      </table>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>乙方一經選定後，分潤比例及簽約費不得變更或退還，除非經總部書面同意。</li>
                        <li>簽約費須於本協議簽署後 7 日內一次繳清，逾期視同放棄優惠方案，並以 5% 方案為基準。</li>
                        <li>分潤金額將於每月結算，並於次月底前匯入乙方指定帳戶（需提供公司戶或合法個人戶）。</li>
                        <li>計算基準皆扣除運費、稅金5%。</li>
                        <li>詳細計算方式依附件一說明為準。</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第四條 權利義務</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>乙方須依總部規範使用文宣及推廣素材，不得自行修改或另行製作。</li>
                        <li>推廣期間，乙方不得將總部 QR Code 或推廣連結提供給第三方平台進行非授權商業用途（例如轉售、投放廣告、代理分發等）。</li>
                        <li>所有訂單由總部統一收款、處理及出貨，乙方不得干預或自行處理消費者訂單。</li>
                        <li>乙方應配合總部要求，協助進行推廣培訓及必要資訊更新。</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第五條 保密義務</h4>
                      <p>乙方不得向第三人洩露任何與本計畫有關之商業機密、行銷策略、顧客資料及任何未公開資訊。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第七條 計畫變更與終止</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>總部有權依市場需求及經營策略，調整推廣內容、分潤比例、推廣商品或文宣素材，並以書面或電子方式通知乙方後生效。</li>
                        <li>若乙方有下列情形之一，總部得隨時單方終止本協議，並不支付後續分潤：
                          <ul className="list-disc list-inside ml-4 mt-2">
                            <li>違反總部規範或影響品牌商譽</li>
                            <li>逾期或拒絕提供正確結算資料</li>
                            <li>涉嫌違法行為或損害消費者權益</li>
                          </ul>
                        </li>
                        <li>雙方可提前 30 日以書面通知方式終止本協議，惟終止前之已完成訂單仍依約結算。</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第八條 免責條款</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>總部對於消費者於推廣商品下單後產生之任何糾紛、退貨、退款或損害，保有最終處理及決策權，乙方不得異議。</li>
                        <li>因不可抗力（如天災、疫情、法令變動等）導致訂單或分潤延遲，總部不負損害賠償責任。</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第九條 準據法與管轄</h4>
                      <p>本協議書依中華民國法律解釋與適用，若有訴訟爭議，雙方同意以總部所在地之地方法院為第一審管轄法院。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第十條 其他</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>本協議未盡事宜，雙方得另以書面補充約定，並與本協議具同等效力。</li>
                        <li>本協議一式二份，雙方各執一份為憑。</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第十一條 關聯性及自動失效條款</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>本協議書為乙方與甲方所簽訂之《加盟合約書》之附加協議，雙方同意本協議條款須依附於原加盟合約存在與履行。</li>
                        <li>當《加盟合約書》因任何原因截止、終止或解除後，本附加協議亦將自動停止效力，雙方無需另行通知，且不得再主張任何後續分潤權利。</li>
                      </ol>
                    </div>

                    <div className="mt-6 md:mt-8">
                      <h4 className="text-lg md:text-xl font-semibold mb-4">附件一：分潤計算說明</h4>
                      
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                            💡 分潤計算基準說明
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-sm md:text-base ml-4">
                            <li>訂單金額採「實際付款金額」為基礎</li>
                            <li>需先扣除運費、稅金（5%）再計算分潤</li>
                            <li>分潤金額依加盟主所選擇之方案比例計算</li>
                          </ul>
                          <hr className="my-4 border-gray-300" />
                        </div>

                        <div>
                          <h5 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                            💰 範例說明
                          </h5>
                          
                          <div className="mb-4">
                            <h6 className="text-sm md:text-base font-semibold mb-2 flex items-center">
                              ✅ 假設情境
                            </h6>
                            <ul className="list-disc list-inside space-y-1 text-sm md:text-base ml-4">
                              <li>單月總訂單金額（含稅含運費）：NT$50,000</li>
                              <li>其中運費：NT$3,000</li>
                              <li>稅金（5%）：NT$2,500</li>
                            </ul>
                            <hr className="my-4 border-gray-300" />
                          </div>

                          <div className="mb-4">
                            <h6 className="text-sm md:text-base font-semibold mb-2 flex items-center">
                              ✅ 計算流程
                            </h6>
                            <div className="text-sm md:text-base space-y-2 ml-4">
                              <p><strong>1️⃣ 扣除運費</strong></p>
                              <p className="ml-4">NT$50,000 − NT$3,000 ＝ NT$47,000</p>
                              <p><strong>2️⃣ 再扣除稅金 5%</strong></p>
                              <p className="ml-4">NT$47,000 × 0.95 ＝ NT$44,650（為分潤基礎金額）</p>
                            </div>
                            <hr className="my-4 border-gray-300" />
                          </div>

                          <div className="mb-4">
                            <h6 className="text-sm md:text-base font-semibold mb-2 flex items-center">
                              ✅ 分潤計算
                            </h6>
                            <div className="overflow-x-auto">
                              <table className="min-w-full mt-2 mb-4 text-sm">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="text-left py-2 px-4 font-semibold">分潤方案</th>
                                    <th className="text-left py-2 px-4 font-semibold">分潤比例</th>
                                    <th className="text-left py-2 px-4 font-semibold">分潤金額 (NT$)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b">
                                    <td className="py-2 px-4">5%</td>
                                    <td className="py-2 px-4">5%</td>
                                    <td className="py-2 px-4">NT$44,650 × 5% = NT$2,232</td>
                                  </tr>
                                  <tr className="border-b">
                                    <td className="py-2 px-4">10%</td>
                                    <td className="py-2 px-4">10%</td>
                                    <td className="py-2 px-4">NT$44,650 × 10% = NT$4,465</td>
                                  </tr>
                                  <tr className="border-b">
                                    <td className="py-2 px-4">15%</td>
                                    <td className="py-2 px-4">15%</td>
                                    <td className="py-2 px-4">NT$44,650 × 15% = NT$6,698</td>
                                  </tr>
                                  <tr className="border-b">
                                    <td className="py-2 px-4">20%</td>
                                    <td className="py-2 px-4">20%</td>
                                    <td className="py-2 px-4">NT$44,650 × 20% = NT$8,930</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <hr className="my-4 border-gray-300" />
                          </div>

                          <div className="mb-4">
                            <h6 className="text-sm md:text-base font-semibold mb-2 flex items-center">
                              ✅ 結論（以20%方案為例）
                            </h6>
                            <ul className="list-disc list-inside space-y-1 text-sm md:text-base ml-4">
                              <li>單月總訂單：NT$50,000</li>
                              <li>最終實拿分潤：約 NT$8,930</li>
                            </ul>
                            <hr className="my-4 border-gray-300" />
                          </div>

                          <div>
                            <h6 className="text-sm md:text-base font-semibold mb-2 flex items-center">
                              🟢 ⚖️ 重要提醒
                            </h6>
                            <ul className="list-disc list-inside space-y-1 text-sm md:text-base ml-4">
                              <li>若發生退款或取消，將於後續月份分潤中扣回</li>
                              <li>每月結算後，於次月底前撥款給加盟主</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 md:mt-8">
                <button
                  onClick={handleNextStep}
                  disabled={!hasReadContract}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
                >
                  <span>同意並繼續</span>
                  {!hasReadContract && (
                    <span className="text-xs text-gray-200">(請先閱讀全文)</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 步驟3: 電子簽名 */}
          {currentStep === 3 && (
            <div className="p-2 md:p-6">
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  電子簽名
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  請在下方簽名區域進行簽名確認
                </p>
              </div>

              <div className="w-full">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="flex justify-between items-center p-2">
                    <label className="block text-base font-medium text-gray-700 text-center flex-1">
                      請在此區域簽名
                    </label>
                  </div>
                  
                  <div className="bg-white p-1">
                    <canvas
                      ref={canvasRef}
                      width={2000}
                      height={800}
                      className="w-full cursor-crosshair bg-gray-50 rounded-lg h-60 sm:h-72 md:h-80"
                      style={{
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none",
                        msTouchAction: "none",
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        startDrawing(e);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        draw(e);
                      }}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  
                  <div className="flex justify-end p-2">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-base flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                      <span>清除重簽</span>
                    </button>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 my-4">
                  簽名代表您已詳閱並同意上述合約條款
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={generateContract}
                    disabled={!contractData.signatureData || isSubmitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center justify-center space-x-2 text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>生成中...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>完成簽署</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
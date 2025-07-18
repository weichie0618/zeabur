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
// 引入LIFF相關功能
import { useLiff } from '../SimpleLiffProvider';
import { sendLineMessages } from '@/app/services/lineService';
import { createImageMessage, createTextMessage } from '@/app/services/lineMessageTemplates';

interface BreadContractData {
  storeName: string;        // 門市名稱
  companyName: string;      // 公司名稱
  taxId: string;            // 統一編號
  representativeName: string; // 負責人姓名
  representativeId: string;   // 負責人身分證號
  address: string;          // 地址
  signatureData: string;
  signDate: string;
  contractImage?: string;
  contractImageUrl?: string; // 伺服器上的合約圖片URL
  lineUserId?: string;      // LINE用戶ID
}

export default function BreadContractPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // LIFF相關狀態
  const { liff, profile, isLoggedIn, isInClient, isLoading: liffLoading, error: liffError } = useLiff();
  
  // 動態設置頁面標題
  useEffect(() => {
    document.title = '麵包販售合作協議 - 城市漢堡';
  }, []);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasReadContract, setHasReadContract] = useState(false);
  const contractContentRef = useRef<HTMLDivElement>(null);

  const [contractData, setContractData] = useState<BreadContractData>({
    storeName: '',
    companyName: '',
    taxId: '',
    representativeName: '',
    representativeId: '',
    address: '',
    signatureData: '',
    signDate: '',
    lineUserId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  // LINE訊息發送相關狀態
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

  // LIFF初始化和用戶資料預填
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
        const { companyName, storeName, address, taxId } = result.data;
        
        // 只預填門市相關資料，不包括負責人姓名、身分證號
        setContractData(prev => ({
          ...prev,
          companyName: companyName || '',
          storeName: storeName || '',
          address: address || '',
          taxId: taxId || ''
        }));
        
        console.log('門市資訊預填成功:', {
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
      const fileName = `bread_contract_${contractData.storeName}_${contractData.representativeName}_${Date.now()}.jpg`;
      
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
    tempDiv.style.height = '1123px'; // 設定固定高度，確保填滿A4
    tempDiv.style.padding = '15px';  // 增加padding讓內容更飽滿
    tempDiv.style.background = 'white';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.position = 'relative';
    tempDiv.style.margin = '0 auto';
    tempDiv.style.overflow = 'hidden'; // 防止內容溢出
    
    // 在HTML中直接嵌入簽名圖片，然後一起截圖
    const signatureImageHtml = contractData.signatureData 
      ? `<img src="${contractData.signatureData}" style="height: 60px; max-width: 200px; object-fit: contain; filter: contrast(300%) brightness(60%) saturate(200%) invert(0%) sepia(0%) hue-rotate(0deg) drop-shadow(0 0 1px #000000); background: white;" />` 
      : '';
    
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; font-size: 9px; line-height: 1.4; width: 100%; height: 100%; display: flex; flex-direction: column;">
        <!-- 合約標題 -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="font-size: 25px; margin: 0; font-weight: bold; color: #000; line-height: 1.3;">
            城市漢堡門市販售麵包合作附加協議書
          </h2>
        </div>
        
        <!-- 左右分頁內容區域 -->
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
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第一條｜合作目的</h2>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">為提升門市商品多樣性及整體營業額，乙方同意依本協議規定於門市內販售由甲方提供之麵包產品，並遵守甲方所訂定之各項規範。</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第二條｜麵包供應與銷售方式</h2>
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>1. 供應來源：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 8px;">乙方所販售麵包商品，須全數由甲方指定之供應商提供，乙方不得擅自採購、製作或更換商品來源。</p>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>2. 價格規範與限制：</strong></p>
              <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 8px; font-size: 8px; line-height: 1.4;">
                <li style="margin-bottom: 3px;">所有麵包商品之售價，須依甲方公告之「公版建議售價」販售。</li>
                <li style="margin-bottom: 3px;">乙方不得擅自調降售價，亦不得以低於建議售價販售商品。</li>
                <li style="margin-bottom: 3px;">若有促銷需求，須以「期間限定促銷」、「加價購」、「組合優惠」等方式回饋顧客，並須經甲方核准後實施。</li>
                <li style="margin-bottom: 3px;">若乙方擅自調降價格販售，甲方有權即時中止其麵包販售權益，並得終止本附加協議，乙方不得異議。</li>
              </ol>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>3. 銷售區域限制：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">麵包商品僅限於乙方門市販售，不得於其他平台、通路、批發、網路等販售，除非經甲方另行書面授權。</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第三條｜產品品質與保存規範</h2>
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>1. 保存與庫存管理：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">乙方須依甲方提供之保存條件進行冷藏／常溫／定期盤點，確保商品品質。並落實先進先出原則。</p>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>2. 效期與新鮮度控管：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">鑑於麵包商品有效期短、易受環境影響，乙方每日須清查商品效期與狀況，不得販售過期、變質、不新鮮之商品。</p>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>3. 過期商品責任：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">若乙方販售過期或不新鮮麵包，造成顧客抱怨、食安問題或商譽損害，乙方應負全部責任，包含賠償顧客損失、主管機關裁罰、媒體處理與法律責任，甲方不負任何連帶賠償。</p>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>4. 商品擺放與標示：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">商品須於清潔衛生之專區陳列，並附上清楚的品名、成份、保存期限與保存方式說明。</p>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>5. 退貨處理：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">乙方如於收貨時發現商品有異常，應於24小時內拍照並提出書面通知，否則視為驗收無誤，後續不得要求退換貨。</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第四條｜品牌與宣傳規範</h2>
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>1. 品牌授權使用：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">乙方不得擅自以城市漢堡品牌或LOGO製作麵包商品包裝、社群貼文、宣傳物料，相關視覺與文案須由甲方審核與授權。</p>
              
              <p style="margin-bottom: 6px; font-size: 9px;"><strong>2. 社群與廣告：</strong></p>
              <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">麵包商品若進行任何線上、實體之促銷或曝光，乙方須將文案與圖像資料送交甲方審核，經核准後方可發布。</p>
            </div>
          </div>
          
          <!-- 右頁 -->
          <div style="width: 50%; padding: 15px; height: 100%; display: flex; flex-direction: column;">
            <div style="flex: 1;">
              <div style="margin-bottom: 12px;">
                <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第五條｜責任歸屬與違約處理</h2>
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>1. 商品風險歸屬：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">所有麵包商品自乙方簽收後，風險轉移至乙方。保管不當所致之損失、報廢，甲方不負責任。</p>
                
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>2. 食品安全事故：</strong></p>
                <ol style="list-style-type: decimal; margin-left: 1em; margin-bottom: 8px; font-size: 8px; line-height: 1.4;">
                  <li style="margin-bottom: 3px;">若因甲方製造過程導致食品安全事件，甲方負責處理與賠償。</li>
                  <li style="margin-bottom: 3px;">若因乙方保存不當、過期販售或販售非授權麵包，導致顧客受害或媒體報導，應由乙方負完全責任，並賠償甲方因此受損之商譽與營業損失。</li>
                </ol>
                
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>3. 違約處理：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">若乙方違反本協議任何條款，甲方得書面通知並限期改善，未於期限內改善者，甲方得立即終止合作並保留法律追訴與損害賠償權利。</p>
              </div>

              <div style="margin-bottom: 12px;">
                <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第六條｜協議期間與終止</h2>
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>1. 效期連動條款：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">本附加協議之有效期間與乙方原加盟合約相同；若加盟合約終止、屆滿、撤銷或不續約，本協議亦自動終止，雙方不再負有履約義務。</p>
                
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>2. 提前終止：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">若乙方有重大違約、影響品牌聲譽、或違反價格與食品安全規定，甲方有權不經通知逕行終止本附加協議，且不負補償責任。</p>
              </div>

              <div style="margin-bottom: 12px;">
                <h2 style="font-size: 11px; margin-bottom: 6px; font-weight: bold;">第七條｜其他約定</h2>
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>1. 附屬性：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">本附加協議為乙方加盟合約之延伸條款，效力與加盟合約相同，並與之構成不可分割之一部分。</p>
                
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>2. 未盡事宜補充：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4; margin-bottom: 6px;">如有未盡事宜，雙方得以書面協議補充之，並具同等法律效力。</p>
                
                <p style="margin-bottom: 6px; font-size: 9px;"><strong>3. 自動更新條款：</strong></p>
                <p style="text-indent: 1em; font-size: 9px; line-height: 1.4;">為配合商品、營運政策及品牌策略之彈性調整，甲方得隨時更新或調整本附加協議內容。乙方同意後續若有協議內容之修訂、增補或更新，甲方得於內部公告系統或門市通知平台發布後即視為生效，無須個別另行通知，乙方應自動遵守。</p>
              </div>
            </div>

            <!-- 簽名區 - 放置右下方，上下排列 -->
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

        <!-- 日期區 - 最下方，不受左右分頁限制 -->
        <div style="text-align: center; margin-top: 15px; padding: 10px; border-top: 1px solid #ddd;">
          <h3 style="font-size: 14px; margin: 0; font-weight: bold; letter-spacing: 3px;">
            簽約日期：${new Date().toLocaleDateString('zh-TW')}
          </h3>
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      // 等待圖片載入完成再截圖
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

  // 驗證圖片URL可用性的函數
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

  // 發送合約簽署通知給管理員的函數
  const sendContractNotification = async (storeName: string, representativeName: string) => {
    try {
      console.log('📨 開始發送麵包合約簽署通知給管理員:', { storeName, representativeName });
      
      const response = await fetch('/api/line-message/send/contract-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ilovecityburger'
        },
        body: JSON.stringify({
          storeName,
          representativeName,
          contractType: '麵包合約'
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

  // 發送LINE圖片訊息的函數（增加驗證和重試機制）
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

      // 驗證圖片URL在發送前確實可用
      console.log('🔍 開始驗證圖片可用性...');
      const isImageAvailable = await verifyImageAvailability(fullImageUrl);
      
      if (!isImageAvailable) {
        throw new Error('圖片尚未完全上傳完成，請稍後再試');
      }

      console.log('✅ 圖片驗證通過，開始發送LINE訊息...');

      // 創建文字訊息
      const textMessage = createTextMessage('您的麵包販售合作協議已成功簽署！\n\n感謝您加入城市漢堡麵包販售計畫，後續將有專人與您聯繫相關細節。');
      
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
      // 優先使用伺服器URL，如果沒有則使用本地base64圖片
      const imageUrl = contractData.contractImageUrl || contractData.contractImage;
      
      if (!imageUrl) {
        alert('找不到合約圖片，請重新生成');
        return;
      }
      
      if (contractData.contractImageUrl) {
        // 從伺服器下載圖片
        const response = await fetch(contractData.contractImageUrl);
        if (!response.ok) {
          throw new Error('無法從伺服器下載圖片');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `麵包販售合約_${contractData.representativeName}_${contractData.signDate?.replace(/\//g, '-') || new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理臨時URL
        window.URL.revokeObjectURL(url);
      } else {
        // 使用本地base64圖片下載（備用方案）
        const link = document.createElement('a');
        link.href = contractData.contractImage!;
        link.download = `麵包販售合約_${contractData.representativeName}_${contractData.signDate?.replace(/\//g, '-') || new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert('下載失敗：' + (error instanceof Error ? error.message : '請稍後再試'));
    }
  };

  // 處理LIFF載入中的狀態
  if (liffLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
          <p className="text-sm text-gray-500 mt-2">正在初始化LINE服務...</p>
        </div>
      </div>
    );
  }

  // 處理LIFF錯誤
  if (liffError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">初始化失敗</div>
            <p className="text-gray-600 mb-4">{liffError.message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 合約簽屬完成
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
              您的麵包販售合約已成功簽署！
            </p>
            
            {/* LINE訊息發送狀態 */}
                            {isInClient && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                {sendingMessage ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                    <p className="text-sm text-amber-600">
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
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-4 px-4">
      <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
        {/* 進度條 */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="flex items-start space-x-12 md:space-x-16">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center relative">
                  <div className={`text-xs md:text-sm font-medium mb-2 whitespace-nowrap text-center ${
                    step <= currentStep ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {step === 1 && '填寫資料'}
                    {step === 2 && '審閱合約'}
                    {step === 3 && '電子簽名'}
                  </div>
                  <div className="flex items-center relative">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm relative ${
                      step <= currentStep ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`absolute left-full top-1/2 -translate-y-1/2 w-12 md:w-16 h-0.5 md:h-1 ${
                        step < currentStep ? 'bg-amber-600' : 'bg-gray-200'
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
                <div className="mx-auto flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-amber-100 mb-4">
                  <UserIcon className="h-6 w-6 md:h-8 md:w-8 text-amber-600" />
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                      placeholder="請輸入完整地址"
                    />
                  </div>
                </div>
              </form>

              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNextStep}
                  disabled={!contractData.storeName.trim() || !contractData.companyName.trim() || !contractData.taxId.trim() || !contractData.representativeName.trim() || !contractData.representativeId.trim() || !contractData.address.trim()}
                  className="w-full max-w-xs bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
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
                  <h3 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">城市漢堡門市販售麵包<br />合作附加協議書</h3>
                  
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
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第一條｜合作目的</h4>
                      <p>為提升門市商品多樣性及整體營業額，乙方同意依本協議規定於門市內販售由甲方提供之麵包產品，並遵守甲方所訂定之各項規範。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第二條｜麵包供應與銷售方式</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">1. 供應來源：</h5>
                          <p className="pl-4">乙方所販售麵包商品，須全數由甲方指定之供應商提供，乙方不得擅自採購、製作或更換商品來源。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">2. 價格規範與限制：</h5>
                          <ol className="list-decimal list-inside space-y-2 pl-4">
                            <li>所有麵包商品之售價，須依甲方公告之「公版建議售價」販售。</li>
                            <li>乙方不得擅自調降售價，亦不得以低於建議售價販售商品。</li>
                            <li>若有促銷需求，須以「期間限定促銷」、「加價購」、「組合優惠」等方式回饋顧客，並須經甲方核准後實施。</li>
                            <li>若乙方擅自調降價格販售，甲方有權即時中止其麵包販售權益，並得終止本附加協議，乙方不得異議。</li>
                          </ol>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">3. 銷售區域限制：</h5>
                          <p className="pl-4">麵包商品僅限於乙方門市販售，不得於其他平台、通路、批發、網路等販售，除非經甲方另行書面授權。</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第三條｜產品品質與保存規範</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">1. 保存與庫存管理：</h5>
                          <p className="pl-4">乙方須依甲方提供之保存條件進行冷藏／常溫／定期盤點，確保商品品質。並落實先進先出原則。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">2. 效期與新鮮度控管：</h5>
                          <p className="pl-4">鑑於麵包商品有效期短、易受環境影響，乙方每日須清查商品效期與狀況，不得販售過期、變質、不新鮮之商品。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">3. 過期商品責任：</h5>
                          <p className="pl-4">若乙方販售過期或不新鮮麵包，造成顧客抱怨、食安問題或商譽損害，乙方應負全部責任，包含賠償顧客損失、主管機關裁罰、媒體處理與法律責任，甲方不負任何連帶賠償。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">4. 商品擺放與標示：</h5>
                          <p className="pl-4">商品須於清潔衛生之專區陳列，並附上清楚的品名、成份、保存期限與保存方式說明。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">5. 退貨處理：</h5>
                          <p className="pl-4">乙方如於收貨時發現商品有異常，應於24小時內拍照並提出書面通知，否則視為驗收無誤，後續不得要求退換貨。</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第四條｜品牌與宣傳規範</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">1. 品牌授權使用：</h5>
                          <p className="pl-4">乙方不得擅自以城市漢堡品牌或LOGO製作麵包商品包裝、社群貼文、宣傳物料，相關視覺與文案須由甲方審核與授權。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">2. 社群與廣告：</h5>
                          <p className="pl-4">麵包商品若進行任何線上、實體之促銷或曝光，乙方須將文案與圖像資料送交甲方審核，經核准後方可發布。</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第五條｜責任歸屬與違約處理</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">1. 商品風險歸屬：</h5>
                          <p className="pl-4">所有麵包商品自乙方簽收後，風險轉移至乙方。保管不當所致之損失、報廢，甲方不負責任。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">2. 食品安全事故：</h5>
                          <ol className="list-decimal list-inside space-y-2 pl-4">
                            <li>若因甲方製造過程導致食品安全事件，甲方負責處理與賠償。</li>
                            <li>若因乙方保存不當、過期販售或販售非授權麵包，導致顧客受害或媒體報導，應由乙方負完全責任，並賠償甲方因此受損之商譽與營業損失。</li>
                          </ol>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">3. 違約處理：</h5>
                          <p className="pl-4">若乙方違反本協議任何條款，甲方得書面通知並限期改善，未於期限內改善者，甲方得立即終止合作並保留法律追訴與損害賠償權利。</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第六條｜協議期間與終止</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">1. 效期連動條款：</h5>
                          <p className="pl-4">本附加協議之有效期間與乙方原加盟合約相同；若加盟合約終止、屆滿、撤銷或不續約，本協議亦自動終止，雙方不再負有履約義務。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">2. 提前終止：</h5>
                          <p className="pl-4">若乙方有重大違約、影響品牌聲譽、或違反價格與食品安全規定，甲方有權不經通知逕行終止本附加協議，且不負補償責任。</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第七條｜其他約定</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">1. 附屬性：</h5>
                          <p className="pl-4">本附加協議為乙方加盟合約之延伸條款，效力與加盟合約相同，並與之構成不可分割之一部分。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">2. 未盡事宜補充：</h5>
                          <p className="pl-4">如有未盡事宜，雙方得以書面協議補充之，並具同等法律效力。</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold mb-2">3. 自動更新條款：</h5>
                          <p className="pl-4">為配合商品、營運政策及品牌策略之彈性調整，甲方得隨時更新或調整本附加協議內容。乙方同意後續若有協議內容之修訂、增補或更新，甲方得於內部公告系統或門市通知平台發布後即視為生效，無須個別另行通知，乙方應自動遵守。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6 md:mt-8">
                <button
                  onClick={handleNextStep}
                  disabled={!hasReadContract}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center space-x-2"
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

                <div className="flex justify-center">
                  <button
                    onClick={generateContract}
                    disabled={!contractData.signatureData || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center space-x-2 text-base"
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

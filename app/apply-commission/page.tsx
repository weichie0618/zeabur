'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  PencilIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';

interface ContractData {
  signerName: string;
  commissionRate: string;
  signatureData: string;
  signDate: string;
  contractImage?: string;
}

export default function OnlineContractPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasReadContract, setHasReadContract] = useState(false);
  const contractContentRef = useRef<HTMLDivElement>(null);

  const [contractData, setContractData] = useState<ContractData>({
    signerName: '',
    commissionRate: '10%',
    signatureData: '',
    signDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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

  const generateContractImage = async () => {
    const tempDiv = document.createElement('div');
    tempDiv.className = 'contract-template';
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '40px';
    tempDiv.style.background = 'white';
    
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="text-align: center; font-size: 24px; margin-bottom: 40px;">分潤合約書</h1>
        
        <div style="margin-bottom: 30px; line-height: 2;">
          <p><strong>甲方：</strong>屹澧股份有限公司</p>
          <p><strong>乙方：</strong>${contractData.signerName}</p>
        </div>

        <div style="margin-bottom: 30px; line-height: 2;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">第一條 合約目的</h2>
          <p>本合約係雙方就商品銷售分潤事宜所訂立之合作協議。</p>
        </div>

        <div style="margin-bottom: 30px; line-height: 2;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">第二條 乙方基本資料</h2>
          <p>簽約人姓名：${contractData.signerName}</p>
        </div>

        <div style="margin-bottom: 30px; line-height: 2;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">第三條 分潤條件</h2>
          <p>甲方同意依據乙方實際銷售金額給予 ${contractData.commissionRate} 之分潤比例。</p>
        </div>

        <div style="margin-bottom: 30px; line-height: 2;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">第四條 結算方式</h2>
          <p>分潤款項將於每月月底結算，並於次月15日前撥付。</p>
        </div>

        <div style="margin-bottom: 30px; line-height: 2;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">第五條 合約期限</h2>
          <p>本合約自簽署日起生效，有效期限為一年，期滿前一個月如無異議則自動續約。</p>
        </div>

        <div style="margin-bottom: 40px; line-height: 2;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">第六條 其他約定</h2>
          <p>雙方應誠實履行本合約各項條款</p>
          <p>如有爭議，雙方應先協商解決</p>
          <p>本合約一式兩份，雙方各執一份為憑</p>
        </div>

        <div style="margin-top: 60px; line-height: 2;">
          <p>簽署日期：${new Date().toLocaleDateString('zh-TW')}</p>
          <div style="margin-top: 30px; display: flex;">
            <div style="flex: 1;">
              <p><strong>乙方簽名：</strong></p>
              <div id="signature-placeholder" style="margin-top: 10px; height: 60px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white'
      });

      const ctx = canvas.getContext('2d');
      if (ctx && contractData.signatureData) {
        const signatureImg = new Image();
        signatureImg.src = contractData.signatureData;
        await new Promise((resolve) => {
          signatureImg.onload = () => {
            // 調整簽名位置和大小
            const signatureX = 150;  // 從「乙方簽名：」文字後方開始
            const signatureY = canvas.height + 100;  // 讓簽名再往下移動
            const signatureWidth = 200;  // 調整簽名寬度
            const signatureHeight = 60;  // 調整簽名高度
            
            // 繪製簽名
            ctx.drawImage(
              signatureImg,
              signatureX,
              signatureY,
              signatureWidth,
              signatureHeight
            );
            resolve(null);
          };
        });
      }

      const contractImage = canvas.toDataURL('image/jpeg', 0.95);
      setContractData(prev => ({ ...prev, contractImage }));

      document.body.removeChild(tempDiv);
      return contractImage;
    } catch (error) {
      console.error('生成合約圖片失敗:', error);
      document.body.removeChild(tempDiv);
      throw error;
    }
  };

  const generateContract = async () => {
    setIsSubmitting(true);
    try {
      const signDate = new Date().toLocaleDateString('zh-TW');
      
      // 生成合約圖片
      const contractImage = await generateContractImage();
      
      const finalContractData = {
        ...contractData,
        signDate,
        contractImage
      };
      
      // 模擬生成合約的過程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('合約資料:', finalContractData);
      
      setIsCompleted(true);
    } catch (error) {
      console.error('生成合約失敗:', error);
      alert('生成合約失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadContract = () => {
    if (contractData.contractImage) {
      // 下載合約圖片
      const link = document.createElement('a');
      link.href = contractData.contractImage;
      link.download = `分潤合約_${contractData.signerName}_${new Date().toLocaleDateString('zh-TW')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateContractText = () => {
    return `
分潤合約書

甲方：屹澧股份有限公司
乙方：${contractData.signerName}

第一條 合約目的
本合約係雙方就商品銷售分潤事宜所訂立之合作協議。

第二條 乙方基本資料
簽約人姓名：${contractData.signerName}

第三條 分潤條件
甲方同意依據乙方實際銷售金額給予 ${contractData.commissionRate} 之分潤比例。

第四條 結算方式
分潤款項將於每月月底結算，並於次月15日前撥付。

第五條 合約期限
本合約自簽署日起生效，有效期限為一年，期滿前一個月如無異議則自動續約。

第六條 其他約定
1. 雙方應誠實履行本合約各項條款
2. 如有爭議，雙方應先協商解決
3. 本合約一式兩份，雙方各執一份為憑

簽署日期：${contractData.signDate}
乙方簽名：[已簽署]

本合約已於 ${new Date().toLocaleString('zh-TW')} 完成電子簽署
    `;
  };

  const handleBackToHome = () => {
    router.push('/');
  };

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
            <p className="text-xs">
              合約副本已生成，您可以下載保存。
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadContract}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>下載合約</span>
            </button>

            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>返回首頁</span>
            </button>
          </div>
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
                  請填寫您的姓名以生成分潤合約
                </p>
              </div>

              <form className="space-y-6">
                <div className="max-w-sm mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      乙方姓名 *
                    </label>
                    <input
                      type="text"
                      name="signerName"
                      required
                      value={contractData.signerName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="請輸入您的姓名"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分潤比例
                    </label>
                    <select
                      name="commissionRate"
                      value={contractData.commissionRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                      <option value="5%">5%</option>
                      <option value="10%">10%</option>
                      <option value="15%">15%</option>
                      <option value="20%">20%</option>
                    </select>
                  </div>
                </div>
              </form>

              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNextStep}
                  disabled={!contractData.signerName.trim()}
                  className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步驟2: 審閱合約 */}
          {currentStep === 2 && (
            <div className="p-6 md:p-8">
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
                  <h3 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">分潤合約書</h3>
                  
                  <div className="space-y-4 md:space-y-6 text-sm md:text-base">
                    <div>
                      <strong>甲方：</strong>屹澧股份有限公司
                    </div>
                    <div>
                      <strong>乙方：</strong>{contractData.signerName}
                    </div>
                    
                    <div className="border-t pt-4 md:pt-6">
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第一條 合約目的</h4>
                      <p>本合約係雙方就商品銷售分潤事宜所訂立之合作協議。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第二條 乙方基本資料</h4>
                      <ul className="list-none space-y-2">
                        <li>簽約人姓名：{contractData.signerName}</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第三條 分潤條件</h4>
                      <p>甲方同意依據乙方實際銷售金額給予 <strong>{contractData.commissionRate}</strong> 之分潤比例。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第四條 結算方式</h4>
                      <p>分潤款項將於每月月底結算，並於次月15日前撥付。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第五條 合約期限</h4>
                      <p>本合約自簽署日起生效，有效期限為一年，期滿前一個月如無異議則自動續約。</p>
                    </div>

                    <div>
                      <h4 className="text-lg md:text-xl font-semibold mb-3">第六條 其他約定</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>雙方應誠實履行本合約各項條款</li>
                        <li>如有爭議，雙方應先協商解決</li>
                        <li>本合約一式兩份，雙方各執一份為憑</li>
                      </ol>
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
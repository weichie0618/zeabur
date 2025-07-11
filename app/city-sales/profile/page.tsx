'use client';

import React, { useState, useEffect } from 'react';
import { useSalesperson } from '../context/SalespersonContext';
import { salespersonApi, CommissionRule, formatCurrency, SalespersonContract } from '../services/apiService';

// 宣告LIFF類型
declare global {
  interface Window {
    liff: any;
  }
}

export default function ProfilePage() {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [contractInfo, setContractInfo] = useState<SalespersonContract>({
    contract_start_date: null,
    contract_end_date: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liffReady, setLiffReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { salesperson, storeId } = useSalesperson();

  useEffect(() => {
    if (storeId) {
      fetchCommissionRules();
    }
    
    // 初始化LIFF
    if (typeof window !== 'undefined' && window.liff) {
      setLiffReady(true);
    }

    // 檢測是否為手機模式
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初始檢查
    checkMobile();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkMobile);

    // 清理監聽器
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [storeId]);

  const fetchCommissionRules = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await salespersonApi.getCommissionRules(storeId);
      if (response.data) {
        setCommissionRules(response.data.rules || []);
        setContractInfo(response.data.salesperson || {
          contract_start_date: null,
          contract_end_date: null
        });
      }
    } catch (err) {
      setError('獲取分潤規則時發生錯誤');
      setCommissionRules([]);
      console.error('Commission rules error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRuleDescription = (rule: CommissionRule) => {
    if (rule.rule_type === 'fixed') {
      return `固定比例：${rule.fixed_rate}%`;
    } else if (rule.rule_type === 'tiered' && rule.tiered_rules) {
      return '階梯式分潤：' + rule.tiered_rules.map(tier => 
        `${formatCurrency(tier.min_amount)}${tier.max_amount ? `-${formatCurrency(tier.max_amount)}` : '以上'}: ${tier.rate}%`
      ).join(', ');
    }
    return '未知規則類型';
  };

  const handleSendComputerPreview = async () => {
    if (!liffReady || !window.liff) {
      alert('LIFF 尚未準備就緒');
      return;
    }

    try {
      // 創建FLEX訊息格式
      const flexMessage = {
        type: 'flex',
        altText: '電腦版預覽連結',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '💻 電腦版預覽',
                weight: 'bold',
                color: '#1DB446',
                size: 'lg'
              }
            ],
            paddingAll: 'lg',
            backgroundColor: '#f0f8ff'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '點擊下方按鈕開啟電腦版預覽',
                wrap: true,
                color: '#666666',
                size: 'sm'
              },
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '開啟電腦版',
                  uri: 'https://liff.line.me/2006372025-O5AZ25zL'
                },
                style: 'primary',
                color: '#1DB446',
                margin: 'md'
              }
            ],
            spacing: 'sm'
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '建議使用電腦瀏覽器獲得最佳體驗',
                size: 'xs',
                color: '#999999',
                align: 'center'
              }
            ],
            paddingTop: 'sm'
          }
        }
      };

      // 發送FLEX訊息
      await window.liff.sendMessages([flexMessage]);
      
      // 關閉LIFF
      window.liff.closeWindow();
      
    } catch (error) {
      console.error('發送訊息失敗:', error);
      alert('發送訊息失敗，請稍後再試');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">個人資料</h1>

      {/* 基本資訊 */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">基本資訊</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <div className="text-base sm:text-lg font-medium text-gray-900">
                {salesperson?.name || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業務員 ID
              </label>
              <div className="text-base sm:text-lg font-medium text-gray-900">
                {storeId || '-'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件
            </label>
            <div className="text-sm text-gray-600 break-all">
              {salesperson?.email || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              合約期間
            </label>
            <div className="text-sm text-gray-600">
              {contractInfo.contract_start_date ? (
                <>
                  {contractInfo.contract_start_date} ~ {contractInfo.contract_end_date || '無限期'}
                </>
              ) : (
                '-'
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              業務員 ID
            </label>
            <div className="text-sm text-gray-600">
              {storeId || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公司/單位
            </label>
            <div className="text-sm text-gray-600">
              {salesperson?.companyName || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              認證狀態
            </label>
            <div className="flex items-center">
              {salesperson ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 text-sm">已認證</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-red-700 text-sm">未認證</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 分潤規則 */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">我的分潤規則</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        ) : commissionRules.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <svg className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm sm:text-base">目前沒有設定分潤規則</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {commissionRules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full self-start">
                    生效中
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">規則詳情</h4>
                  <p className="text-xs sm:text-sm text-gray-700">{formatRuleDescription(rule)}</p>
                </div>

                {rule.rule_type === 'tiered' && rule.tiered_rules && (
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            最低金額
                          </th>
                          <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            最高金額
                          </th>
                          <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            分潤比例
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rule.tiered_rules.map((tier, index) => (
                          <tr key={index}>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900">
                              {formatCurrency(tier.min_amount)}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900">
                              {tier.max_amount ? formatCurrency(tier.max_amount) : '無上限'}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900">
                              {tier.rate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mt-4 space-y-1 sm:space-y-0">
                  <span>生效日期：{rule.effective_date}</span>
                  {contractInfo.contract_start_date && <span>失效日期：{contractInfo.contract_end_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按鈕 - 只在手機模式顯示 */}
      {isMobile && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">操作選項</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleSendComputerPreview}
              disabled={!liffReady}
              className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                liffReady
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              使用電腦預覽
            </button>
          </div>
          
          {!liffReady && (
            <p className="text-xs text-gray-500 mt-2">
              * 請在LINE應用程式中開啟此頁面以使用完整功能
            </p>
          )}
        </div>
      )}
    </div>
  );
} 
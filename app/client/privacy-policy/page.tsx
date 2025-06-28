

import React from 'react';
import Link from 'next/link';


// 強制使用靜態生成
export const dynamic = 'force-static';
// 禁用自動重新驗證
export const revalidate = false;


export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">隱私權政策</h1>
        <div className="h-1 w-20 bg-amber-400 rounded-full"></div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <p className="mb-6">
          本隱私權政策說明我們如何收集、使用、處理及保護您的個人資料。本政策適用於所有透過本網站提供的服務。
          根據台灣個人資料保護法第8條規定，當您使用本服務時，我們會以明顯方式告知您以下事項：
        </p>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">個資收集單位</h2>
          <p>屹澧股份有限公司</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">收集目的</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>處理及履行訂單</li>
            <li>提供客戶服務及支援</li>
            <li>會員管理及服務</li>
            <li>行銷、促銷及廣告訊息傳遞</li>
            <li>統計及分析使用者行為</li>
            <li>商品或服務的改進</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">收集項目</h2>
          <p className="mb-2">我們可能收集的個人資料包括但不限於：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>姓名</li>
            <li>電子郵件地址</li>
            <li>電話號碼</li>
            <li>聯絡地址</li>
            <li>訂單及購買記錄</li>
            <li>IP位址及瀏覽資訊</li>
            <li>LINE ID（若透過LINE登入）</li>
            <li>付款資訊（由第三方支付平台處理）</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">利用期間、地區、對象及方式</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <tbody>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-3 font-medium">期間</td>
                  <td className="border border-gray-300 p-3">自會員註冊或開始使用服務起至會員帳號終止或停止使用服務為止，或依法律規定之保存期限</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">地區</td>
                  <td className="border border-gray-300 p-3">台灣及我們的資料儲存和處理設施所在地</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-3 font-medium">對象</td>
                  <td className="border border-gray-300 p-3">屹澧股份有限公司及其關係企業、合作的物流公司、支付服務提供商及依法有權機關</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">方式</td>
                  <td className="border border-gray-300 p-3">以自動化機器或其他非自動化方式蒐集、處理、利用，並以電子檔案或紙本形式儲存</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">用戶權利</h2>
          <p className="mb-2">依據個人資料保護法，您就您的個人資料享有以下權利：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>查詢或請求閱覽</li>
            <li>請求製給複製本</li>
            <li>請求補充或更正</li>
            <li>請求停止蒐集、處理或利用</li>
            <li>請求刪除</li>
          </ul>
          <p className="mt-2 text-sm text-gray-600">
            請注意，若您要求我們停止處理或刪除對於提供服務所必要的資料，可能會導致我們無法繼續為您提供服務。
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">聯絡資訊</h2>
          <p>若您對於我們的隱私權政策有任何疑問，或希望行使您的權利，請透過以下方式聯絡我們：</p>
          <ul className="list-none mt-2">
            <li><strong>Email：</strong> service@cityburger.com.tw</li>
            <li><strong>客服電話：</strong> 03-3363620</li>
            <li><strong>地址：</strong> 桃園市蘆竹區油管路一段696號</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Cookie 及其他追蹤技術</h2>
          <p>
            本網站使用 Cookie 及類似技術來改善您的瀏覽體驗、分析網站流量並協助行銷活動。
            您可以透過瀏覽器設定來控制或刪除 Cookie，但這可能會影響某些服務的功能。
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">隱私權政策的修改</h2>
          <p>
            我們保留隨時修改本隱私權政策的權利。當我們進行重大變更時，
            會在網站上發布通知並更新生效日期。建議您定期查閱本政策以了解最新的隱私保護措施。
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">最後更新日期：2024年5月1日</p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/client/bakery" className="text-amber-600 hover:text-amber-800">
          返回首頁
        </Link>
      </div>
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-static';  // 強制使用靜態生成
export const revalidate = false;  // 禁用自動重新驗證

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">服務條款</h1>
        <div className="h-1 w-20 bg-amber-400 rounded-full"></div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <p className="mb-6">
          歡迎使用我們的網站和服務。以下條款與條件（「服務條款」）規範您對本網站的使用及我們與您之間的法律關係。
          使用本網站或下訂單，即表示您同意本服務條款。如果您不同意這些條款，請勿使用本網站。
        </p>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. 定義</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>「本公司」、「我們」、「我方」指屹澧股份有限公司。</li>
            <li>「用戶」、「您」、「您的」指存取或使用本網站的任何人。</li>
            <li>「網站」指由本公司營運的網站，包括所有子網域和關聯服務。</li>
            <li>「商品」指通過本網站提供銷售的所有商品和服務。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. 帳號與密碼</h2>
          <p className="mb-2">使用我們的服務可能需要您創建帳號。關於您的帳號，您同意：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>提供準確、完整和最新的資訊。</li>
            <li>妥善保管您的帳號密碼，並對透過您帳號進行的所有活動負責。</li>
            <li>如發現任何未經授權使用您帳號的情況，立即通知我們。</li>
            <li>未經授權不得將帳號轉讓給任何第三方。</li>
            <li>我們保留在任何時候拒絕提供服務、終止帳號或修改/刪除內容的權利。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. 購物流程與付款</h2>
          <p className="mb-2">關於在本網站上購物，您了解並同意：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>所有商品的價格、規格和供應情況可能隨時變更，不另行通知。</li>
            <li>下訂單後，您將收到一封確認電子郵件，但這不構成我們接受您的訂單。</li>
            <li>我們保留拒絕任何訂單的權利，無需說明理由。</li>
            <li>付款必須使用網站上提供的付款方式完成。所有價格均以新台幣計價並含稅。</li>
            <li>如採用銀行匯款，訂單將在確認收到款項後處理。</li>
            <li>如選擇貨到付款，您必須在收貨時向配送人員支付全額。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. 配送與退換貨政策</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>我們努力確保準時配送，但配送時間僅為估計，可能因各種因素而有所變動。</li>
            <li>您有責任提供正確的收貨地址和聯絡資訊，若因資訊不正確導致無法送達，我們不承擔責任。</li>
            <li>配送風險在商品交付給您或您指定的收貨人時轉移給您。</li>
            <li>退換貨必須在收到商品的7天內提出，並符合我們的退換貨政策。</li>
            <li>某些商品基於衛生或保鮮考慮可能不適用退換貨政策，細節請參見各商品頁面說明。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. 禁止行為</h2>
          <p className="mb-2">使用本網站時，您同意不會：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>使用盜刷或偽造的支付方式。</li>
            <li>提交虛假或誤導性的訂單或個人資料。</li>
            <li>干擾或破壞網站或伺服器的正常運作。</li>
            <li>傳播惡意軟體或進行未經授權的數據收集。</li>
            <li>進行任何違反法律法規的活動。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. 智慧財產權</h2>
          <p className="mb-2">關於網站內容的智慧財產權：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>本網站所有內容，包括但不限於文字、圖像、標誌、按鈕圖標、影像、音頻、數據編輯和軟件，均為本公司或其內容提供商的財產。</li>
            <li>未經本公司明確書面許可，禁止複製、修改、發布、傳輸、分發、展示或銷售本網站的任何內容。</li>
            <li>您可以為個人、非商業目的瀏覽和下載網站內容，前提是您保留所有版權和其他所有權聲明。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">7. 責任限制</h2>
          <p className="mb-2">關於我們的責任：</p>
          <ul className="list-disc list-inside space-y-2">
            <li>我們盡最大努力確保網站內容的準確性，但不保證網站內容不含錯誤或始終可用。</li>
            <li>在法律允許的最大範圍內，我們不對因使用或無法使用本網站而產生的任何直接、間接、特殊、附帶或衍生性損害承擔責任。</li>
            <li>我們不對第三方物流或支付服務的延誤或失誤負責，但會在合理範圍內協助解決問題。</li>
            <li>因不可抗力事件（如自然災害、罷工、戰爭等）導致的延誤或無法履行，我們不承擔責任。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. 合約終止與修改</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>我們保留隨時修改或終止服務（或其任何部分或內容）的權利，恕不另行通知。</li>
            <li>如您違反本服務條款，我們可能會終止您的帳號和使用權限。</li>
            <li>我們可能會不時更新這些服務條款。繼續使用網站即表示您接受修改後的條款。</li>
            <li>建議您定期查閱本服務條款以了解任何變更。</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">9. 準據法與管轄法院</h2>
          <p>
            本服務條款受中華民國法律管轄並依其解釋，不適用任何法律衝突原則。
            因本服務條款引起的或與之相關的任何爭議，應提交台灣桃園地方法院作為第一審管轄法院。
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">10. 完整協議</h2>
          <p>
            本服務條款構成您與本公司之間關於本網站使用的完整協議，並取代任何先前或同時期的通訊和提議，
            無論是口頭還是書面形式。本條款的任何部分被認定無效或不可執行，
            不影響其餘條款的有效性和可執行性。
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
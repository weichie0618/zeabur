import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { FranchiseForm } from "@/app/components/forms/FranchiseForm";
import { Heart, TrendingUp, Users, Award } from "lucide-react";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "加盟表單 | 晴朗家烘焙",
  description: "加入晴朗家烘焙加盟大家庭，開啟您的創業之旅",
  keywords: ["加盟", "創業", "合作", "加盟主"],
};

export default function FranchisePage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-orange to-sunny-gold text-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              加入晴朗家
            </h1>
            <p className="text-xl md:text-2xl mb-12">
              開啟屬於您自己的烘焙事業
            </p>

            <Button variant="secondary" size="lg">
              立即申請加盟
            </Button>
          </div>
        </div>
      </section>

      {/* Why Franchise */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            為什麼選擇加盟晴朗家
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[
              {
                icon: <Heart size={40} />,
                title: "深厚品牌基礎",
                description: "擁有口碑良好的品牌形象和客戶基礎，助您快速建立市場",
              },
              {
                icon: <TrendingUp size={40} />,
                title: "穩定獲利模式",
                description: "經過驗證的商業模式，確保穩定的營業利潤",
              },
              {
                icon: <Users size={40} />,
                title: "完整培訓支持",
                description: "提供全方位的培訓，從經營管理到技術指導",
              },
              {
                icon: <Award size={40} />,
                title: "持續營運協助",
                description: "駐點主管定期拜訪，提供持續的經營協助",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 p-8 bg-sunny-cream rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="text-sunny-orange flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-sunny-dark mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sunny-gray">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Franchise Benefits */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            加盟優勢
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-sunny-dark mb-6">
                📦 產品供應
              </h3>
              <ul className="space-y-3">
                {[
                  "穩定的產品供應",
                  "完整的產品線",
                  "季節性新品推出",
                  "優惠的批發價格",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sunny-gray">
                    <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-sunny-dark mb-6">
                🎓 培訓支持
              </h3>
              <ul className="space-y-3">
                {[
                  "初期經營培訓",
                  "員工培訓計畫",
                  "行銷推廣支援",
                  "技術更新培訓",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sunny-gray">
                    <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-sunny-dark mb-6">
                📊 營運管理
              </h3>
              <ul className="space-y-3">
                {[
                  "營運管理系統",
                  "銷售數據分析",
                  "庫存管理工具",
                  "客戶管理系統",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sunny-gray">
                    <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-sunny-dark mb-6">
                🛒 行銷協助
              </h3>
              <ul className="space-y-3">
                {[
                  "品牌行銷支持",
                  "促銷活動規劃",
                  "社交媒體內容",
                  "廣告素材提供",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sunny-gray">
                    <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            加盟資訊
          </h2>

          <div className="space-y-8">
            {[
              {
                title: "加盟金",
                info: "NT$100 萬 - 150 萬",
                description: "包括品牌授權、設備安裝、初期培訓",
              },
              {
                title: "投資總額",
                info: "NT$300 萬 - 500 萬",
                description: "包括租賃、裝潢、設備、初期營運資金",
              },
              {
                title: "回本期",
                info: "約 2 - 3 年",
                description: "根據地點和營運情況而異",
              },
              {
                title: "支援期限",
                info: "永久支援",
                description: "加盟期間及之後的持續經營支援",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="border-l-4 border-sunny-orange pl-6 py-4"
              >
                <h3 className="text-xl font-bold text-sunny-dark mb-2">
                  {item.title}
                </h3>
                <div className="text-2xl font-bold text-sunny-orange mb-2">
                  {item.info}
                </div>
                <p className="text-sunny-gray">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            常見問題
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "加盟需要烘焙經驗嗎？",
                a: "不需要！我們會提供完整的培訓和支援，包括烘焙技術、營運管理等",
              },
              {
                q: "加盟後可以改變產品嗎？",
                a: "可以在公司指導下進行，主要產品需遵循公司標準以維持品牌一致性",
              },
              {
                q: "加盟期間是多久？",
                a: "一般加盟期為 3 年，期滿後可續約或重新評估",
              },
              {
                q: "如果經營不善怎麼辦？",
                a: "公司會提供持續的營運協助，包括行銷、管理、技術等支援",
              },
            ].map((item, index) => (
              <details
                key={index}
                className="border border-sunny-border rounded-lg p-4 cursor-pointer hover:bg-white transition-colors"
              >
                <summary className="font-bold text-sunny-dark flex items-center justify-between">
                  {item.q}
                  <span>+</span>
                </summary>
                <p className="text-sunny-gray mt-4">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Franchise Form Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            加盟申請表
          </h2>
          <p className="text-center text-sunny-gray mb-12">
            填寫以下表單，我們會在 24 小時內與您聯繫進行詳細諮詢
          </p>

          <FranchiseForm />
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            加盟成功故事
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "李加盟主",
                location: "台北信義",
                story: "從上班族轉身創業，現已成功開設門市並實現財務自由",
              },
              {
                name: "王加盟主",
                location: "新竹東區",
                story: "利用在地優勢，成功建立客群，月營業額穩定成長",
              },
              {
                name: "陳加盟主",
                location: "台中西屯",
                story: "在公司支援下，順利應對市場挑戰，現已計畫擴展至第二店",
              },
            ].map((story, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sunny-gold">⭐</span>
                  ))}
                </div>
                <p className="text-sunny-gray mb-6 italic">
                  "{story.story}"
                </p>
                <div>
                  <p className="font-bold text-sunny-dark">{story.name}</p>
                  <p className="text-sm text-sunny-light-gray">{story.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            準備開啟您的創業之旅？
          </h2>
          <p className="text-xl mb-12">
            晴朗家期待與您一起成長，實現夢想
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:02-8722-8888"
              className="px-8 py-3 bg-sunny-gold text-sunny-dark font-semibold rounded-lg hover:bg-white transition-colors inline-block"
            >
              致電洽詢: 02-8722-8888
            </a>
            <a
              href="mailto:franchise@sunnyhausbakery.com.tw"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-sunny-orange transition-colors inline-block"
            >
              電郵: franchise@sunnyhausbakery.com.tw
            </a>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { InquiryForm } from "@/app/components/forms/InquiryForm";
import { CheckCircle, Zap, Award } from "lucide-react";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "代工烘培 | 晴朗家烘焙",
  description: "晴朗家烘焙代工烘培服務，提供客製化麵包製造方案",
  keywords: ["代工", "烘培", "客製化", "製造", "OEM"],
};

export default function OEMBakingPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              代工烘培
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              專業的客製化烘培方案
            </h1>
            <p className="text-lg text-sunny-gray">
              無論您需要什麼樣的麵包產品，我們都能為您量身打造
            </p>
          </div>
        </div>
      </section>

      {/* Service Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-sunny-dark mb-12">
            代工烘培服務
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <CheckCircle size={40} />,
                title: "產品開發",
                description: "從概念到成品，我們的專業團隊協助您開發理想的麵包產品",
              },
              {
                icon: <Zap size={40} />,
                title: "小量試生產",
                description: "在大規模生產前，進行小量試生產以確保品質",
              },
              {
                icon: <Award size={40} />,
                title: "大量生產",
                description: "穩定的大量生產能力，滿足您的市場需求",
              },
            ].map((service, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center text-sunny-orange mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-sunny-dark mb-4">
                  {service.title}
                </h3>
                <p className="text-sunny-gray">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-16">
            我們的合作流程
          </h2>

          <div className="space-y-8">
            {[
              {
                step: 1,
                title: "初期洽詢",
                description: "您向我們提出需求和想法，我們進行初步評估",
              },
              {
                step: 2,
                title: "配方開發",
                description: "我們的烘焙師傅根據您的需求開發配方",
              },
              {
                step: 3,
                title: "試生產",
                description: "進行小量試生產，確認品質符合預期",
              },
              {
                step: 4,
                title: "優化調整",
                description: "根據反饋進行必要的調整和優化",
              },
              {
                step: 5,
                title: "量產",
                description: "確認品質後開始大量生產",
              },
              {
                step: 6,
                title: "持續支持",
                description: "提供持續的技術支持和品質監控",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-sunny-orange text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-sunny-dark mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sunny-gray">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-sunny-dark mb-12">
            我們能提供的
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-sunny-dark mb-6">
                服務內容
              </h3>
              <ul className="space-y-4">
                {[
                  "客製化配方開發",
                  "選用最優質的食材",
                  "先進的烘焙設備",
                  "嚴格的品質控制",
                  "專業的生產團隊",
                  "完善的食品安全管理",
                  "靈活的生產計畫",
                  "持續的技術支持",
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-sunny-gray"
                  >
                    <div className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-sunny-dark mb-6">
                最小訂購要求
              </h3>
              <div className="space-y-4">
                {[
                  { label: "試生產", value: "100個起" },
                  { label: "小批量生產", value: "500個起" },
                  { label: "常規訂購", value: "1,000個起" },
                  { label: "生產週期", value: "2-3 週" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between p-4 bg-sunny-cream rounded-lg"
                  >
                    <span className="font-semibold text-sunny-dark">
                      {item.label}
                    </span>
                    <span className="text-sunny-orange font-bold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                q: "生產週期是多久？",
                a: "一般生產週期為 2-3 週，具體時間取決於訂購數量和複雜度",
              },
              {
                q: "有最小訂購限制嗎？",
                a: "試生產最低 100 個，小批量 500 個，常規訂購 1,000 個起",
              },
              {
                q: "可以客製化包裝嗎？",
                a: "可以！我們提供包裝客製化服務，需額外費用",
              },
              {
                q: "品質如何保證？",
                a: "每批產品都經過嚴格的品質檢測，我們提供品質保證",
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

      {/* Inquiry Form Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            詢價表單
          </h2>
          <p className="text-center text-sunny-gray mb-12">
            請填寫以下表單，我們會在 24 小時內與您聯繫
          </p>

          <InquiryForm inquiryType="oembaking" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            還有其他問題？
          </h2>
          <p className="text-lg mb-8">
            直接聯絡我們的商業開發團隊，我們很樂意為您解答
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:02-8722-8888"
              className="px-8 py-3 bg-sunny-gold text-sunny-dark font-semibold rounded-lg hover:bg-white transition-colors inline-block"
            >
              致電洽詢: 02-8722-8888
            </a>
            <a
              href="mailto:business@sunnyhausbakery.com.tw"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-sunny-orange transition-colors inline-block"
            >
              電郵: business@sunnyhausbakery.com.tw
            </a>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { InquiryForm } from "@/app/components/forms/InquiryForm";
import { Truck, BarChart3, Headphones } from "lucide-react";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "企業採購 | 晴朗家烘焙",
  description: "晴朗家烘焙企業採購服務，為餐飲業者和零售商提供優質麵包批發",
  keywords: ["企業採購", "批發", "B2B", "餐飲", "零售"],
};

export default function CorporateProcurementPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              企業採購
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              穩定供應 優質批發
            </h1>
            <p className="text-lg text-sunny-gray">
              為餐飲業者、零售商和企業提供最優質的麵包批發服務
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-sunny-dark mb-12">
            為什麼選擇晴朗家企業採購
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Truck size={40} />,
                title: "穩定供應",
                description: "擁有現代化的生產設備，確保穩定和持續的產品供應",
              },
              {
                icon: <BarChart3 size={40} />,
                title: "具競爭力的價格",
                description: "規模化生產帶來的成本優勢，提供最具競爭力的批發價格",
              },
              {
                icon: <Headphones size={40} />,
                title: "專人客服",
                description: "獲得專人客服支持，快速解決您的任何問題",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center text-sunny-orange mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-sunny-dark mb-4">
                  {item.title}
                </h3>
                <p className="text-sunny-gray">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Range */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            企業採購產品系列
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[
              {
                series: "經典系列",
                products: ["原味麵包", "全麥麵包", "雜糧麵包"],
              },
              {
                series: "特色系列",
                products: ["核桃麵包", "起司麵包", "黑麥酸種"],
              },
              {
                series: "甜味系列",
                products: ["蜂蜜麵包", "肉桂卷", "葡萄乾麵包"],
              },
              {
                series: "健康系列",
                products: ["全麥健康麵包", "無糖麵包", "低鈉麵包"],
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-md"
              >
                <h3 className="text-xl font-bold text-sunny-dark mb-6">
                  {item.series}
                </h3>
                <ul className="space-y-3">
                  {item.products.map((product, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-sunny-gray"
                    >
                      <div className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      {product}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            企業合作優勢
          </h2>

          <div className="space-y-6">
            {[
              {
                title: "批發價格優惠",
                description: "依訂購量級提供不同的優惠折扣，訂量越大優惠越多",
              },
              {
                title: "靈活訂購方案",
                description: "支援單次採購或定期配送，可根據需求調整配送頻率",
              },
              {
                title: "專屬賬戶經理",
                description: "指派專屬客服負責您的帳戶，提供一對一的服務",
              },
              {
                title: "品質保證",
                description: "每批產品都經過嚴格品質檢測，提供品質保障",
              },
              {
                title: "送貨服務",
                description: "提供配送服務，確保產品新鮮送達您的門店",
              },
              {
                title: "行銷支持",
                description: "提供海報、廣告素材等行銷工具，幫助您推廣銷售",
              },
            ].map((benefit, index) => (
              <div key={index} className="border-l-4 border-sunny-orange pl-6 py-2">
                <h3 className="text-lg font-bold text-sunny-dark mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sunny-gray">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Info */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            批發價格級距
          </h2>

          <div className="space-y-4">
            {[
              { quantity: "100-500個", discount: "8 折" },
              { quantity: "500-1,000個", discount: "7.5 折" },
              { quantity: "1,000-5,000個", discount: "7 折" },
              { quantity: "5,000個以上", discount: "6.5 折 (另議)" },
            ].map((tier, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="font-semibold text-sunny-dark">{tier.quantity}</span>
                <span className="text-2xl font-bold text-sunny-orange">
                  {tier.discount}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-sunny-gray text-sm mt-8">
            * 價格為參考，實際價格依商品類型及訂購量而定
          </p>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            企業客戶見證
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "城市漢堡",
                role: "連鎖餐飲",
                testimonial: "晴朗家的麵包品質穩定，是我們最信任的供應商",
              },
              {
                name: "精品咖啡館",
                role: "咖啡廳",
                testimonial: "送貨準時，客服專業，合作非常愉快",
              },
              {
                name: "便利商店",
                role: "零售商",
                testimonial: "批發價格合理，產品銷售量不錯",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-sunny-cream p-8 rounded-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sunny-gold">⭐</span>
                  ))}
                </div>
                <p className="text-sunny-gray mb-6 italic">
                  "{testimonial.testimonial}"
                </p>
                <div>
                  <p className="font-bold text-sunny-dark">{testimonial.name}</p>
                  <p className="text-sm text-sunny-light-gray">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            企業採購詢價
          </h2>
          <p className="text-center text-sunny-gray mb-12">
            請填寫以下表單，我們會在 24 小時內與您聯繫
          </p>

          <InquiryForm inquiryType="corporate-procurement" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            立即開始企業採購
          </h2>
          <p className="text-lg mb-8">
            讓晴朗家成為您的長期合作夥伴
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:02-8722-8888"
              className="px-8 py-3 bg-sunny-gold text-sunny-dark font-semibold rounded-lg hover:bg-white transition-colors inline-block"
            >
              致電: 02-8722-8888
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


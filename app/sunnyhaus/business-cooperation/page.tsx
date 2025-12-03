import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Briefcase, Package, Users } from "lucide-react";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";

export const metadata: Metadata = {
  title: "商業合作 | 晴朗家烘焙",
  description: "晴朗家烘焙商業合作方案，包括代工烘培和企業採購服務",
  keywords: ["商業合作", "代工", "企業採購", "合作"],
};

export default function BusinessCooperationPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-orange to-sunny-gold text-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              商業合作方案
            </h1>
            <p className="text-xl md:text-2xl mb-12">
              我們準備好與您一起創造新的可能性
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sunnyhaus/business-cooperation/oembaking">
                <Button variant="secondary" size="lg">
                  代工烘培
                </Button>
              </Link>
              <Link href="/sunnyhaus/business-cooperation/corporate-procurement">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-sunny-orange"
                >
                  企業採購
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            我們的商業服務
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* OEM Baking */}
            <Link href="/sunnyhaus/business-cooperation/oembaking">
              <Card hover className="cursor-pointer h-full">
                <Card.Body>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-sunny-cream flex items-center justify-center">
                      <Package className="text-sunny-orange" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-sunny-dark">
                      代工烘培
                    </h3>
                  </div>

                  <p className="text-sunny-gray mb-6 leading-relaxed">
                    無論您需要的是產品開發、小量試生產，還是大量生產，我們都能根據您的需求量身訂製最適合的方案。
                  </p>

                  <ul className="space-y-3 text-sm text-sunny-gray mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      客製化配方開發
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      專業生產製造
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      品質控制保證
                    </li>
                  </ul>

                  <div className="pt-4 border-t border-sunny-border">
                    <span className="text-sunny-orange font-semibold">
                      了解更多 →
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Link>

            {/* Corporate Procurement */}
            <Link href="/sunnyhaus/business-cooperation/corporate-procurement">
              <Card hover className="cursor-pointer h-full">
                <Card.Body>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-sunny-cream flex items-center justify-center">
                      <Users className="text-sunny-orange" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-sunny-dark">
                      企業採購
                    </h3>
                  </div>

                  <p className="text-sunny-gray mb-6 leading-relaxed">
                    為企業、餐飲業者和零售商提供優質的麵包產品。我們提供穩定的供應、具競爭力的價格和優質的服務。
                  </p>

                  <ul className="space-y-3 text-sm text-sunny-gray mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      批發價格優惠
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      穩定供應保證
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunny-orange flex-shrink-0" />
                      專人客服支持
                    </li>
                  </ul>

                  <div className="pt-4 border-t border-sunny-border">
                    <span className="text-sunny-orange font-semibold">
                      了解更多 →
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </div>

          {/* Franchise Option */}
          <div className="bg-sunny-cream p-8 rounded-lg text-center mb-8">
            <div className="flex justify-center mb-4">
              <Briefcase className="text-sunny-orange" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-sunny-dark mb-4">
              加盟合作
            </h3>
            <p className="text-sunny-gray mb-6 max-w-2xl mx-auto">
              想成為晴朗家的加盟主？我們提供完整的加盟支持、培訓和持續協助，幫助您成功經營屬於自己的晴朗家門市。
            </p>
            <Link href="/sunnyhaus/get-join">
              <Button variant="primary" size="lg">
                申請加盟
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            為什麼選擇晴朗家
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "品質保證",
                description: "嚴格的品質控制流程，確保每一批產品都符合標準",
              },
              {
                title: "技術支持",
                description: "擁有專業的烘焙團隊，提供全方位的技術支持",
              },
              {
                title: "靈活合作",
                description: "根據合作夥伴的需求，提供客製化的合作方案",
              },
              {
                title: "穩定供應",
                description: "擁有現代化的生產設備，確保穩定的產品供應",
              },
              {
                title: "成本優勢",
                description: "規模化生產帶來的成本優勢，提供具競爭力的價格",
              },
              {
                title: "全面服務",
                description: "從詢價到交付，提供完整的商業服務",
              },
            ].map((item, index) => (
              <Card key={index} hover>
                <Card.Body>
                  <h3 className="text-xl font-bold text-sunny-dark mb-4">
                    {item.title}
                  </h3>
                  <p className="text-sunny-gray">{item.description}</p>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            準備好開始合作了嗎？
          </h2>
          <p className="text-xl mb-12">
            聯絡我們的商業開發團隊，討論最適合您的合作方案
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              立即詢價
            </Button>
            <a
              href="tel:02-8722-8888"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-sunny-orange transition-colors inline-block"
            >
              致電洽詢
            </a>
          </div>

          <p className="text-sm mt-12 opacity-90">
            商業合作熱線：02-8722-8888  
            電子郵件：business@sunnyhausbakery.com.tw
          </p>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


import { Metadata } from "next";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { CategoryTabs } from "./CategoryTabs";

export const metadata: Metadata = {
  title: "產品介紹 | 晴朗家烘焙",
  description: "探索晴朗家烘焙的精選麵包產品，包括吐司、沙瓦豆、軟歐、台包、台式創意、法棍、可頌、雜糧和甜點系列",
  keywords: ["麵包", "烘焙", "產品", "吐司", "可頌", "法棍", "甜點", "麵包系列"],
};

export default function BakeryItemsPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              產品介紹
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              我們的烘焙產品
            </h1>
            <p className="text-lg text-sunny-gray">
              每一個麵包都是用心製作，以新鮮食材和傳統工藝呈現最佳風味
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs and Products */}
      <CategoryTabs />

      {/* Features Section */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            為什麼選擇晴朗家麵包
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "新鮮食材",
                description: "嚴選優質食材，每日新鮮製作",
                icon: "🌾",
              },
              {
                title: "傳統工藝",
                description: "傳承烘焙手藝，結合現代創新",
                icon: "👨‍🍳",
              },
              {
                title: "無添加",
                description: "不使用人工香料和防腐劑",
                icon: "✨",
              },
              {
                title: "新鮮配送",
                description: "確保品質，新鮮送到您的手中",
                icon: "📦",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-sunny-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-sunny-gray">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            訂閱定期配送計劃
          </h2>
          <p className="text-lg mb-8">
            每週都能享受新鮮出爐的麵包，並享受會員專屬優惠！
          </p>

          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="請輸入您的電子郵件"
              className="flex-1 px-4 py-3 rounded-lg text-sunny-dark focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-sunny-gold text-sunny-dark font-semibold rounded-lg hover:bg-white transition-colors"
            >
              立即訂閱
            </button>
          </form>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


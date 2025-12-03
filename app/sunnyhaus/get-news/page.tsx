import { Metadata } from "next";
import Link from "next/link";
import { news } from "@/app/data/news";
import { NewsCard } from "@/app/components/cards/NewsCard";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";

export const metadata: Metadata = {
  title: "最新消息 | 晴朗家烘焙",
  description: "追蹤晴朗家烘焙的最新消息、活動、優惠和新聞發布",
  keywords: ["新聞", "消息", "活動", "優惠", "烘焙"],
};

export default function NewsPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              最新消息
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              晴朗家的最新動態
            </h1>
            <p className="text-lg text-sunny-gray">
              掌握晴朗家烘焙的最新消息、活動、優惠和新聞發布
            </p>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* 分類篩選 (可選) */}
          <div className="mb-12 flex flex-wrap gap-2 justify-center">
            <Link href="/sunnyhaus/get-news">
              <button className="px-4 py-2 rounded-full bg-sunny-orange text-white font-semibold hover:bg-sunny-gold transition-colors">
                全部
              </button>
            </Link>
            {["活動新聞", "合作新聞", "開店新聞", "優惠新聞"].map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full border-2 border-sunny-orange text-sunny-orange hover:bg-sunny-cream transition-colors font-semibold"
              >
                {category}
              </button>
            ))}
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {news.map((item, index) => (
              <div key={item.id} className={index === 0 ? "md:col-span-2 lg:col-span-1" : ""}>
                <NewsCard
                  id={item.id}
                  title={item.title}
                  excerpt={item.excerpt}
                  image={item.image}
                  imageAlt={item.imageAlt}
                  date={item.publishedAt}
                  author={item.author}
                  slug={item.slug}
                  featured={item.featured}
                />
              </div>
            ))}
          </div>

          {/* Pagination (簡化版) */}
          <div className="flex justify-center items-center gap-2">
            <button className="px-4 py-2 rounded-lg border-2 border-sunny-border hover:border-sunny-orange text-sunny-orange transition-colors font-semibold disabled:opacity-50">
              ← 上一頁
            </button>
            <div className="flex gap-1">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                    page === 1
                      ? "bg-sunny-orange text-white"
                      : "border-2 border-sunny-border hover:border-sunny-orange text-sunny-dark"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 rounded-lg border-2 border-sunny-border hover:border-sunny-orange text-sunny-orange transition-colors font-semibold">
              下一頁 →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-sunny-dark mb-6">
            訂閱我們的最新消息
          </h2>
          <p className="text-lg text-sunny-gray mb-8 max-w-2xl mx-auto">
            不想錯過任何優惠和活動？立即訂閱我們的電子報，第一時間掌握晴朗家的最新動態！
          </p>

          <form className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="請輸入您的電子郵件"
              className="flex-1 px-4 py-3 rounded-lg border-2 border-sunny-border focus:border-sunny-orange focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-sunny-orange text-white font-semibold rounded-lg hover:bg-sunny-gold transition-colors"
            >
              訂閱
            </button>
          </form>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


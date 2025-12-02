import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { news } from "@/app/data/news";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/components/layout/Footer";

interface NewsDetailPageProps {
  params: {
    slug: string;
  };
}

// 生成靜態參數
export async function generateStaticParams() {
  return news.map((item) => ({
    slug: item.slug,
  }));
}

// 生成元數據
export async function generateMetadata(
  { params }: NewsDetailPageProps
): Promise<Metadata> {
  const newsItem = news.find((n) => n.slug === params.slug);

  if (!newsItem) {
    return {
      title: "未找到 | 晴朗家烘焙",
    };
  }

  return {
    title: `${newsItem.title} | 晴朗家烘焙`,
    description: newsItem.excerpt,
    keywords: [newsItem.category, "新聞", "晴朗家"],
    openGraph: {
      title: newsItem.title,
      description: newsItem.excerpt,
      images: [newsItem.image],
    },
  };
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const newsItem = news.find((n) => n.slug === params.slug);

  if (!newsItem) {
    notFound();
  }

  // 獲取相關新聞 (同分類的其他新聞)
  const relatedNews = news
    .filter((n) => n.category === newsItem.category && n.id !== newsItem.id)
    .slice(0, 3);

  return (
    <>
      <Navbar />
      <main>
      {/* Breadcrumb */}
      <div className="bg-sunny-cream py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-sunny-gray">
            <Link href="/" className="hover:text-sunny-orange transition-colors">
              首頁
            </Link>
            <span>/</span>
            <Link
              href="/sunnyhaus/get-news"
              className="hover:text-sunny-orange transition-colors"
            >
              最新消息
            </Link>
            <span>/</span>
            <span className="text-sunny-orange font-semibold truncate">
              {newsItem.title}
            </span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/sunnyhaus/get-news"
          className="inline-flex items-center gap-2 text-sunny-orange hover:text-sunny-gold transition-colors font-semibold"
        >
          <ArrowLeft size={20} />
          返回消息列表
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-96 md:h-[500px] bg-gray-200">
        <Image
          src={newsItem.image}
          alt={newsItem.imageAlt}
          fill
          className="object-cover"
          priority
        />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-sunny-orange text-white px-4 py-2 rounded-full text-sm font-semibold">
          {newsItem.category}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-20 bg-white">
        <article className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              {newsItem.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6 text-sm text-sunny-light-gray border-b border-sunny-border pb-6">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-sunny-orange" />
                <span>{formatDate(newsItem.publishedAt, "YYYY年MM月DD日")}</span>
              </div>

              <div className="flex items-center gap-2">
                <User size={18} className="text-sunny-orange" />
                <span>{newsItem.author}</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            {newsItem.content.split("\n\n").map((paragraph, index) => (
              <p
                key={index}
                className="text-sunny-gray leading-relaxed mb-6 whitespace-pre-wrap"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Share Section */}
          <div className="border-t border-sunny-border pt-8 mb-12">
            <div className="flex items-center gap-4">
              <span className="text-sunny-dark font-semibold">分享此文章:</span>
              <div className="flex gap-2">
                <button className="p-3 rounded-lg bg-sunny-cream hover:bg-sunny-orange hover:text-white transition-colors">
                  <span className="text-sm">Facebook</span>
                </button>
                <button className="p-3 rounded-lg bg-sunny-cream hover:bg-sunny-orange hover:text-white transition-colors">
                  <span className="text-sm">LINE</span>
                </button>
                <button className="p-3 rounded-lg bg-sunny-cream hover:bg-sunny-orange hover:text-white transition-colors">
                  <span className="text-sm">複製連結</span>
                </button>
              </div>
            </div>
          </div>

          {/* Author Info */}
          <div className="bg-sunny-cream p-6 rounded-lg mb-12">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full bg-sunny-orange flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {newsItem.author.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-sunny-dark">{newsItem.author}</h3>
                <p className="text-sunny-gray">
                  晴朗家烘焙官方帳號，分享最新的烘焙動態、產品資訊和優惠活動。
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Related News Section */}
      {relatedNews.length > 0 && (
        <section className="py-20 bg-sunny-cream">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-sunny-dark mb-12">
              相關消息
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedNews.map((relatedItem) => (
                <Link
                  key={relatedItem.id}
                  href={`/sunnyhaus/get-news/${relatedItem.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all">
                    <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                      <Image
                        src={relatedItem.image}
                        alt={relatedItem.imageAlt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sunny-dark mb-2 line-clamp-2 group-hover:text-sunny-orange transition-colors">
                        {relatedItem.title}
                      </h3>
                      <p className="text-sm text-sunny-gray line-clamp-2">
                        {relatedItem.excerpt}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            想了解更多關於晴朗家的消息嗎？
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            追蹤我們的社交媒體，掌握最新的優惠和活動資訊！
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = "https://www.facebook.com/SunnyHausBakery"}
            >
              追蹤 Facebook
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = "https://www.instagram.com/SunnyHausBakery"}
            >
              追蹤 Instagram
            </Button>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


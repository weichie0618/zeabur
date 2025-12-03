import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, transformWordPressPost } from '@/lib/wordpress-graphql';
import type { NewsArticle } from '@/app/shared/types/news';
import { NewsCard } from '@/app/components/cards/NewsCard';
import { Navbar } from '@/app/components/sections/Navbar';
import { Footer } from '@/app/components/layout/Footer';

export const metadata: Metadata = {
  title: '最新消息 | 晴朗家烘焙',
  description: '「晴朗家烘焙最新消息」頁面為您提供最新的活動、產品發布和公司動態，了解我們最新的烘焙產品和促銷活動，隨時掌握第一手資訊。',
  keywords: '晴朗家烘焙, 最新消息, 活動資訊, 烘焙新聞, 產品資訊, 門市活動',
  alternates: {
    canonical: 'https://sunnyhausbakery.com.tw/sunnyhaus/get-news',
  },
  openGraph: {
    title: '最新消息 | 晴朗家烘焙',
    description: '「晴朗家烘焙最新消息」頁面為您提供最新的活動、產品發布和公司動態，了解我們最新的烘焙產品和促銷活動，隨時掌握第一手資訊。',
    url: 'https://sunnyhausbakery.com.tw/sunnyhaus/get-news',
    siteName: '晴朗家烘焙',
    images: [
      {
        url: 'https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/1800X400.png',
        width: 1800,
        height: 400,
        alt: '晴朗家烘焙 - 最新消息',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '最新消息 | 晴朗家烘焙',
    description: '「晴朗家烘焙最新消息」頁面為您提供最新的活動、產品發布和公司動態。',
    images: ['https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/1800X400.png'],
  },
};

// ISR: 每 60 秒重新驗證一次
export const revalidate = 60;

// 每頁顯示的文章數量
const POSTS_PER_PAGE = 10;

// 截取摘要文字（2-3行，約 150 字元）
function getExcerpt(text: string, maxLength = 150): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 獲取當前頁碼 (Next.js 15 中 searchParams 是 Promise)
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const page = Math.max(1, currentPage);

  // 從 WordPress 獲取所有文章（用於分頁計算）
  const allPosts = await getPosts(100);
  const allNewsData = allPosts
    .map(transformWordPressPost)
    .filter((article: NewsArticle | null): article is NewsArticle => article !== null);

  // 計算分頁
  const totalPosts = allNewsData.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const newsData = allNewsData.slice(startIndex, endIndex);

  // ItemList Schema 結構化數據
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '晴朗家烘焙最新消息',
    description: '「晴朗家烘焙最新消息」頁面為您提供最新的活動、產品發布和公司動態',
    url: 'https://sunnyhausbakery.com.tw/sunnyhaus/get-news',
    numberOfItems: newsData.length,
    itemListElement: newsData.slice(0, 10).map((article: NewsArticle, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://sunnyhausbakery.com.tw/sunnyhaus/get-news/${article.slug}`,
      name: article.title,
      image: article.thumbnail,
    })),
  };

  // BreadcrumbList Schema 結構化數據
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首頁',
        item: 'https://sunnyhausbakery.com.tw',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '最新消息',
        item: 'https://sunnyhausbakery.com.tw/sunnyhaus/get-news',
      },
    ],
  };

  return (
    <>
      {/* ItemList Schema 結構化數據 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      
      {/* BreadcrumbList Schema 結構化數據 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

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
            {newsData.length > 0 ? (
              <>
                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {newsData.map((article, index) => (
                    <div key={article.id} className={index === 0 ? "md:col-span-2 lg:col-span-1" : ""}>
                      <NewsCard
                        id={article.id}
                        title={article.title}
                        excerpt={getExcerpt(article.excerpt)}
                        image={article.thumbnail || '/images/最新消息.jpg'}
                        imageAlt={article.title}
                        date={article.date}
                        author={article.author}
                        slug={article.slug}
                        featured={article.featured}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    {page > 1 && (
                      <Link
                        href={page === 2 ? '/sunnyhaus/get-news' : `/sunnyhaus/get-news?page=${page - 1}`}
                        className="px-4 py-2 rounded-lg border-2 border-sunny-border hover:border-sunny-orange text-sunny-orange transition-colors font-semibold"
                      >
                        ← 上一頁
                      </Link>
                    )}
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        pageNum === page ? (
                          <span
                            key={pageNum}
                            className="w-10 h-10 rounded-lg font-semibold bg-sunny-orange text-white flex items-center justify-center"
                          >
                            {pageNum}
                          </span>
                        ) : (
                          <Link
                            key={pageNum}
                            href={pageNum === 1 ? '/sunnyhaus/get-news' : `/sunnyhaus/get-news?page=${pageNum}`}
                            className="w-10 h-10 rounded-lg font-semibold border-2 border-sunny-border hover:border-sunny-orange text-sunny-dark flex items-center justify-center transition-colors"
                          >
                            {pageNum}
                          </Link>
                        )
                      ))}
                    </div>
                    {page < totalPages && (
                      <Link
                        href={`/sunnyhaus/get-news?page=${page + 1}`}
                        className="px-4 py-2 rounded-lg border-2 border-sunny-border hover:border-sunny-orange text-sunny-orange transition-colors font-semibold"
                      >
                        下一頁 →
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 md:py-16">
                <div className="text-5xl md:text-6xl mb-4">📰</div>
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-sunny-orange">
                  目前沒有消息
                </h2>
                <p className="text-sm md:text-base text-sunny-gray">
                  請稍後再回來查看
                </p>
              </div>
            )}
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

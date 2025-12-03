import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPosts, transformWordPressPost } from '@/lib/wordpress-graphql';
import type { NewsArticle } from '@/app/shared/types/news';
import { formatRelativeTime } from '@/app/shared/utils/newsUtils';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import SocialShare from '@/app/components/SocialShare';
import { Navbar } from '@/app/components/sections/Navbar';
import { Footer } from '@/app/components/layout/Footer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // 解碼 URL 編碼的 slug（處理中文和特殊字符）
  const decodedSlug = decodeURIComponent(slug);
  const wpPost = await getPostBySlug(decodedSlug);
  const article = transformWordPressPost(wpPost);
  
  if (!article) {
    return {
      title: '文章不存在 | 晴朗家烘焙',
    };
  }

  const articleUrl = `https://sunnyhausbakery.com.tw/sunnyhaus/get-news/${article.slug}`;
  const publishedDate = new Date(article.date).toISOString();

  return {
    title: `${article.title} | 晴朗家烘焙`,
    description: article.excerpt,
    keywords: article.tags.join(', '),
    alternates: {
      canonical: articleUrl,
    },
    authors: [{ name: '晴朗家烘焙' }],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      siteName: '晴朗家烘焙',
      locale: 'zh_TW',
      type: 'article',
      publishedTime: publishedDate,
      modifiedTime: publishedDate,
      authors: ['晴朗家烘焙'],
      section: article.category,
      tags: article.tags,
      images: [
        {
          url: article.thumbnail,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.thumbnail],
    },
  };
}

export const revalidate = 60;

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    // 解碼 URL 編碼的 slug（如果需要）
    const decodedSlug = decodeURIComponent(slug);
    
    console.log('Loading article with slug:', decodedSlug);
    
    const wpPost = await getPostBySlug(decodedSlug);
    
    if (!wpPost) {
      console.error(`Post not found for slug: ${decodedSlug}`);
      notFound();
    }
    
    const article = transformWordPressPost(wpPost);
    
    if (!article) {
      console.error(`Failed to transform post for slug: ${decodedSlug}`);
      notFound();
    }

    // 獲取所有文章以找到上一篇和下一篇
    const allPosts = await getPosts(100);
    const allArticles = allPosts
      .map(transformWordPressPost)
      .filter((a: NewsArticle | null): a is NewsArticle => a !== null)
      .sort((a: NewsArticle, b: NewsArticle) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 找到當前文章的索引
    const currentIndex = allArticles.findIndex((a: NewsArticle) => a.slug === article.slug);
    
    // 獲取上一篇和下一篇
    const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
    const nextArticle = currentIndex < allArticles.length - 1 && currentIndex >= 0 ? allArticles[currentIndex + 1] : null;

    // 獲取相關新聞 (同分類的其他新聞)
    const relatedNews = allArticles
      .filter((n) => n.category === article.category && n.id !== article.id)
      .slice(0, 3);

    // Article Schema 結構化數據
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.excerpt,
      image: article.thumbnail,
      datePublished: new Date(article.date).toISOString(),
      dateModified: new Date(article.date).toISOString(),
      author: {
        '@type': 'Organization',
        name: '晴朗家烘焙',
        url: 'https://sunnyhausbakery.com.tw',
      },
      publisher: {
        '@type': 'Organization',
        name: '晴朗家烘焙',
        logo: {
          '@type': 'ImageObject',
          url: 'https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/晴朗家-LOGO-1比1-e1725508365820.jpg',
          width: 512,
          height: 512,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://sunnyhausbakery.com.tw/sunnyhaus/get-news/${article.slug}`,
      },
      articleSection: article.category,
      keywords: article.tags.join(', '),
      inLanguage: 'zh-TW',
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
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `https://sunnyhausbakery.com.tw/sunnyhaus/get-news/${article.slug}`,
        },
      ],
    };

    return (
      <>
        {/* Article Schema 結構化數據 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleSchema),
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
                  {article.title}
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
              src={article.thumbnail || '/images/最新消息.jpg'}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />

            {/* Category Badge */}
            <div className="absolute top-4 left-4 bg-sunny-orange text-white px-4 py-2 rounded-full text-sm font-semibold">
              {article.category}
            </div>
          </section>

          {/* Content Section */}
          <section className="py-12 md:py-20 bg-white">
            <article className="container mx-auto px-4 max-w-3xl">
              {/* Header */}
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
                  {article.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap gap-6 text-sm text-sunny-light-gray border-b border-sunny-border pb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-sunny-orange" />
                    <span>{formatDate(article.date, 'YYYY年MM月DD日')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User size={18} className="text-sunny-orange" />
                    <span>{article.author}</span>
                  </div>
                </div>
              </header>

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none mb-12 news-content"
                dangerouslySetInnerHTML={{ __html: article.content || article.excerpt }}
              />

              {/* Share Section */}
              <div className="border-t border-sunny-border pt-8 mb-12">
                <SocialShare 
                  title={article.title} 
                  url={`https://sunnyhausbakery.com.tw/sunnyhaus/get-news/${article.slug}`} 
                />
              </div>

              {/* Author Info */}
              <div className="bg-sunny-cream p-6 rounded-lg mb-12">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-sunny-orange flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-sunny-dark">{article.author}</h3>
                    <p className="text-sunny-gray">
                      晴朗家烘焙官方帳號，分享最新的烘焙動態、產品資訊和優惠活動。
                    </p>
                  </div>
                </div>
              </div>

              {/* Previous/Next Navigation */}
              {(prevArticle || nextArticle) && (
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-12 border-t border-sunny-border pt-8">
                  <div className="flex-1">
                    {prevArticle ? (
                      <Link 
                        href={`/sunnyhaus/get-news/${prevArticle.slug}`}
                        className="group flex items-center gap-2 p-3 md:p-4 rounded-lg transition-all duration-200 hover:shadow-md bg-sunny-cream"
                      >
                        <div className="flex-shrink-0">
                          <ArrowLeft size={20} className="text-sunny-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm mb-1 text-sunny-gray">上一篇</div>
                          <div className="font-semibold line-clamp-2 text-sunny-dark group-hover:text-sunny-orange">
                            {prevArticle.title}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-3 md:p-4 rounded-lg opacity-50 bg-sunny-cream">
                        <div className="text-xs md:text-sm mb-1 text-sunny-gray">上一篇</div>
                        <div className="text-sm text-sunny-gray">沒有更多文章</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {nextArticle ? (
                      <Link 
                        href={`/sunnyhaus/get-news/${nextArticle.slug}`}
                        className="group flex items-center gap-2 p-3 md:p-4 rounded-lg transition-all duration-200 hover:shadow-md bg-sunny-cream md:text-right"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm mb-1 text-sunny-gray">下一篇</div>
                          <div className="font-semibold line-clamp-2 text-sunny-dark group-hover:text-sunny-orange">
                            {nextArticle.title}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ArrowLeft size={20} className="text-sunny-orange rotate-180" />
                        </div>
                      </Link>
                    ) : (
                      <div className="p-3 md:p-4 rounded-lg opacity-50 bg-sunny-cream md:text-right">
                        <div className="text-xs md:text-sm mb-1 text-sunny-gray">下一篇</div>
                        <div className="text-sm text-sunny-gray">沒有更多文章</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                            src={relatedItem.thumbnail || '/images/最新消息.jpg'}
                            alt={relatedItem.title}
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
                <a
                  href="https://www.facebook.com/SunnyHausBakery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors font-medium"
                >
                  追蹤 Facebook
                </a>
                <a
                  href="https://www.instagram.com/SunnyHausBakery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors font-medium"
                >
                  追蹤 Instagram
                </a>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  } catch (error) {
    console.error('Error loading article:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    notFound();
  }
}

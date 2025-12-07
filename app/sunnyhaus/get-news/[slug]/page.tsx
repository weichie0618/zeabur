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
        <main className="font-sans">
          {/* Hero Section - 溫暖漸層背景 */}
          <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
            {/* 背景漸層 */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100" />
            
            {/* 裝飾性圓形 */}
            <div className="absolute top-20 right-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-200/40 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl" />
            
            {/* 麵包紋理疊加 */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23d97706' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="container mx-auto px-4 pt-16 xl:pt-24 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                {/* <span className="inline-block px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-full mb-6">
                  {article.category}
                </span> */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 leading-tight">
                  {article.title}
                </h1>
                {/* <p className="text-lg text-amber-800/70 mb-8 max-w-2xl mx-auto">{article.excerpt}</p> */}
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Calendar size={18} />
                  <span>{formatDate(article.date, 'YYYY年MM月DD日')}</span>
                </div>
              </div>
            </div>

            {/* 波浪分隔 */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path
                  d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                  fill="white"
                />
              </svg>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-12 md:py-20 bg-white">
            <article className="container mx-auto px-4 max-w-3xl">
              {/* Content */}
              <div className="prose prose-lg prose-amber max-w-none mb-12">
                <div 
                  className="news-content"
                  dangerouslySetInnerHTML={{ __html: article.content || article.excerpt }}
                />
              </div>

              {/* Share Section */}
              <div className="border-t border-amber-100 pt-8 mb-12">
                <p className="text-amber-800 font-medium mb-4">分享這篇文章</p>
                <SocialShare 
                  title={article.title} 
                  url={`https://sunnyhausbakery.com.tw/sunnyhaus/get-news/${article.slug}`} 
                />
              </div>

              

              {/* Previous/Next Navigation */}
              {(prevArticle || nextArticle) && (
                <div className="grid md:grid-cols-2 gap-4 mb-12">
                  {prevArticle ? (
                    <Link 
                      href={`/sunnyhaus/get-news/${prevArticle.slug}`}
                      className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <ArrowLeft size={20} className="text-amber-500" />
                        <div>
                          <p className="text-xs text-amber-600 mb-1">上一篇</p>
                          <p className="font-semibold text-amber-900 group-hover:text-amber-700 line-clamp-2">
                            {prevArticle.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl opacity-50">
                      <div className="flex items-center gap-3">
                        <ArrowLeft size={20} className="text-amber-500" />
                        <div>
                          <p className="text-xs text-amber-600 mb-1">上一篇</p>
                          <p className="text-sm text-amber-700">沒有更多文章</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {nextArticle ? (
                    <Link 
                      href={`/sunnyhaus/get-news/${nextArticle.slug}`}
                      className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer group text-right"
                    >
                      <div className="flex items-center justify-end gap-3">
                        <div>
                          <p className="text-xs text-amber-600 mb-1">下一篇</p>
                          <p className="font-semibold text-amber-900 group-hover:text-amber-700 line-clamp-2">
                            {nextArticle.title}
                          </p>
                        </div>
                        <ArrowLeft size={20} className="text-amber-500 rotate-180" />
                      </div>
                    </Link>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl opacity-50 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div>
                          <p className="text-xs text-amber-600 mb-1">下一篇</p>
                          <p className="text-sm text-amber-700">沒有更多文章</p>
                        </div>
                        <ArrowLeft size={20} className="text-amber-500 rotate-180" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          </section>

          {/* Related News Section */}
          {relatedNews.length > 0 && (
            <section className="py-20 bg-gradient-to-b from-amber-50 to-orange-50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-amber-900 mb-12 text-center">相關消息</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {relatedNews.map((item) => (
                    <Link
                      key={item.id}
                      href={`/sunnyhaus/get-news/${item.slug}`}
                      className="group"
                    >
                      <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <div className="relative h-48 sm:h-96 md:h-56 lg:h-64 xl:h-72 overflow-hidden">
                          <Image
                            src={item.thumbnail || '/images/最新消息.jpg'}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-amber-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-amber-700/70 line-clamp-2">
                            {item.excerpt}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          
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

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { NewsCard } from '@/app/components/cards/NewsCard';
import { getPosts, transformWordPressPost } from '@/lib/wordpress-graphql';
import type { NewsArticle } from '@/app/shared/types/news';

/**
 * NewsSection 最新消息區塊組件
 * 顯示首頁的最新消息列表（從 WordPress 獲取最新的3則訊息）
 */
export default function NewsSection() {
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 截取摘要文字（約 100 字元）
  function getExcerpt(text: string, maxLength = 100): string {
    if (!text) return '';
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  // 在客戶端獲取數據
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 獲取最新的3則訊息
        const posts = await getPosts(3);
        const transformed = posts
          .map(transformWordPressPost)
          .filter((article: NewsArticle | null): article is NewsArticle => article !== null);
        setNewsData(transformed);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('無法載入最新消息');
        setNewsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section 
      className="py-20 relative bg-amber-50 overflow-hidden"
      style={{
        backgroundImage: 'url(https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/Untitled-design-3.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* 半透明覆蓋層，確保內容可讀性 - 使用溫暖的米色調 */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-amber-50/90 via-orange-50/85 to-amber-100/90 backdrop-blur-sm"></div> */}
      
      <div className="container mx-auto  px-4  relative z-10">
        {/* 標題區域 */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center items-center">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/最新消息.png"
              alt="最新消息"
              width={300}
              height={75}
              className="h-auto max-w-full object-contain"
              unoptimized
            />
          </div>
          <p className="text-lg text-gray-600">掌握晴朗家烘焙的最新動態、活動與優惠資訊</p>
        </div>

        {/* 新聞卡片網格 */}
        {isLoading ? (
          <div className="text-center py-12 mb-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sunny-orange"></div>
            </div>
            <p className="text-lg text-gray-600 mt-4">載入中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 mb-12">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        ) : newsData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-12">
            {newsData.map((article) => (
              <NewsCard
                key={article.id}
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-12">
            <p className="text-lg text-gray-600">目前沒有最新消息</p>
          </div>
        )}

        {/* 查看更多按鈕 - 泡泡按鈕樣式 */}
        <div className="text-center">
          <Link 
            href="/sunnyhaus/get-news"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-sunny-orange to-orange-500 text-white font-semibold text-lg shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-100 transition-all duration-300 ease-out hover:from-orange-500 hover:to-orange-600 relative overflow-hidden group"
          >
            {/* 光澤效果 */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            <span className="relative z-10">查看更多消息</span>
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}


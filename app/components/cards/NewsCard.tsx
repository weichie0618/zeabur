import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { CalendarDays, User } from "lucide-react";

interface NewsCardProps {
  id: string | number;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  date: Date | string;
  author?: string;
  slug: string;
  featured?: boolean;
}

/**
 * NewsCard 新聞卡片組件
 *
 * @example
 * ```tsx
 * <NewsCard
 *   id="1"
 *   title="晴朗家新店開幕"
 *   excerpt="又一間新店正式開幕..."
 *   image="/news/new-store.jpg"
 *   imageAlt="新店照片"
 *   date={new Date()}
 *   author="晴朗家"
 *   slug="new-store-opening"
 * />
 * ```
 */
export function NewsCard({
  id,
  title,
  excerpt,
  image,
  imageAlt,
  date,
  author,
  slug,
  featured = false,
}: NewsCardProps) {
  const href = `/sunnyhaus/get-news/${slug}`;
  const formattedDate = typeof date === "string" ? date : formatDate(date, "YYYY年MM月DD日");

  return (
    <Link href={href}>
      <article
        className={cn(
          "group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col",
          featured && "md:col-span-2"
        )}
      >
        {/* 圖片容器 */}
        <div className="relative w-full h-60 md:h-72  xl:h-96 overflow-hidden bg-gray-200">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-4 left-4 bg-sunny-orange text-white px-3 py-1 rounded-full text-xs font-semibold">
              精選
            </div>
          )}
        </div>

        {/* 內容容器 */}
        <div className="flex-1 flex flex-col p-5 md:p-6">
          {/* 標題 */}
          <h3 className="text-lg md:text-xl font-bold text-sunny-dark mb-2 line-clamp-2 group-hover:text-sunny-orange transition-colors">
            {title}
          </h3>

          {/* 摘要 */}
          <p className="text-sm md:text-base text-sunny-gray mb-4 line-clamp-3 flex-grow">
            {excerpt}
          </p>

          {/* 元數據 */}
          <div className="flex flex-col gap-2 text-xs md:text-sm text-sunny-light-gray pt-4 border-t border-sunny-border">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-sunny-orange flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>

            
          </div>

          {/* CTA */}
          <div className="mt-4 inline-flex items-center text-sunny-orange font-semibold group-hover:text-sunny-gold transition-colors">
            閱讀更多
            <span className="ml-2 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default NewsCard;


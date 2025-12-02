import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  category: string;
  price?: number;
  rating?: number;
  ratingCount?: number;
  slug?: string;
  onAddToCart?: () => void;
  featured?: boolean;
}

/**
 * ProductCard 產品卡片組件
 *
 * @example
 * ```tsx
 * <ProductCard
 *   id="1"
 *   name="原味麵包"
 *   description="使用天然酵母烘焙的原味麵包"
 *   image="/products/bread.jpg"
 *   imageAlt="原味麵包"
 *   category="經典系列"
 *   price={45}
 *   rating={4.5}
 *   ratingCount={128}
 * />
 * ```
 */
export function ProductCard({
  id,
  name,
  description,
  image,
  imageAlt,
  category,
  price,
  rating,
  ratingCount,
  slug,
  onAddToCart,
  featured = false,
}: ProductCardProps) {
  const href = slug ? `/sunnyhaus/bakery-items/${slug}` : "#";

  return (
    <div
      className={cn(
        "group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col",
        featured && "border-2 border-sunny-gold"
      )}
    >
      {/* 圖片容器 */}
      <div className="relative w-full h-56 overflow-hidden bg-sunny-light">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-sunny-orange text-white px-2 py-1 rounded-full text-xs font-semibold">
          {category}
        </div>

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 right-3 bg-sunny-gold text-sunny-dark px-2 py-1 rounded-full text-xs font-bold">
            🌟 熱門
          </div>
        )}
      </div>

      {/* 內容容器 */}
      <div className="flex-1 flex flex-col p-4 md:p-5">
        {/* 標題 */}
        <h3 className="text-lg font-bold text-sunny-dark mb-2 line-clamp-2 group-hover:text-sunny-orange transition-colors">
          {name}
        </h3>

        {/* 敘述 */}
        <p className="text-sm text-sunny-gray mb-3 line-clamp-2 flex-grow">
          {description}
        </p>

        {/* 評分 */}
        {rating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={cn(
                      i < Math.floor(rating)
                        ? "fill-sunny-gold text-sunny-gold"
                        : "text-gray-300"
                    )}
                  />
                ))}
            </div>
            <span className="text-xs text-sunny-light-gray">
              ({ratingCount || 0})
            </span>
          </div>
        )}

        {/* 價格與按鈕 */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-sunny-border">
          {price && (
            <div className="text-lg font-bold text-sunny-orange">
              NT${price}
            </div>
          )}

          {onAddToCart ? (
            <Button
              size="sm"
              variant="primary"
              className="flex-1"
              onClick={onAddToCart}
            >
              加入購物車
            </Button>
          ) : (
            <Link href={href} className="flex-1">
              <Button size="sm" variant="primary" className="w-full">
                查看詳情
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;


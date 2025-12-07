import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
        <p className="text-sm text-sunny-gray mb-4 line-clamp-3 flex-grow">
          {description}
        </p>

        {/* 按鈕 */}
        <div className="pt-3 border-t border-sunny-border flex justify-center">
          {onAddToCart ? (
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={onAddToCart}
            >
              加入購物車
            </Button>
          ) : (
            <Link href={href} className="block">
              <Button size="sm" variant="default" className="w-80 ">
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


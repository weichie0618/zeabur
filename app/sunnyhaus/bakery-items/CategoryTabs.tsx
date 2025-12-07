"use client";

import { useState } from "react";
import { products, productsByCategory } from "@/app/data/products";
import { ProductCard } from "@/app/components/cards/ProductCard";

// 產品類別列表
const productCategories = Object.keys(productsByCategory);

interface CategoryTabsProps {
  initialCategory?: string;
}

export function CategoryTabs({ initialCategory }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    initialCategory || "全部產品"
  );

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  const displayedProducts =
    activeCategory === "全部產品"
      ? products
      : productsByCategory[activeCategory as keyof typeof productsByCategory] || [];

  return (
    <>
      {/* Category Tabs */}
      <section className="py-12 bg-white border-b border-sunny-border">
        <div className="text-center text-sm text-sunny-gray mb-3 md:hidden">
          👉 左右滑動查看更多
        </div>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex flex-nowrap gap-3 px-4 pb-2 justify-center" style={{ minWidth: 'max-content' }}>
            <button
              onClick={() => handleCategoryClick("全部產品")}
              className={`px-6 py-2 rounded-full font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                activeCategory === "全部產品"
                  ? "bg-sunny-orange text-white hover:bg-sunny-gold"
                  : "border-2 border-sunny-orange text-sunny-orange hover:bg-sunny-cream"
              }`}
            >
              全部產品
            </button>
            {productCategories.map((category: string) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-6 py-2 rounded-full font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeCategory === category
                    ? "bg-sunny-orange text-white hover:bg-sunny-gold"
                    : "border-2 border-sunny-orange text-sunny-orange hover:bg-sunny-cream"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    image={product.image}
                    imageAlt={product.imageAlt}
                    category={product.category}
                    slug={product.slug}
                    featured={product.featured}
                  />
                ))}
              </div>

              {/* View All CTA */}
              <div className="text-center">
                <p className="text-sunny-gray mb-6">
                  還有更多精選麵包等著您探索！
                </p>
                <button className="px-8 py-3 bg-sunny-orange text-white font-semibold rounded-lg hover:bg-sunny-gold transition-colors">
                  瀏覽更多產品
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-sunny-gray mb-4">
                此類別暫無產品
              </p>
              <button
                onClick={() => handleCategoryClick("全部產品")}
                className="px-8 py-3 bg-sunny-orange text-white font-semibold rounded-lg hover:bg-sunny-gold transition-colors"
              >
                查看全部產品
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default CategoryTabs;

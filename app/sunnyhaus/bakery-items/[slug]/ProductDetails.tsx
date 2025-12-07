"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  // 獲取相同類別的相關產品（從全局 products 導入）
  const { products } = require("@/app/data/products");
  const relatedProducts = products
    .filter(
      (p: Product) =>
        p.category === product.category && p.slug !== product.slug
    )
    .slice(0, 3);

  return (
    <>
      {/* Hero Section - 產品詳情 */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* 左側：產品圖片 */}
            <div className="flex items-center justify-center">
              <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg bg-sunny-light">
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* 右側：產品資訊 */}
            <div className="flex flex-col justify-center">
              {/* 類別標籤 */}
              <div className="mb-4">
                <span className="inline-block bg-sunny-orange text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {product.category}
                </span>
              </div>

              {/* 產品名稱 */}
              <h1 className="text-2xl md:text-4xl font-bold text-sunny-dark mb-6">
                {product.name}
              </h1>

              {/* 線上訂購按鈕 */}
              <div className="mb-8 hidden lg:flex items-center gap-2">
                <a
                  href="https://line.me/ti/p/xxxxxxxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-60 text-center  px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm md:text-lg font-medium hover:shadow-lg transition-all"
                >
                  線上訂購
                </a>
              </div>

              {/* 手機版線上訂購按鈕 */}
              <div className="mb-8 lg:hidden">
                <a
                  href="https://line.me/ti/p/xxxxxxxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-center"
                >
                線上訂購
                </a>
              </div>

              {/* 配送資訊 */}
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="p-3 bg-sunny-cream rounded-lg">
                  <p className="text-sunny-gray mb-1">配送方式</p>
                  <p className="font-semibold text-sunny-dark text-xs">
                    🚚 宅配 / 自取 / 門市
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 產品描述 */}
      <section className="py-12 bg-sunny-light">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-sunny-dark mb-6">
              📝 產品介紹
            </h2>
            <p className="text-sunny-gray leading-relaxed mb-6">
              {product.description}
            </p>
          </div>
        </div>
      </section>

      {/* 相關產品推薦 */}
      {relatedProducts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-sunny-dark mb-8">
              🔗 相關產品推薦
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((relatedProduct: Product) => (
                <Link
                  key={relatedProduct.id}
                  href={`/sunnyhaus/bakery-items/${relatedProduct.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col cursor-pointer">
                    <div className="relative w-full h-48  xl:h-64 overflow-hidden bg-sunny-light">
                      <Image
                        src={relatedProduct.image}
                        alt={relatedProduct.imageAlt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="flex-1 flex flex-col p-4">
                      <h3 className="text-lg font-bold text-sunny-dark mb-2 group-hover:text-sunny-orange transition-colors line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                     
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

     
    </>
  );
}


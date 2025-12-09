import { Metadata } from "next";
import Image from "next/image";
import { products } from "@/app/data/products";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { ProductDetails } from "./ProductDetails";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 生成靜態參數
export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

// 動態 metadata
export async function generateMetadata(
  { params }: ProductPageProps
): Promise<Metadata> {
  const { slug } = await params;
  // 解碼 URL 編碼的中文 slug
  const decodedSlug = decodeURIComponent(slug);
  const product = products.find((p) => p.slug === decodedSlug);

  if (!product) {
    return {
      title: "產品未找到 | 晴朗家烘焙",
      description: "抱歉，此產品未找到",
    };
  }

  return {
    title: `${product.name} | 晴朗家烘焙`,
    description: product.description,
    keywords: [product.category, product.name, "麵包", "烘焙"],
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, alt: product.imageAlt }],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  // 解碼 URL 編碼的中文 slug
  const decodedSlug = decodeURIComponent(slug);
  const product = products.find((p) => p.slug === decodedSlug);

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-sunny-dark mb-4">
              找不到產品
            </h1>
            <p className="text-sunny-gray mb-8">
              抱歉，此產品不存在或已下架
            </p>
            <a
              href="/sunnyhaus/bakery-items"
              className="inline-block px-8 py-3 bg-sunny-orange text-white font-semibold rounded-lg hover:bg-sunny-gold transition-colors"
            >
              回到產品列表
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-white pt-32 lg:pt-40">
        {/* Breadcrumb */}
        <div className="bg-sunny-light py-4 border-b border-sunny-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-sunny-gray">
              <a href="/sunnyhaus/bakery-items" className="hover:text-sunny-orange transition-colors">
                產品
              </a>
              <span>/</span>
              <a href={`/sunnyhaus/bakery-items?category=${product.category}`} className="hover:text-sunny-orange transition-colors">
                {product.category}
              </a>
              <span>/</span>
              <span className="text-sunny-orange font-semibold">{product.name}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <ProductDetails product={product} />
      </main>
      <Footer />
    </>
  );
}


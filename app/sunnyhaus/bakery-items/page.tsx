import { Metadata } from "next";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { CategoryTabs } from "./CategoryTabs";

export const metadata: Metadata = {
  title: "產品介紹 | 晴朗家烘焙",
  description: "探索晴朗家烘焙的精選麵包產品，包括吐司、沙瓦豆、軟歐、台包、台式創意、法棍、可頌、雜糧和甜點系列",
  keywords: ["麵包", "烘焙", "產品", "吐司", "可頌", "法棍", "甜點", "麵包系列"],
};

export default function BakeryItemsPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4 pt-20 md:pt-32">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              產品介紹
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              我們的烘焙產品
            </h1>
            <p className="text-lg text-sunny-gray">
              每一個麵包都是用心製作，以新鮮食材和傳統工藝呈現最佳風味
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs and Products */}
      <CategoryTabs />

    

     
      </main>
      <Footer />
    </>
  );
}


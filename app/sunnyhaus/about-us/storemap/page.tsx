import { Metadata } from "next";
import { stores, storesByCity } from "@/app/data/stores";
import { StoreCard } from "@/app/components/cards/StoreCard";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "門市據點 | 晴朗家烘焙",
  description: "晴朗家烘焙門市位置及營業資訊，包括台北、新竹、台中、桃園和高雄",
  keywords: ["門市", "地址", "營業時間", "晴朗家"],
};

const cities = Object.keys(storesByCity) as Array<keyof typeof storesByCity>;

export default function StoreMapPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              門市據點
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              尋找最近的晴朗家
            </h1>
            <p className="text-lg text-sunny-gray">
              遍布全台各地的門市，每間店都有著最新鮮的烘焙麵包
            </p>
          </div>
        </div>
      </section>

      {/* Stores by City */}
      {cities.map((city) => (
        <section key={city} className="py-20 bg-white border-b border-sunny-border">
          <div className="container mx-auto px-4">
            {/* City Title */}
            <div className="mb-12">
              <div className="inline-block px-6 py-2 bg-sunny-orange text-white rounded-full font-bold mb-4">
                {city}
              </div>
              <h2 className="text-3xl font-bold text-sunny-dark">
                {city}地區
              </h2>
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {storesByCity[city].map((store) => (
                <StoreCard
                  key={store.id}
                  id={store.id}
                  name={store.name}
                  address={store.address}
                  city={store.city}
                  district={store.district}
                  phone={store.phone}
                  hours={store.hours}
                  image={store.image}
                  imageAlt={store.imageAlt}
                  latitude={store.latitude}
                  longitude={store.longitude}
                  featured={store.featured}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Store Summary Section */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-sunny-dark mb-12">
            門市統計資訊
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-5xl font-bold text-sunny-orange mb-2">
                {stores.length}
              </div>
              <p className="text-sunny-gray">間門市</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-5xl font-bold text-sunny-orange mb-2">
                {cities.length}
              </div>
              <p className="text-sunny-gray">個城市</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-5xl font-bold text-sunny-orange mb-2">
                365
              </div>
              <p className="text-sunny-gray">天營業</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-5xl font-bold text-sunny-orange mb-2">
                06:00
              </div>
              <p className="text-sunny-gray">最早開店時間</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-sunny-dark mb-6">
            找不到您想要的門市？
          </h2>
          <p className="text-lg text-sunny-gray mb-8">
            聯絡我們，了解是否有其他服務方式或即將開設的新門市
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-sunny-orange text-white font-semibold rounded-lg hover:bg-sunny-gold transition-colors">
              聯絡我們
            </button>
            <button className="px-8 py-3 border-2 border-sunny-orange text-sunny-orange font-semibold rounded-lg hover:bg-sunny-cream transition-colors">
              加盟合作
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-sunny-dark mb-6">
              ℹ️ 常見問題
            </h3>
            <div className="space-y-4">
              <details className="border border-sunny-border rounded-lg p-4 cursor-pointer hover:bg-sunny-cream transition-colors">
                <summary className="font-bold text-sunny-dark">
                  門市是否有停車位？
                </summary>
                <p className="text-sunny-gray mt-4">
                  各門市停車方案不同，建議直接致電詢問。
                </p>
              </details>

              <details className="border border-sunny-border rounded-lg p-4 cursor-pointer hover:bg-sunny-cream transition-colors">
                <summary className="font-bold text-sunny-dark">
                  可以預訂麵包嗎？
                </summary>
                <p className="text-sunny-gray mt-4">
                  可以！請提前 24 小時致電各門市預訂。
                </p>
              </details>

              <details className="border border-sunny-border rounded-lg p-4 cursor-pointer hover:bg-sunny-cream transition-colors">
                <summary className="font-bold text-sunny-dark">
                  是否有外送服務？
                </summary>
                <p className="text-sunny-gray mt-4">
                  部分門市有配合外送平台，詳情請致電各門市。
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


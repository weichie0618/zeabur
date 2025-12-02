import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Heart, Lightbulb, Users, Target } from "lucide-react";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "關於我們 | 晴朗家烘焙",
  description: "認識晴朗家烘焙，了解我們的品牌故事、核心價值和發展歷程",
  keywords: ["品牌", "故事", "關於", "晴朗家"],
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-sunny-cream to-sunny-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-sunny-orange mb-4 uppercase tracking-wider">
              關於我們
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-sunny-dark mb-6">
              晴朗家烘焙的故事
            </h1>
            <p className="text-lg text-sunny-gray">
              讓晴朗家烘焙成為每個早晨幸福的開始
            </p>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-sunny-dark mb-8">
              我們的故事
            </h2>

            <div className="space-y-6 text-lg text-sunny-gray leading-relaxed">
              <p>
                晴朗家烘焙成立於 2023 年，源自於創辦人對烘焙的熱情與執著。我們相信，每一個麵包都應該是用心製作的藝術品。
              </p>

              <p>
                從最初的小店開始，我們堅持使用最新鮮的食材，以傳統工藝結合現代創新的方式，打造出獨具特色的烘焙產品。
              </p>

              <p>
                如今，晴朗家已經在全台各地擁有多間門市，每天為上千位顧客提供最美味的麵包。我們的目標，就是讓每一位光臨晴朗家的客人，都能感受到食物帶來的幸福。
              </p>

              <p>
                未來，我們將持續創新，為大家帶來更多驚喜的烘焙產品。感謝您的支持與陪伴，讓晴朗家能夠不斷成長。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            我們的核心價值
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Heart size={40} />,
                title: "用心製作",
                description: "每一個麵包都是用心和熱情製作而成",
              },
              {
                icon: <Lightbulb size={40} />,
                title: "持續創新",
                description: "不斷開發新產品，為顧客帶來驚喜",
              },
              {
                icon: <Users size={40} />,
                title: "客戶至上",
                description: "以顧客需求為中心，提供最好的服務",
              },
              {
                icon: <Target size={40} />,
                title: "品質承諾",
                description: "堅持食材品質，絕不妥協",
              },
            ].map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-lg text-center">
                <div className="flex justify-center text-sunny-orange mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-sunny-dark mb-4">
                  {value.title}
                </h3>
                <p className="text-sunny-gray">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            發展歷程
          </h2>

          <div className="space-y-8">
            {[
              {
                year: "2023",
                title: "晴朗家烘焙成立",
                description: "第一間門市在台北開業，開始我們的烘焙之旅",
              },
              {
                year: "2024.06",
                title: "首間新竹門市開幕",
                description: "正式進駐新竹，擴展服務範圍",
              },
              {
                year: "2024.08",
                title: "第一間高雄門市開業",
                description: "南部首間門市，帶去南台灣最新鮮的麵包",
              },
              {
                year: "2024.09",
                title: "台中科園店開幕",
                description: "中部重點門市，專為科園上班族服務",
              },
              {
                year: "2024.11",
                title: "蘆竹奉化店試營運",
                description: "桃園地區旗艦店，即將為您服務",
              },
              {
                year: "2025",
                title: "計畫擴展全台",
                description: "未來計畫在更多城市開設分店",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-sunny-orange text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  {index < 5 && (
                    <div className="w-1 h-16 bg-sunny-orange mt-2" />
                  )}
                </div>

                <div className="pb-8">
                  <div className="inline-block px-4 py-1 bg-sunny-cream rounded-full text-sm font-semibold text-sunny-orange mb-2">
                    {item.year}
                  </div>
                  <h3 className="text-2xl font-bold text-sunny-dark mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sunny-gray">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-sunny-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-sunny-dark mb-16">
            我們的團隊
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "創辦人 & CEO",
                role: "李晴朗",
                description: "20 年烘焙經驗，致力於推廣台灣烘焙文化",
              },
              {
                name: "產品開發負責人",
                role: "王朗晴",
                description: "專業烘焙師傅，不斷創新烘焙配方",
              },
              {
                name: "營運經理",
                role: "陳朗朗",
                description: "10 年餐飲服務經驗，確保每家門市卓越服務",
              },
            ].map((member, index) => (
              <div key={index} className="bg-white p-8 rounded-lg text-center shadow-md">
                <div className="w-24 h-24 rounded-full bg-sunny-orange mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold">
                  {member.role.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-sunny-dark mb-2">
                  {member.role}
                </h3>
                <p className="text-sm text-sunny-light-gray mb-4">{member.name}</p>
                <p className="text-sunny-gray">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sunny-orange text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            加入晴朗家的大家庭
          </h2>
          <p className="text-xl mb-12">
            無論是消費者、合作夥伴還是加盟主，我們都歡迎您的加入！
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sunnyhaus/get-join">
              <Button variant="secondary" size="lg">
                申請加盟
              </Button>
            </Link>
            <Link href="/sunnyhaus/business-cooperation">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-sunny-orange"
              >
                商業合作
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}


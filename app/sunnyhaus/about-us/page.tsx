"use client";

import { useState } from "react";
import Image from "next/image";
import { Navbar } from "@/app/components/sections/Navbar";
import { Footer } from "@/app/components/layout/Footer";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      label: "公司簡介",
      content: (
        <div className="space-y-6">
          <div className="w-full">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/1.png"
              alt="公司簡介"
              width={1000}
              height={150}
              className="w-full h-auto"
              unoptimized
            />
          </div>

          <p className="text-sunny-orange text-xl md:text-2xl font-bold mt-8">
            專注於傳遞美味、幸福與熱情
          </p>

          <p className="text-lg font-bold">
            公司秉持著對品質的高度要求，打造出健康又美味的麵包與西點。
          </p>

          <p className="text-lg font-bold">
            我們的產品線涵蓋多樣化的選擇，從經典的法式可頌到創意的百變小吐司，晴朗家致力於滿足不同顧客的需求。
          </p>

          <p className="text-lg font-bold">
            公司擁有先進的中央廚房，採用標準化的製作流程，以確保每一塊麵包都能保持穩定的高品質，同時也支持著未來快速展店的策略布局。
          </p>

          <p className="text-lg font-bold mb-8">
            晴朗家烘焙已經不僅僅是提供麵包的店鋪，而是融入了每個人生活中的一部分，為每一位顧客創造出美好而溫暖的日常回憶。
          </p>

          <div className="flex justify-center my-8">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/10/晴朗家-png-1024x553.png"
              alt="晴朗家"
              width={900}
              height={500}
              className="w-full max-w-4xl h-auto"
              unoptimized
            />
          </div>
        </div>
      ),
    },
    {
      id: 1,
      label: "品牌起源",
      content: (
        <div className="space-y-6">
          <div className="w-full">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/2.png"
              alt="品牌起源"
              width={1000}
              height={150}
              className="w-full h-auto"
              unoptimized
            />
          </div>

          <p className="text-sunny-orange text-lg md:text-xl font-bold mt-8">
            在這個充滿速食、快速消費的時代，有沒有一種麵包，可以既健康、又方便，同時還保有剛出爐的香氣與口感？
          </p>

          <p className="text-lg">
            這正是【晴朗家烘焙】誕生的初衷。
          </p>

          <p className="text-sunny-orange text-lg font-bold">
            ▍ 從一份思念，開始的烘焙旅程
          </p>

          <p>
            創辦人與家人都非常熱愛麵包，卻因為工作繁忙，經常錯過購買的時機。等到終於有空去買時，卻早已沒了胃口。
            <br />
            那種剛出爐、酥脆鬆軟的麵包，其實是一種踏實、溫暖的生活味道，但在現代生活中卻越來越難得。
            <br />
            他也發現，市面上的麵包為了追求口感與保存，多半倚賴香精、改良劑與各種添加物來模擬「剛出爐的風味」，卻失去了麵包最初的純粹。
          </p>

          <p>
            就在那一刻，他下定決心：
            <br />
            「我要做出一種讓人吃得安心，也願意每天給家人吃的麵包。」
          </p>

          <p>
            於是，【晴朗家烘焙】誕生了。
            <br />
            品牌中的「晴朗」，象徵自然、潔淨與無添加的堅持；「家」，代表我們始終用對待家人的心，來對待每一位顧客。
          </p>

          <p className="text-sunny-orange text-lg font-bold">
            ▍ 我們不是傳統麵包店，而是科技與良心並存的新型烘焙品牌
          </p>

          <p>
            晴朗家烘焙不只是一家烘焙坊，更是一間結合<strong>職人精神與科技研發能力</strong>的新型態品牌。
            <br />
            我們研發出獨家技術，讓冷凍麵包加熱後的口感，與剛出爐無異——外酥內嫩、香氣撲鼻，完全顛覆對冷凍麵包的想像。
          </p>

          <p>
            這項技術讓許多門市、選品店、餐廳甚至飯店，都能<strong>輕鬆穩定供應高品質麵包</strong>，不用自己聘請烘焙師、建設烘焙室，卻能提供媲美現烤的美味。
          </p>

          <p className="text-sunny-orange text-lg font-bold">
            ▍ 堅持無添加，讓「家人也能每天吃」的麵包成為日常
          </p>

          <p>
            我們相信，好麵包不需要過度加工。
            <br />
            在晴朗家，選擇優良食材物料，以及嚴選原料。
          </p>

          <p>
            正因為這樣的理念，我們的麵包適合全家人每天吃：不論是小朋友、長輩、孕媽咪，甚至過敏體質的人，都能安心享用。
          </p>

          <p className="text-sunny-orange text-lg font-bold">
            ▍ 一塊麵包的力量，不只是飽足
          </p>

          <p>
            晴朗家的麵包，是許多家庭早餐桌上的主角、是下午茶時光的陪伴、是宵夜時解嘴饞的溫柔慰藉。
            <br />
            冷凍包裝的設計，也讓你只要冰在冷凍庫，<strong>想吃的時候加熱3分鐘，就像現烤一樣美味</strong>，既方便又保有麵包的完整風味。
          </p>

          <p>
            這份安心與美味，不僅進入千家萬戶的冰箱，也逐步拓展成為加盟商、異業通路合作首選的烘焙解方。
          </p>

          <p className="text-sunny-orange text-lg font-bold">
            ▍ 我們的品牌使命：
          </p>

          <p className="text-lg font-bold">
            用良心與技術，做出每天都願意吃的麵包。
            <br />
            讓烘焙，成為簡單、自然、純粹的日常選擇。
          </p>

          <p className="text-sunny-orange text-lg font-bold">
            ▍ 如果你正在尋找——
          </p>

          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>有理念、有溫度的品牌合作對象</li>
            <li>能穩定供應高品質、無添加產品的商業夥伴</li>
            <li>或是一份能改變家庭餐桌、讓顧客感動回購的烘焙解決方案</li>
          </ul>

          <p className="text-lg">
            那麼，<strong>真的可以好好認識晴朗家烘焙。</strong> 我們走得不快，卻走得踏實；
            <br />
            我們不浮誇，卻專注每一塊麵包的誠實與溫度。
            <br />
            未來，我們希望每一個你，都能因為晴朗家的麵包，對生活多一點期待，對品牌多一份信任。
          </p>

          <div className="my-8">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/10/晴朗家新鮮麵包.jpg"
              alt="晴朗家新鮮麵包"
              width={600}
              height={600}
              className="w-full max-w-2xl h-auto mx-auto"
              unoptimized
            />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      label: "經營理念",
      content: (
        <div className="space-y-6">
          <div className="w-full">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/3.png"
              alt="經營理念"
              width={1000}
              height={150}
              className="w-full h-auto"
              unoptimized
            />
          </div>

          <h2 className="text-sunny-orange text-2xl md:text-3xl font-bold mt-8">
            『晴朗家烘焙』將熱情、開朗和幸福定義為我們的生活態度和經營理念。
          </h2>

          <p className="text-lg font-bold">
            我們相信，每一塊麵包都是我們用心製作和熱情投入，每一次微笑服務都是我們開朗態度的展現，而每一口美味都能為您帶來幸福感受。我們賦予產品最優質及獨特的口感，讓您在品嚐時感受到我們的用心和專業；同時， 我們將呈現變化多元的產品面貌，讓您每次造訪都能發現新驚喜！讓您品嚐到我們變化多元的麵包，也在一整天中都能幸福的微笑，感受到生活中的溫暖與美好。
          </p>

          <p className="text-sunny-orange text-xl md:text-2xl font-bold">
            『晴朗家烘焙』，帶給您不僅是美味，更是一份幸福的享受。
          </p>

          <div className="my-8">
            <Image
              src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/10/Freshly-baked-background-1024x1024.png"
              alt="Freshly baked background"
              width={700}
              height={600}
              className="w-full max-w-2xl h-auto mx-auto"
              unoptimized
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-sunny-cream to-sunny-white pb-5 md:pb-20">
          <div className="container mx-auto px-4 pt-20 md:pt-32 lg:pt-40">
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

        {/* Tabs Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Tabs Navigation */}
            <div className="border-b border-sunny-border mb-8">
              <div className="flex flex-wrap gap-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 md:px-6 py-3 text-lg font-semibold transition-all border-b-2 ${
                      activeTab === tab.id
                        ? "text-sunny-orange border-sunny-orange"
                        : "text-sunny-gray border-transparent hover:text-sunny-orange hover:border-sunny-orange/50"
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                    id={`tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs Content */}
            <div className="min-h-[600px]">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  id={`tabpanel-${tab.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${tab.id}`}
                  className={activeTab === tab.id ? "block" : "hidden"}
                >
                  <div className="text-sunny-gray leading-relaxed">
                    {tab.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        
      </main>
      <Footer />
    </>
  );
}

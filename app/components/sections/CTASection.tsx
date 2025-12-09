import Link from 'next/link';
import Image from 'next/image';

export default function CTASection() {
  return (
    <section 
      className="py-20 md:py-24 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50 overflow-hidden relative"
    >
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, var(--sunny-orange) 0%, transparent 60%)`,
          }}
        />
        <div 
          className="absolute -bottom-1/3 -left-1/4 w-2/3 h-2/3 rounded-full opacity-15"
          style={{
            background: `radial-gradient(circle, var(--sunny-gold) 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* 烘焙風格裝飾圖案 - 點狀背景 */}
      <div className="absolute inset-0 opacity-[0.05] z-[1]" style={{
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }}></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* 品牌介紹區塊 */}
          <div className="text-center mb-8">
            {/* 品牌圖片 */}
            <div className="mb-6 inline-block">
              <figure className="inline-block">
                <Image
                  decoding="async"
                  src="https://sunnyhausbakery.com.tw/wp-content/uploads/2024/09/file.png"
                  alt="晴朗家烘焙"
                  className="max-w-full h-auto"
                  width={400}
                  height={262}
                  title="晴朗家烘焙"
                  loading="lazy"
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </figure>
            </div>

            {/* 標題 */}
            <div className="mb-6">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-sunny-dark">
                讓晴朗家烘焙成為每個早晨幸福的開始
              </h3>
            </div>

            {/* 分隔線 */}
            <hr 
              className="mx-auto max-w-md" 
              style={{
                marginTop: 0,
                marginBottom: 0,
                height: '2px',
                background: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
                border: 'none'
              }}
            />
          </div>

          {/* 文字描述 */}
          <div className="text-center mb-8 space-y-4">
            <p className="text-lg md:text-xl leading-relaxed text-gray-700">
              <strong>
                在晴朗家烘焙<br />
                發現最純粹的美味與溫暖的用餐體驗<br />
                我們以熱情與創新打造每一款產品
              </strong>
            </p>

            <p className="text-lg md:text-xl leading-relaxed text-gray-700">
              <strong>
                讓每一天的清晨都能擁有不同的驚喜<br />
                為您的生活增添更多幸福與美好<br />
                一起在晴朗家烘焙中享受陽光般的愉悅吧！
              </strong>
            </p>
          </div>

          {/* CTA 按鈕區塊 */}
          <div className="text-center pt-4">
            <p className="text-xl md:text-2xl font-semibold mb-6 text-sunny-dark">
              加入晴朗家大家庭
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              想開設自己的烘焙店嗎？
              <br />
              晴朗家歡迎您的加入。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* 我要加盟 - 泡泡按鈕 */}
              <Link 
                href="/sunnyhaus/get-join"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-sunny-orange to-orange-500 text-white font-semibold text-lg shadow-lg shadow-sunny-orange/30 hover:shadow-xl hover:shadow-sunny-orange/40 hover:scale-105 active:scale-100 transition-all duration-300 ease-out relative overflow-hidden group"
              >
                {/* 光澤效果 */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                <span className="relative z-10">我要加盟</span>
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


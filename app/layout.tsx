import type { Metadata } from "next";
import { Noto_Sans_TC, Poppins } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "晴朗家烘焙 - 提供新鮮、美味的手作麵包",
    template: "%s | 晴朗家烘焙",
  },
  description:
    "讓晴朗家烘焙成為每個早晨幸福的開始。在晴朗家烘焙發現最純粹的美味與溫暖的用餐體驗，我們以熱情與創新打造每一款產品。",
  keywords:
    "烘焙,麵包,晴朗家,麵包店,手作麵包,烘焙店,新鮮麵包,台灣烘焙",
  authors: [{ name: "晴朗家烘焙" }],
  creator: "晴朗家烘焙",
  publisher: "晴朗家烘焙",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://sunnyhausbakery.com.tw",
    siteName: "晴朗家烘焙",
    title: "晴朗家烘焙 - 提供新鮮、美味的手作麵包",
    description:
      "讓晴朗家烘焙成為每個早晨幸福的開始。在晴朗家烘焙發現最純粹的美味與溫暖的用餐體驗，我們以熱情與創新打造每一款產品。",
    images: [
      {
        url: "https://sunnyhausbakery.com.tw/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "晴朗家烘焙",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "晴朗家烘焙 - 提供新鮮、美味的手作麵包",
    description:
      "讓晴朗家烘焙成為每個早晨幸福的開始。在晴朗家烘焙發現最純粹的美味與溫暖的用餐體驗。",
    images: ["https://sunnyhausbakery.com.tw/og-image.jpg"],
    creator: "@SunnyHausBakery",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  alternates: {
    canonical: "https://sunnyhausbakery.com.tw",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSansTC.variable} ${poppins.variable}`}
    >
      <head>
        {/* JSON-LD 結構化數據 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "晴朗家烘焙",
              alternateName: "Sunny Haus Bakery",
              url: "https://sunnyhausbakery.com.tw",
              logo: "https://sunnyhausbakery.com.tw/logo.png",
              description:
                "提供新鮮、美味的手作麵包，讓晴朗家烘焙成為每個早晨幸福的開始。",
              sameAs: [
                "https://www.facebook.com/SunnyHausBakery/",
                "https://www.instagram.com/SunnyHausBakery/",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
                availableLanguage: ["zh-TW"],
              },
            }),
          }}
        />
      </head>
      <body className={`${notoSansTC.className} bg-sunny-white text-sunny-dark`}>
        {children}
      </body>
    </html>
  );
}

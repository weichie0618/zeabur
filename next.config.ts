import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 確保環境變數能被中間件使用
  
  // 啟用嚴格模式
  reactStrictMode: true,
  // 配置輸出目錄格式以確保資源正確載入
  output: 'standalone',
  // 設定資源前綴，解決部署時的路徑問題
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://joinmeet.sunnyhausbakery.com.tw' : undefined,
  assetPrefix: undefined, // 暫時移除特定域名設置，讓CSS從相對路徑載入
  // 啟用靜態優化，但移除需要 critters 的 CSS 優化
  experimental: {
    optimizeServerReact: true
  },
  // 路由重寫配置
   // 路由重寫配置
   async rewrites() {
    const backendUrl = 'http://localhost:4000';
    
    return [
      
      {
        source: "/api/upload",
        destination: "/api/upload",
      },
      {
        source: "/api/images/:path*",
        destination: "/api/images/:path*",
      },
      {
        source: "/api/sample-request",
        destination: "/api/sample-request",
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/get-store-info",
        destination: `http://localhost:3000/get-store-info`,
      },
      {
        source: "/gsa",
        destination: `http://localhost:3000/gsa`,
      },
    ];
  },
  // 圖片域名配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sunnyhausbakery.com.tw',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'down-tw.img.susercontent.com',
        port: '',
        pathname: '/**'
      }
    ],
    minimumCacheTTL: 60,
    // 啟用圖片格式優化
    formats: ['image/webp']
  },
};

export default nextConfig;

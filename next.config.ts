import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 確保環境變數能被中間件使用
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  },
  // 啟用嚴格模式
  reactStrictMode: true,
  // 路由重寫配置
  async rewrites() {
    return [
      {
        source: "/api/upload",
        destination: "/api/upload",
      },
      {
        source: "/api/sample-request",
        destination: "/api/sample-request",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
  // 圖片域名配置
  images: {
    domains: ["sunnyhausbakery.com.tw","down-tw.img.susercontent.com"],
  },
};

export default nextConfig;

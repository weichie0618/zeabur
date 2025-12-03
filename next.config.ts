import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sunnyhausbakery.com.tw',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wp.yilicorp.com.tw',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'wp.yilicorp.com.tw',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yilicorp.com.tw',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'yilicorp.com.tw',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

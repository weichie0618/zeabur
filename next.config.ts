import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sunnyhausbakery.com.tw',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

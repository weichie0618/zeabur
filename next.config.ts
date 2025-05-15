import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  images: {
    domains: ["sunnyhausbakery.com.tw","down-tw.img.susercontent.com"],
  },
};

export default nextConfig;

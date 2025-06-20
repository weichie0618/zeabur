/** @type {import('next').NextConfig} */

const nextConfig = {
  // 禁用預渲染以避免useSearchParams()錯誤
  output: 'standalone',
  
  experimental: {
    // 禁用預渲染特定頁面
    missingSuspenseWithCSRInDev: false
  },

  // 其他現有設置
}

module.exports = nextConfig 
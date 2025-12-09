import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sunnyhausbakery.com.tw';
  const currentDate = new Date();

  return [
    // 首頁
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // 最新消息
    {
      url: `${baseUrl}/sunnyhaus/get-news`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // 產品介紹
    {
      url: `${baseUrl}/sunnyhaus/bakery-items`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // 關於我們
    {
      url: `${baseUrl}/sunnyhaus/about-us`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    // 加盟表單
    {
      url: `${baseUrl}/sunnyhaus/get-join`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ];
}


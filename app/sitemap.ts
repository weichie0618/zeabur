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
    // 門市據點
    {
      url: `${baseUrl}/sunnyhaus/about-us/storemap`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // 商業合作
    {
      url: `${baseUrl}/sunnyhaus/business-cooperation`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    // 代工烘培
    {
      url: `${baseUrl}/sunnyhaus/business-cooperation/oembaking`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    // 企業採購
    {
      url: `${baseUrl}/sunnyhaus/business-cooperation/corporate-procurement`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
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


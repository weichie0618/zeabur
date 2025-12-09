// 新聞文章介面定義
export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  tags: string[];
  featured: boolean;
  thumbnail: string;
  images: string[];
  author: string;
  readTime: number;
  views: number;
  socialShares: {
    facebook: number;
    line: number;
    twitter: number;
  };
}

// 新聞篩選器介面
export interface NewsFilter {
  category?: string;
  tags?: string[];
  featured?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// 新聞分類介面
export interface NewsCategory {
  id: string;
  name: string;
  count: number;
}

// 新聞統計介面
export interface NewsStats {
  totalArticles: number;
  totalViews: number;
  totalShares: number;
  categories: NewsCategory[];
}



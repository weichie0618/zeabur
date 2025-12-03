import { NewsArticle, NewsFilter } from '../types/news';

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 格式化相對時間
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return '今天';
  if (diffInDays === 1) return '昨天';
  if (diffInDays < 7) return `${diffInDays} 天前`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} 週前`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`;
  return `${Math.floor(diffInDays / 365)} 年前`;
};

// 篩選新聞
export const filterNews = (articles: NewsArticle[], filter: NewsFilter): NewsArticle[] => {
  let filtered = [...articles];

  // 分類篩選
  if (filter.category) {
    filtered = filtered.filter(article => article.category === filter.category);
  }

  // 標籤篩選
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(article => 
      filter.tags!.some(tag => article.tags.includes(tag))
    );
  }

  // 精選篩選
  if (filter.featured !== undefined) {
    filtered = filtered.filter(article => article.featured === filter.featured);
  }

  // 日期範圍篩選
  if (filter.dateRange) {
    const startDate = new Date(filter.dateRange.start);
    const endDate = new Date(filter.dateRange.end);
    filtered = filtered.filter(article => {
      const articleDate = new Date(article.date);
      return articleDate >= startDate && articleDate <= endDate;
    });
  }

  // 搜尋篩選
  if (filter.search) {
    const searchTerm = filter.search.toLowerCase();
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.excerpt.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  return filtered;
};

// 排序新聞
export const sortNews = (articles: NewsArticle[], sortBy: 'date' | 'views' | 'title' = 'date'): NewsArticle[] => {
  return [...articles].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'views':
        return b.views - a.views;
      case 'title':
        return a.title.localeCompare(b.title, 'zh-TW');
      default:
        return 0;
    }
  });
};

// 分頁處理
export const paginateNews = (articles: NewsArticle[], page: number, pageSize: number = 10) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = articles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(articles.length / pageSize);

  return {
    articles: paginatedArticles,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};


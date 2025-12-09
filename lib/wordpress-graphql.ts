const WORDPRESS_GRAPHQL_URL = process.env.WORDPRESS_GRAPHQL_URL || 'http://yilicorp.local/graphql';
const WORDPRESS_CATEGORY_SLUG = process.env.WORDPRESS_CATEGORY_SLUG || 'yili';

// 判断是否在客户端运行
const isClientSide = typeof window !== 'undefined';

// 使用原生 fetch 替代 GraphQLClient
async function graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    // 客户端使用 API 路由，服务器端直接请求 WordPress
    const url = isClientSide ? '/api/graphql' : WORDPRESS_GRAPHQL_URL;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}

// WordPress GraphQL 類型定義
interface WordPressImageNode {
  sourceUrl: string;
  mediaItemUrl?: string;
  altText: string | null;
  srcSet?: string;
  sizes?: string;
  mediaDetails?: {
    width: number;
    height: number;
  };
}

interface WordPressFeaturedImage {
  node: WordPressImageNode | null;
}

interface WordPressCategoryNode {
  name: string;
  slug: string;
}

interface WordPressTagNode {
  name: string;
  slug: string;
}

interface WordPressCategories {
  nodes: WordPressCategoryNode[];
}

interface WordPressTags {
  nodes: WordPressTagNode[];
}

interface WordPressPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  featuredImage: WordPressFeaturedImage | null;
  categories: WordPressCategories;
  tags: WordPressTags;
}

interface WordPressPostsResponse {
  posts: {
    nodes: WordPressPost[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

interface WordPressPostResponse {
  post: WordPressPost | null;
}

interface WordPressCategoryStatsResponse {
  category: {
    name: string;
    slug: string;
    count: number;
    description: string | null;
  } | null;
}

const GET_POSTS_QUERY = `
  query GetPosts($first: Int = 10) {
    posts(first: $first, where: { 
      status: PUBLISH
    }) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        content
        date
        featuredImage {
          node {
            sourceUrl
            mediaItemUrl
            altText
            srcSet
            sizes
            mediaDetails {
              width
              height
            }
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        tags {
          nodes {
            name
            slug
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const GET_POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      excerpt
      content
      date
      featuredImage {
        node {
          sourceUrl
          mediaItemUrl
          altText
          srcSet
          sizes
          mediaDetails {
            width
            height
          }
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      tags {
        nodes {
          name
          slug
        }
      }
    }
  }
`;

/**
 * 取得文章列表（不篩選分類）
 * @param first 取得文章數量
 */
export async function getPosts(first = 20) {
  try {
    const data = await graphqlRequest<WordPressPostsResponse>(
      GET_POSTS_QUERY, 
      { first }
    );
    
    return data.posts.nodes || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * 根據 slug 取得單篇文章（不篩選分類）
 * @param slug 文章 slug
 */
export async function getPostBySlug(slug: string) {
  try {
    const data = await graphqlRequest<WordPressPostResponse>(GET_POST_BY_SLUG_QUERY, { slug });
    
    if (!data.post) {
      console.warn(`Post not found for slug: ${slug}`);
      return null;
    }
    
    return data.post;
  } catch (error) {
    console.error('Error fetching post:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

export function transformWordPressPost(post: WordPressPost | null) {
  if (!post) return null;
  
  // 獲取精選圖片 URL（優先使用 mediaItemUrl，然後 sourceUrl）
  const featuredImageUrl = post.featuredImage?.node?.mediaItemUrl || 
                           post.featuredImage?.node?.sourceUrl || '';
  
  // 第一步：移除精選圖片
  let cleanContent = removeFeaturedImageFromContent(
    post.content || '', 
    featuredImageUrl
  );
  
  // 第二步：將 Facebook/WordPress emoji 圖片轉換為原生 emoji
  cleanContent = convertEmojiImagesToNative(cleanContent);
  
  return {
    id: post.databaseId,
    title: post.title,
    slug: post.slug,
    excerpt: stripHtml(post.excerpt || ''),
    content: cleanContent,
    date: new Date(post.date).toISOString().split('T')[0],
    category: post.categories?.nodes?.[0]?.name || '未分類',
    tags: post.tags?.nodes?.map((tag) => tag.name) || [],
    featured: false, // 暫時設為 false，等 ACF 設定完成後再啟用
    thumbnail: featuredImageUrl,
    images: [featuredImageUrl].filter((img): img is string => Boolean(img)),
    author: '晴朗家烘焙',
    readTime: 5, // 暫時設為 5，等 ACF 設定完成後再啟用
    views: 0,
    socialShares: {
      facebook: 0,
      line: 0,
      twitter: 0,
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Facebook/WordPress Emoji 圖片轉換為原生 Emoji
 * Facebook 會將 emoji 轉換為圖片，我們需要將它們轉換回來
 */
function convertEmojiImagesToNative(content: string): string {
  // Facebook Emoji CDN URL 到原生 emoji 的映射表
  const emojiMap: Record<string, string> = {
    '1f4a5.png': '💥', // 爆炸
    '1f447.png': '👇', // 向下指
    '1f950.png': '🥐', // 可頌
    '1f4b0.png': '💰', // 錢袋
    '2615.png': '☕',  // 咖啡
    '2705.png': '✅',  // 打勾
    '27a1.png': '➡️',  // 右箭頭
    '1f381.png': '🎁', // 禮物
    '1f525.png': '🔥', // 火焰
    '1f4cd.png': '📍', // 圖釘
    '1f4c5.png': '📅', // 日曆
    '1f55b.png': '🕛', // 時鐘12點
    '1f3d4.png': '🏔️', // 雪山
    '1f449.png': '👉', // 右指
    '260e.png': '☎️',  // 電話
  };

  let cleanedContent = content;

  // 匹配 Facebook emoji 圖片標籤
  // <img loading="lazy" decoding="async" height="16" width="16" alt="💥" src="https://static.xx.fbcdn.net/images/emoji.php/v9/t40/1/16/1f4a5.png">
  const fbEmojiRegex = /<img[^>]*src="https:\/\/static\.xx\.fbcdn\.net\/images\/emoji\.php\/v\d+\/[^\/]+\/\d+\/\d+\/([^"]+)"[^>]*>/gi;
  
  cleanedContent = cleanedContent.replace(fbEmojiRegex, (match, filename) => {
    // 如果有對應的 emoji，返回 emoji；否則從 alt 屬性提取
    if (emojiMap[filename]) {
      return emojiMap[filename];
    }
    
    // 嘗試從 alt 屬性提取 emoji
    const altMatch = match.match(/alt="([^"]+)"/);
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }
    
    // 如果都沒有，保留原始標籤（雖然不太可能）
    return match;
  });

  return cleanedContent;
}

/**
 * 從文章內容中移除精選圖片
 * WordPress 有時會在內容開頭自動插入精選圖片，這會導致重複顯示
 * 
 * 改進版：只移除精確匹配的精選圖片，不影響文章中的其他圖片
 */
function removeFeaturedImageFromContent(content: string, featuredImageUrl: string): string {
  if (!content || !featuredImageUrl) return content;
  
  // 如果沒有精選圖片，直接返回原內容
  if (!featuredImageUrl) return content;
  
  let cleanedContent = content;
  
  // 轉義特殊字符以用於正則表達式
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // 提取完整的圖片 URL（不含查詢參數）
  const getCleanUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch {
      return url.split('?')[0];
    }
  };
  
  const cleanFeaturedUrl = getCleanUrl(featuredImageUrl);
  const escapedUrl = escapeRegExp(cleanFeaturedUrl);
  
  // 只移除包含精確 URL 的精選圖片
  // 注意：只在內容開頭附近（前 3 個區塊）尋找，避免誤刪文章中段的圖片
  
  // 方法1：移除包含精選圖片完整 URL 的 figure 標籤（通常在內容開頭）
  const figureRegex = new RegExp(
    `<figure[^>]*>\\s*<img[^>]*src=["']${escapedUrl}[^"']*["'][^>]*>.*?</figure>`,
    'is'
  );
  
  // 只替換第一次出現（通常是重複的精選圖片）
  const firstMatch = cleanedContent.match(figureRegex);
  if (firstMatch && cleanedContent.indexOf(firstMatch[0]) < 1000) {
    // 只移除出現在內容前 1000 字符內的精選圖片
    cleanedContent = cleanedContent.replace(figureRegex, '');
  }
  
  // 方法2：移除包含精選圖片完整 URL 的獨立 img 標籤（在段落開頭）
  const imgInPRegex = new RegExp(
    `<p[^>]*>\\s*<img[^>]*src=["']${escapedUrl}[^"']*["'][^>]*>\\s*</p>`,
    'is'
  );
  
  const secondMatch = cleanedContent.match(imgInPRegex);
  if (secondMatch && cleanedContent.indexOf(secondMatch[0]) < 1000) {
    cleanedContent = cleanedContent.replace(imgInPRegex, '');
  }
  
  // 清理多餘的空白和空段落
  cleanedContent = cleanedContent
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/^\s+|\s+$/g, '')
    .trim();
  
  return cleanedContent;
}

/**
 * 取得指定分類及其子分類的所有文章
 * @param first 取得文章數量
 * @param parentCategorySlug 父分類 slug
 */
export async function getPostsWithSubcategories(
  first = 20, 
  parentCategorySlug?: string
) {
  try {
    if (!parentCategorySlug) {
      // 如果沒有指定分類，返回所有文章
      return await getPosts(first);
    }
    
    const data = await graphqlRequest<WordPressPostsResponse>(
      GET_POSTS_QUERY, 
      { first }
    );
    
    // 篩選屬於該分類或其子分類的文章
    const filteredPosts = data.posts.nodes.filter((post: WordPressPost) => 
      post.categories.nodes.some((cat: WordPressCategoryNode) => 
        cat.slug === parentCategorySlug || cat.slug.startsWith(`${parentCategorySlug}-`)
      )
    );
    
    return filteredPosts || [];
  } catch (error) {
    console.error('Error fetching posts with subcategories:', error);
    return [];
  }
}

/**
 * 取得分類統計資訊
 * @param categorySlug 分類 slug（預設從環境變數讀取）
 */
export async function getCategoryStats(categorySlug?: string) {
  const category = categorySlug || WORDPRESS_CATEGORY_SLUG;
  
  const CATEGORY_STATS_QUERY = `
    query GetCategoryStats($categoryName: String!) {
      category(id: $categoryName, idType: SLUG) {
        name
        slug
        count
        description
      }
    }
  `;
  
  try {
    const data = await graphqlRequest<WordPressCategoryStatsResponse>(CATEGORY_STATS_QUERY, { 
      categoryName: category 
    });
    return data.category;
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return null;
  }
}

/**
 * 取得多個分類的文章（聯合查詢）
 * @param categories 分類 slug 陣列（如果為空則返回所有文章）
 * @param first 每個分類取得的文章數量
 */
export async function getPostsFromMultipleCategories(
  categories: string[], 
  first = 20
) {
  try {
    // 如果沒有指定分類，返回所有文章
    if (categories.length === 0) {
      return await getPosts(first);
    }
    
    const allPosts = await Promise.all(
      categories.map(async (category) => {
        const data = await graphqlRequest<WordPressPostsResponse>(
          GET_POSTS_QUERY, 
          { first }
        );
        
        // 篩選屬於該分類的文章
        return data.posts.nodes.filter((post: WordPressPost) => 
          post.categories.nodes.some((cat: WordPressCategoryNode) => cat.slug === category)
        );
      })
    );
    
    // 合併並按日期排序
    return allPosts
      .flat()
      .sort((a: WordPressPost, b: WordPressPost) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, first);
  } catch (error) {
    console.error('Error fetching posts from multiple categories:', error);
    return [];
  }
}


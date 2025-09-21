import { BlogArticle } from './types';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_CONTENT_PATH = path.join(process.cwd(), 'content', 'blog');

// Cache for blog articles
let blogCache: BlogArticle[] | null = null;

/**
 * Get all published blog articles from MDX files
 */
export async function getAllBlogArticles(): Promise<BlogArticle[]> {
  if (blogCache) {
    return blogCache;
  }

  try {
    const files = fs.readdirSync(BLOG_CONTENT_PATH);
    const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

    const articles: BlogArticle[] = [];

    for (const file of mdxFiles) {
      const filePath = path.join(BLOG_CONTENT_PATH, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      // Skip if not published
      if (!data.published) continue;

      const slug = file.replace('.mdx', '');

      // Calculate reading time
      const wordsPerMinute = 200;
      const wordCount = content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / wordsPerMinute);

      const article: BlogArticle = {
        id: slug,
        title: data.title || '',
        slug,
        excerpt: data.excerpt || '',
        content,
        author: data.author || '',
        publishedAt: data.publishedAt
          ? `${data.publishedAt}T00:00:00Z`
          : new Date().toISOString(),
        updatedAt: data.updatedAt ? `${data.updatedAt}T00:00:00Z` : undefined,
        tags: [],
        featuredImage: data.featuredImage || null,
        readTime: data.readTime || readTime,
        published: data.published || false,
      };

      articles.push(article);
    }

    // Sort by publishedAt (newest first)
    const publishedArticles = articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    blogCache = publishedArticles;
    return publishedArticles;
  } catch (error) {
    console.error('Error reading blog articles:', error);
    return [];
  }
}

/**
 * Get a blog article by slug
 */
export async function getBlogArticleBySlug(
  slug: string
): Promise<BlogArticle | null> {
  const articles = await getAllBlogArticles();
  return articles.find((article) => article.slug === slug) || null;
}

/**
 * Get recent blog articles (limit by count)
 */
export async function getRecentBlogArticles(
  limit: number = 3
): Promise<BlogArticle[]> {
  const articles = await getAllBlogArticles();
  return articles.slice(0, limit);
}

/**
 * Search blog articles by title or content
 */
export async function searchBlogArticles(
  query: string
): Promise<BlogArticle[]> {
  const articles = await getAllBlogArticles();
  const lowercaseQuery = query.toLowerCase();

  return articles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowercaseQuery) ||
      article.excerpt.toLowerCase().includes(lowercaseQuery) ||
      article.content.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get related articles (simplified - just returns recent articles)
 */
export async function getRelatedBlogArticles(
  currentArticle: BlogArticle,
  limit: number = 3
): Promise<BlogArticle[]> {
  const articles = await getAllBlogArticles();

  // Return recent articles excluding the current one
  return articles
    .filter((article) => article.id !== currentArticle.id)
    .slice(0, limit);
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Format date for display
 */
export function formatBlogDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Generate blog article metadata
 */
export function generateBlogMetadata(article: BlogArticle) {
  return {
    title: `${article.title} | circular.moda Blog`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: article.featuredImage ? [article.featuredImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: article.featuredImage ? [article.featuredImage] : [],
    },
  };
}

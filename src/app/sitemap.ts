import { MetadataRoute } from 'next';
import { getAllBlogArticles } from './lib/blog';
import { getAllProducts } from './lib/products';

const baseUrl = 'https://circular.moda';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes with SEO-optimized priorities and change frequencies
  // Priority hierarchy: Homepage (1.0) > Main sections (0.9) > Category pages (0.8) > Individual pages (0.6-0.7)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily', // Homepage content updates frequently
      priority: 1.0, // Highest priority - always 1.0 for homepage
    },
    {
      url: `${baseUrl}/como-funciona`,
      lastModified: new Date(),
      changeFrequency: 'monthly', // Static informational page
      priority: 0.8, // Important but not as critical as main sections
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily', // New products added regularly
      priority: 0.9, // High priority - main product listing
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly', // New blog posts added weekly
      priority: 0.8, // Important content section
    },
  ];

  // Dynamic blog routes
  // Individual articles have lower priority than blog listing page
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllBlogArticles();
    blogRoutes = articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt
        ? new Date(article.updatedAt)
        : new Date(article.publishedAt),
      changeFrequency: 'weekly' as const, // Articles may be updated occasionally
      priority: 0.7, // Lower than blog listing (0.8) but still important
    }));
  } catch (error) {
    console.error('Error fetching blog articles for sitemap:', error);
  }

  // Dynamic product routes
  // Individual product pages have lower priority than products listing page
  // Change frequency is weekly since individual products don't change daily once created
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(), // Products don't have lastModified, use current date
      changeFrequency: 'weekly' as const, // Individual products are relatively static
      priority: 0.6, // Lower than products listing page (0.9) - follows SEO hierarchy
    }));
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  return [...staticRoutes, ...blogRoutes, ...productRoutes];
}

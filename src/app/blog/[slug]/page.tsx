import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getBlogArticleBySlug,
  getRelatedBlogArticles,
  generateBlogMetadata,
} from '../../lib/blog';
import BlogHero from '../../ui/blog-hero';
import BlogContent from '../../ui/blog-content';
import RelatedArticles from '../../ui/related-articles';

/** Fully static – no ISR */
export const revalidate = false;

/** Build-time generation of every slug */
export async function generateStaticParams() {
  const { getAllBlogArticles } = await import('../../lib/blog');
  const articles = await getAllBlogArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Artículo no encontrado | circular.moda',
    };
  }

  return generateBlogMetadata(article);
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await getBlogArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedBlogArticles(article, 3);

  return (
    <main className="min-h-screen">
      <BlogHero article={article} />
      <BlogContent article={article} />
      <RelatedArticles articles={relatedArticles} />
    </main>
  );
}

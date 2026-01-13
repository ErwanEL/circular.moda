import Link from 'next/link';
import { BlogArticle } from '../lib/types';
import { formatBlogDate } from '../lib/blog';

interface RelatedArticlesProps {
  articles: BlogArticle[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900">
          Artículos relacionados
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-lg"
            >
              <Link href={`/blog/${article.slug}`} className="block h-full">
                {article.featuredImage && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-opacity duration-300" />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="group-hover:text-primary-600 mb-3 text-lg font-bold text-gray-900 transition-colors duration-200">
                    {article.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-gray-600">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{article.author}</span>
                    <span>{formatBlogDate(article.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

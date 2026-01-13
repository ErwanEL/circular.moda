import Link from 'next/link';
import Image from 'next/image';
import { BlogArticle } from '../lib/types';
import { formatBlogDate } from '../lib/blog';

interface BlogCardProps {
  article: BlogArticle;
  featured?: boolean;
}

export default function BlogCard({ article, featured = false }: BlogCardProps) {
  const cardClasses = featured ? 'md:col-span-2 md:row-span-2' : '';

  return (
    <article
      className={`group relative overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-lg ${cardClasses}`}
    >
      <Link href={`/blog/${article.slug}`} className="block h-full">
        {article.featuredImage && (
          <div
            className={`relative ${featured ? 'h-64' : 'h-48'} overflow-hidden`}
          >
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={
                featured
                  ? '(max-width: 768px) 100vw, 50vw'
                  : '(max-width: 768px) 100vw, 33vw'
              }
            />
          </div>
        )}

        <div className="p-6">
          <h2
            className={`mb-3 font-bold text-gray-900 transition-colors duration-200 ${
              featured ? 'text-2xl' : 'text-xl'
            }`}
          >
            {article.title}
          </h2>

          <p className="mb-4 line-clamp-3 text-gray-600">{article.excerpt}</p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{article.author}</span>
              <span>•</span>
              <span>{formatBlogDate(article.publishedAt)}</span>
            </div>
            {/* <span className="flex items-center">
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {article.readTime} min
            </span> */}
          </div>
        </div>
      </Link>
    </article>
  );
}

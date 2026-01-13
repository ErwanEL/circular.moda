import { BlogArticle } from '../lib/types';
import { formatBlogDate } from '../lib/blog';
import Image from 'next/image';

interface BlogHeroProps {
  article: BlogArticle;
}

export default function BlogHero({ article }: BlogHeroProps) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {article.featuredImage && (
        <div className="absolute inset-0">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* dark scrim for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/35" />
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div
          className={[
            // a soft translucent card on small screens; becomes transparent on lg
            'mx-auto text-center',
            'rounded-xl bg-black/30 p-5 ring-1 ring-white/10 backdrop-blur-[2px]',
            'lg:backdrop-blur-0 sm:p-6 lg:bg-transparent lg:ring-0',
          ].join(' ')}
        >
          <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-100 sm:text-xl">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-center space-x-4 text-gray-200">
            <span className="font-medium">{article.author}</span>
            <span aria-hidden>•</span>
            <span>{formatBlogDate(article.publishedAt)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

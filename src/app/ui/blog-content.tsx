import { BlogArticle } from '../lib/types';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface BlogContentProps {
  article: BlogArticle;
}

export default function BlogContent({ article }: BlogContentProps) {
  // Read the MDX file content
  const filePath = path.join(
    process.cwd(),
    'content',
    'blog',
    `${article.slug}.mdx`
  );
  const fileContents = readFileSync(filePath, 'utf8');
  const { content } = matter(fileContents);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700 prose-hr:border-gray-300 max-w-none">
        <MDXRemote source={content} />
      </div>

      {article.updatedAt && article.updatedAt !== article.publishedAt && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            Última actualización:{' '}
            {new Date(article.updatedAt).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  );
}

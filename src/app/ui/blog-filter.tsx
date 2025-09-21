'use client';

import Link from 'next/link';
import { useState } from 'react';

interface BlogFilterProps {
  tags: string[];
  selectedTag?: string;
}

export default function BlogFilter({ tags, selectedTag }: BlogFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const displayTags = showAll ? tags : tags.slice(0, 6);

  return (
    <div className="mb-12">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Filtrar por etiquetas:
        </h3>
        <Link
          href="/blog"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            !selectedTag
              ? 'bg-primary-600 text-white'
              : 'hover:bg-primary-100 hover:text-primary-800 bg-gray-100 text-gray-700'
          }`}
        >
          Todas
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => (
          <Link
            key={tag}
            href={`/blog?tag=${encodeURIComponent(tag)}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              selectedTag === tag
                ? 'bg-primary-600 text-white'
                : 'hover:bg-primary-100 hover:text-primary-800 bg-gray-100 text-gray-700'
            }`}
          >
            {tag}
          </Link>
        ))}

        {tags.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-300"
          >
            {showAll ? 'Ver menos' : `+${tags.length - 6} más`}
          </button>
        )}
      </div>
    </div>
  );
}

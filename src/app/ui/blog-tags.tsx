'use client';

import Link from 'next/link';
import { useState } from 'react';

interface BlogTagsProps {
  tags: string[];
  selectedTag?: string;
}

export default function BlogTags({ tags, selectedTag }: BlogTagsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayTags = showAll ? tags : tags.slice(0, 8);

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Etiquetas populares
      </h3>

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

        {tags.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-300"
          >
            {showAll ? 'Ver menos' : `+${tags.length - 8} más`}
          </button>
        )}
      </div>
    </div>
  );
}

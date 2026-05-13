'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ProductFilters,
  writeProductFiltersToSearchParams,
} from '../../lib/product-filters';
import {
  transformProductsToCards,
  type ProductCard,
} from '../../lib/helpers';
import type { Product } from '../../lib/types';
import Card from '../../ui/card';

type ProductsPagePayload = {
  products: Product[];
  nextCursor: string | null;
  hasMore: boolean;
};

type Props = {
  initialCards: ProductCard[];
  initialNextCursor: string | null;
  pageSize: number;
  activeFilters: ProductFilters;
};

export default function ProductsGridInfinite({
  initialCards,
  initialNextCursor,
  pageSize,
  activeFilters,
}: Props) {
  const [cards, setCards] = useState<ProductCard[]>(initialCards);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCards(initialCards);
    setNextCursor(initialNextCursor);
    setLoading(false);
    setError(null);
  }, [initialCards, initialNextCursor]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        cursor: nextCursor,
      });
      writeProductFiltersToSearchParams(params, activeFilters);
      const url = `/api/products?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body?.message as string) || `HTTP ${res.status}`
        );
      }
      const data = (await res.json()) as ProductsPagePayload;
      const newCards = transformProductsToCards(data.products);
      setCards((prev) => [...prev, ...newCards]);
      setNextCursor(data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [activeFilters, nextCursor, loading, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          nextCursor != null &&
          !loading &&
          error == null
        ) {
          loadMore();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loading, error, loadMore]);

  return (
    <>
      <div className="mb-4 grid items-stretch gap-x-4 gap-y-8 sm:grid-cols-2 md:mb-8 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((cardData) => (
          <Card key={cardData.href} {...cardData} />
        ))}
      </div>
      {cards.length === 0 && !loading && (
        <div className="rounded-3xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No encontramos productos con esos filtros.
          </p>
        </div>
      )}
      <div
        ref={sentinelRef}
        className="flex min-h-[120px] items-center justify-center"
        aria-hidden
      >
        {loading && (
          <div
            className="flex justify-center py-8"
            role="status"
            aria-label="Cargando más productos"
          >
            <svg
              className="h-8 w-8 animate-spin text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <div className="py-6 text-center">
          <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              loadMore();
            }}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Reintentar
          </button>
        </div>
      )}
    </>
  );
}

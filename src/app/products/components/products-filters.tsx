'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  countActiveProductFacetFilters,
  normalizeProductFiltersInput,
  type ProductFilters,
  writeProductFiltersToSearchParams,
} from '../../lib/product-filters';
import {
  getCategoryLabel,
  getColorLabel,
  getGenderLabel,
} from '../../lib/product-option-labels';

type Props = {
  activeFilters: ProductFilters;
  categories: string[];
  colors: string[];
  genders: string[];
};

export default function ProductsFilters({
  activeFilters,
  categories,
  colors,
  genders,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(activeFilters.query ?? '');
  const [draftCategory, setDraftCategory] = useState(
    activeFilters.category ?? ''
  );
  const [draftColor, setDraftColor] = useState(activeFilters.color ?? '');
  const [draftGender, setDraftGender] = useState(activeFilters.gender ?? '');
  const [sizeValue, setSizeValue] = useState(activeFilters.size ?? '');
  const [priceMinValue, setPriceMinValue] = useState(
    activeFilters.priceMin !== undefined ? String(activeFilters.priceMin) : ''
  );
  const [priceMaxValue, setPriceMaxValue] = useState(
    activeFilters.priceMax !== undefined ? String(activeFilters.priceMax) : ''
  );
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const activeFilterCount = countActiveProductFacetFilters(activeFilters);

  function syncDraftFacetFilters(filters: ProductFilters) {
    setDraftCategory(filters.category ?? '');
    setDraftColor(filters.color ?? '');
    setDraftGender(filters.gender ?? '');
    setSizeValue(filters.size ?? '');
    setPriceMinValue(
      filters.priceMin !== undefined ? String(filters.priceMin) : ''
    );
    setPriceMaxValue(
      filters.priceMax !== undefined ? String(filters.priceMax) : ''
    );
  }

  function clearDraftFacetFilters() {
    setDraftCategory('');
    setDraftColor('');
    setDraftGender('');
    setSizeValue('');
    setPriceMinValue('');
    setPriceMaxValue('');
  }

  useEffect(() => {
    setSearchValue(activeFilters.query ?? '');
  }, [activeFilters.query]);

  useEffect(() => {
    syncDraftFacetFilters(activeFilters);
  }, [
    activeFilters.category,
    activeFilters.color,
    activeFilters.gender,
    activeFilters.size,
    activeFilters.priceMin,
    activeFilters.priceMax,
  ]);

  useEffect(() => {
    if (!isMobileModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileModalOpen]);

  function navigateWithFilters(nextFilters: ProductFilters) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    writeProductFiltersToSearchParams(params, nextFilters);
    const query = params.toString();
    const href = query === '' ? pathname : `${pathname}?${query}`;

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function buildDraftFacetFilters(): ProductFilters {
    return normalizeProductFiltersInput({
      category: draftCategory,
      color: draftColor,
      gender: draftGender,
      size: sizeValue,
      priceMin: priceMinValue,
      priceMax: priceMaxValue,
    });
  }

  function buildFiltersWithSearch(): ProductFilters {
    const normalizedSearch = normalizeProductFiltersInput({
      q: searchValue,
    });

    return {
      query: normalizedSearch.query,
      category: activeFilters.category,
      color: activeFilters.color,
      gender: activeFilters.gender,
      size: activeFilters.size,
      priceMin: activeFilters.priceMin,
      priceMax: activeFilters.priceMax,
    };
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateWithFilters(buildFiltersWithSearch());
  }

  function handleClearSearch() {
    setSearchValue('');
    navigateWithFilters({
      category: activeFilters.category,
      color: activeFilters.color,
      gender: activeFilters.gender,
      size: activeFilters.size,
      priceMin: activeFilters.priceMin,
      priceMax: activeFilters.priceMax,
    });
  }

  function handleApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateWithFilters({
      query: activeFilters.query,
      ...buildDraftFacetFilters(),
    });
  }

  function handleOpenMobileModal() {
    syncDraftFacetFilters(activeFilters);
    setIsMobileModalOpen(true);
  }

  function handleCloseMobileModal() {
    syncDraftFacetFilters(activeFilters);
    setIsMobileModalOpen(false);
  }

  function handleApplyMobileFilters() {
    setIsMobileModalOpen(false);
    navigateWithFilters({
      query: activeFilters.query,
      ...buildDraftFacetFilters(),
    });
  }

  function handleResetFilters() {
    clearDraftFacetFilters();
    navigateWithFilters(
      activeFilters.query ? { query: activeFilters.query } : {}
    );
    setIsMobileModalOpen(false);
  }

  function renderFilterFields() {
    return (
      <>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Categoría
          </span>
          <select
            value={draftCategory}
            onChange={(event) => setDraftCategory(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Color
          </span>
          <select
            value={draftColor}
            onChange={(event) => setDraftColor(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Todos los colores</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {getColorLabel(color)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Género
          </span>
          <select
            value={draftGender}
            onChange={(event) => setDraftGender(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Todos los géneros</option>
            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {getGenderLabel(gender)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Talle
          </span>
          <input
            type="text"
            value={sizeValue}
            onChange={(event) => setSizeValue(event.target.value)}
            placeholder="Ej: M o 38/39"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Precio mínimo
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={priceMinValue}
            onChange={(event) => setPriceMinValue(event.target.value)}
            placeholder="0"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Precio máximo
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={priceMaxValue}
            onChange={(event) => setPriceMaxValue(event.target.value)}
            placeholder="100000"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label
            htmlFor="products-catalog-search"
            className="block min-w-0 flex-1 cursor-text"
          >
            <span className="sr-only">Buscar productos</span>
            <div
              dir="ltr"
              className="flex min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white py-3.5 pr-2 pl-3 sm:pl-4 dark:border-gray-700 dark:bg-gray-950"
            >
              <svg
                className="pointer-events-none h-5 w-5 shrink-0 self-center text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="products-catalog-search"
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                role="searchbox"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar en el catalogo"
                className="catalog-search-input min-h-0 min-w-0 flex-1 appearance-none self-center border-0 bg-transparent py-0 text-sm leading-5 text-gray-900 shadow-none outline-none ring-0 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0 dark:text-white"
              />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center self-center">
                {searchValue.trim() !== '' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClearSearch();
                    }}
                    disabled={isPending}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-gray-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isPending ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <div className="md:rounded-3xl md:border md:border-gray-200 md:bg-white md:p-5 md:shadow-sm md:dark:border-gray-800 md:dark:bg-gray-950">
          <div className="flex justify-end md:hidden">
            <button
              type="button"
              onClick={handleOpenMobileModal}
              aria-haspopup="dialog"
              aria-expanded={isMobileModalOpen}
              className="inline-flex items-center gap-3 rounded-full border-2 border-teal-600 bg-white px-5 py-3 text-base font-medium text-gray-900 transition hover:border-teal-700 hover:text-teal-700 dark:border-teal-500 dark:bg-gray-950 dark:text-white dark:hover:border-teal-400 dark:hover:text-teal-300"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="17" x2="20" y2="17" />
                <circle cx="9" cy="7" r="2" />
                <circle cx="15" cy="17" r="2" />
              </svg>
              <span>
                Filtros
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </span>
            </button>
          </div>

          <form
            className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.35fr)_minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]"
            onSubmit={handleApplyFilters}
          >
            {renderFilterFields()}

            <div className="flex flex-wrap items-end gap-3 xl:justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {isPending ? 'Actualizando...' : 'Aplicar filtros'}
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={isPending || activeFilterCount === 0}
                className="rounded-full border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      {isMobileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-white md:hidden dark:bg-gray-950"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de productos"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <button
              type="button"
              onClick={handleCloseMobileModal}
              className="rounded-full p-2 text-gray-900 transition hover:bg-gray-100 dark:text-white dark:hover:bg-gray-900"
              aria-label="Cerrar filtros"
            >
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Filtrar
            </h2>

            <button
              type="button"
              onClick={clearDraftFacetFilters}
              className="text-base font-medium text-gray-900 transition hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
            >
              Borrar todos
            </button>
          </div>

          <div className="flex h-[calc(100dvh-73px)] flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="grid gap-5">{renderFilterFields()}</div>
            </div>

            <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseMobileModal}
                  className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobileFilters}
                  disabled={isPending}
                  className="flex-1 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {isPending ? 'Aplicando...' : 'Aplicar filtros'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

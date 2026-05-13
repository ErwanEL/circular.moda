export type ProductFilters = {
  category?: string;
  color?: string;
  gender?: string;
  size?: string;
  priceMin?: number;
  priceMax?: number;
};

export type ProductFilterOptions = {
  categories: string[];
  colors: string[];
  genders: string[];
};

type SearchParamValue = string | string[] | null | undefined;

export const PRODUCT_FILTER_PARAM_KEYS = [
  'category',
  'color',
  'gender',
  'size',
  'priceMin',
  'priceMax',
] as const;

function getFirstSearchParamValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value.find((entry) => typeof entry === 'string');
  }

  return typeof value === 'string' ? value : undefined;
}

function normalizeTextFilter(value: SearchParamValue): string | undefined {
  const rawValue = getFirstSearchParamValue(value);
  if (!rawValue) {
    return undefined;
  }

  const normalizedValue = rawValue.trim();
  return normalizedValue === '' ? undefined : normalizedValue;
}

function normalizePriceFilter(value: SearchParamValue): number | undefined {
  const rawValue = normalizeTextFilter(value);
  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return undefined;
  }

  return parsedValue;
}

function getOptionKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function resolveOptionValue(
  value: string | undefined,
  options: string[]
): string | undefined {
  if (!value) {
    return undefined;
  }

  const optionMap = new Map(
    options.map((option) => [getOptionKey(option), option] as const)
  );

  return optionMap.get(getOptionKey(value));
}

export function normalizeProductFiltersInput(input: {
  category?: SearchParamValue;
  color?: SearchParamValue;
  gender?: SearchParamValue;
  size?: SearchParamValue;
  priceMin?: SearchParamValue;
  priceMax?: SearchParamValue;
}): ProductFilters {
  const priceMin = normalizePriceFilter(input.priceMin);
  const priceMax = normalizePriceFilter(input.priceMax);

  if (
    priceMin !== undefined &&
    priceMax !== undefined &&
    priceMin > priceMax
  ) {
    return {
      category: normalizeTextFilter(input.category),
      color: normalizeTextFilter(input.color),
      gender: normalizeTextFilter(input.gender),
      size: normalizeTextFilter(input.size),
      priceMin: priceMax,
      priceMax: priceMin,
    };
  }

  return {
    category: normalizeTextFilter(input.category),
    color: normalizeTextFilter(input.color),
    gender: normalizeTextFilter(input.gender),
    size: normalizeTextFilter(input.size),
    priceMin,
    priceMax,
  };
}

export function resolveProductFiltersAgainstOptions(
  filters: ProductFilters,
  options: ProductFilterOptions
): ProductFilters {
  return {
    category: resolveOptionValue(filters.category, options.categories),
    color: resolveOptionValue(filters.color, options.colors),
    gender: resolveOptionValue(filters.gender, options.genders),
    size: filters.size,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  };
}

export function hasActiveProductFilters(filters: ProductFilters): boolean {
  return (
    filters.category !== undefined ||
    filters.color !== undefined ||
    filters.gender !== undefined ||
    filters.size !== undefined ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined
  );
}

export function countActiveProductFilters(filters: ProductFilters): number {
  return [
    filters.category,
    filters.color,
    filters.gender,
    filters.size,
    filters.priceMin,
    filters.priceMax,
  ].filter((value) => value !== undefined).length;
}

export function writeProductFiltersToSearchParams(
  params: URLSearchParams,
  filters: ProductFilters
): URLSearchParams {
  for (const key of PRODUCT_FILTER_PARAM_KEYS) {
    params.delete(key);
  }

  if (filters.category) {
    params.set('category', filters.category);
  }

  if (filters.color) {
    params.set('color', filters.color);
  }

  if (filters.gender) {
    params.set('gender', filters.gender);
  }

  if (filters.size) {
    params.set('size', filters.size);
  }

  if (filters.priceMin !== undefined) {
    params.set('priceMin', String(filters.priceMin));
  }

  if (filters.priceMax !== undefined) {
    params.set('priceMax', String(filters.priceMax));
  }

  return params;
}

export function serializeProductFilters(filters: ProductFilters): string {
  return JSON.stringify({
    category: filters.category ?? null,
    color: filters.color ?? null,
    gender: filters.gender ?? null,
    size: filters.size ?? null,
    priceMin: filters.priceMin ?? null,
    priceMax: filters.priceMax ?? null,
  });
}

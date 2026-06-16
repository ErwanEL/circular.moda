'use client';

import type { ReactNode } from 'react';
import {
  HiClipboardDocumentList,
  HiCurrencyDollar,
  HiSparkles,
  HiSwatch,
  HiTag,
  HiUserGroup,
} from 'react-icons/hi2';
import { getColorLabel, getCategoryLabel, getGenderLabel } from './labels-es';

interface FormFieldsEsProps {
  name: string;
  price: string;
  size: string;
  color: string;
  category: string;
  gender: string[];
  description: string;

  colors: string[];
  loadingColors: boolean;
  colorsError: string | null;
  categories: string[];
  loadingCategories: boolean;
  categoriesError: string | null;
  gendersList: string[];
  loadingGenders: boolean;
  gendersError: string | null;

  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const inputClasses =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary-800 focus:ring-2 focus:ring-primary-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const sectionClasses =
  'rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800';

const colorSwatches: Record<string, string> = {
  beige: '#d8c3a5',
  black: '#111827',
  blue: '#2563eb',
  brown: '#7c4a2d',
  burgundy: '#7f1d1d',
  charcoal: '#374151',
  coral: '#fb7185',
  cream: '#f5f1de',
  cyan: '#06b6d4',
  gold: '#d4a017',
  gray: '#9ca3af',
  green: '#16a34a',
  grey: '#9ca3af',
  ivory: '#fffff0',
  lavender: '#c4b5fd',
  lime: '#84cc16',
  magenta: '#c026d3',
  maroon: '#800000',
  mint: '#86efac',
  mustard: '#ca8a04',
  navy: '#1e3a8a',
  nude: '#e7c8ad',
  olive: '#708238',
  orange: '#f97316',
  other: '#e5e7eb',
  pink: '#ec4899',
  purple: '#9333ea',
  red: '#dc2626',
  silver: '#d1d5db',
  tan: '#c19a6b',
  teal: '#0f766e',
  white: '#ffffff',
  yellow: '#facc15',
};

function getSwatchColor(value: string) {
  return colorSwatches[value.toLowerCase().trim()] ?? '#e5e7eb';
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex gap-3">
      <div className="bg-primary-100 text-primary-900 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-800 dark:text-gray-200"
      >
        {children}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormFieldsEs({
  name,
  price,
  size,
  color,
  category,
  gender,
  description,
  colors,
  loadingColors,
  colorsError,
  categories,
  loadingCategories,
  categoriesError,
  gendersList,
  loadingGenders,
  gendersError,
  onNameChange,
  onPriceChange,
  onSizeChange,
  onColorChange,
  onCategoryChange,
  onGenderChange,
  onDescriptionChange,
}: FormFieldsEsProps) {
  return (
    <>
      <section className={sectionClasses}>
        <SectionHeader
          icon={<HiSparkles className="h-5 w-5" />}
          title="Hacé que se entienda en segundos"
          description="Un nombre claro, un precio y el talle ayudan a que alguien se imagine la prenda puesta."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel
              htmlFor="name"
              required
              hint="Usá palabras que la persona buscaría."
            >
              Nombre de la prenda
            </FieldLabel>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={inputClasses}
              placeholder="Ej: Vestido de lino verde"
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="price" hint="En pesos argentinos, sin puntos.">
              <span className="inline-flex items-center gap-2">
                <HiCurrencyDollar className="h-4 w-4 text-gray-500" />
                Precio
              </span>
            </FieldLabel>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className={inputClasses}
              placeholder="Ej: 15000"
              min="0"
              step="1"
            />
          </div>

          <div>
            <FieldLabel htmlFor="size" hint="Talle, medidas o fit.">
              <span className="inline-flex items-center gap-2">
                <HiTag className="h-4 w-4 text-gray-500" />
                Talle
              </span>
            </FieldLabel>
            <input
              type="text"
              id="size"
              value={size}
              onChange={(e) => onSizeChange(e.target.value)}
              className={inputClasses}
              placeholder="Ej: M, 42, S/M/L"
            />
          </div>
        </div>
      </section>

      <section className={sectionClasses}>
        <SectionHeader
          icon={<HiClipboardDocumentList className="h-5 w-5" />}
          title="Ordená los detalles"
          description="Estos datos hacen que tu prenda aparezca mejor en filtros y catálogos."
        />

        <div className="grid gap-5">
          <div>
            <FieldLabel htmlFor="category">
              <span className="inline-flex items-center gap-2">
                <HiClipboardDocumentList className="h-4 w-4 text-gray-500" />
                Categoría
              </span>
            </FieldLabel>
            {loadingCategories ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Cargando categorías...
              </div>
            ) : categoriesError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {categoriesError}
              </div>
            ) : (
              <select
                id="category"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={inputClasses}
              >
                <option value="">Elegí una categoría</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <FieldLabel hint="Elegí el tono que más la representa.">
              <span className="inline-flex items-center gap-2">
                <HiSwatch className="h-4 w-4 text-gray-500" />
                Color
              </span>
            </FieldLabel>
            {loadingColors ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Cargando colores...
              </div>
            ) : colorsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {colorsError}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => onColorChange('')}
                    className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      color === ''
                        ? 'border-primary-800 bg-primary-100 text-primary-900'
                        : 'border-transparent bg-white text-gray-700 hover:border-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                    aria-pressed={color === ''}
                  >
                    <span className="h-4 w-4 rounded-full border border-dashed border-gray-400 bg-white" />
                    Sin color
                  </button>
                  {colors.map((c) => {
                    const isSelected = color === c;

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onColorChange(c)}
                        className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? 'border-primary-800 bg-primary-100 text-primary-900'
                            : 'border-transparent bg-white text-gray-700 hover:border-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-gray-300"
                          style={{ backgroundColor: getSwatchColor(c) }}
                        />
                        <span className="truncate">{getColorLabel(c)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <FieldLabel>
              <span className="inline-flex items-center gap-2">
                <HiUserGroup className="h-4 w-4 text-gray-500" />
                Género
              </span>
            </FieldLabel>
            {loadingGenders ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Cargando géneros...
              </div>
            ) : gendersError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {gendersError}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {gendersList?.map((g) => {
                  const isSelected = gender?.[0] === g;

                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => onGenderChange(isSelected ? '' : g)}
                      className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-primary-800 bg-primary-800 text-white'
                          : 'hover:border-primary-500 hover:text-primary-900 border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {getGenderLabel(g)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <FieldLabel
              htmlFor="description"
              hint="Estado, tela, medidas o cómo queda. Dos líneas ya ayudan mucho."
            >
              Descripción
            </FieldLabel>
            <textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={5}
              className={inputClasses}
              placeholder="Ej: Usado pocas veces, tela fresca, queda suelto y cómodo."
            />
          </div>
        </div>
      </section>
    </>
  );
}

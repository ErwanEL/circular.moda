'use client';

import {
  getColorLabel,
  getCategoryLabel,
  getGenderLabel,
} from './labels-es';

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
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Nombre de la prenda *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Ej: Vestido de lino verde"
          required
        />
      </div>

      <div>
        <label
          htmlFor="price"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Precio
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Ej: 15000"
          min="0"
          step="1"
        />
      </div>

      <div>
        <label
          htmlFor="size"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Talle
        </label>
        <input
          type="text"
          id="size"
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Ej: M, 42, S/M/L"
        />
      </div>

      <div>
        <label
          htmlFor="color"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Color
        </label>
        {loadingColors ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Cargando colores...
          </div>
        ) : colorsError ? (
          <div className="text-sm text-red-600 dark:text-red-400">
            {colorsError}
          </div>
        ) : (
          <select
            id="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Elegí un color --</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {getColorLabel(c)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Categoría
        </label>
        {loadingCategories ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Cargando categorías...
          </div>
        ) : categoriesError ? (
          <div className="text-sm text-red-600 dark:text-red-400">
            {categoriesError}
          </div>
        ) : (
          <select
            id="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Elegí una categoría --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Género
        </label>
        {loadingGenders ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Cargando géneros...
          </div>
        ) : gendersError ? (
          <div className="text-sm text-red-600 dark:text-red-400">
            {gendersError}
          </div>
        ) : (
          <select
            id="gender"
            value={gender?.[0] ?? ''}
            onChange={(e) => onGenderChange(e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Elegí un género --</option>
            {gendersList?.map((g) => (
              <option key={g} value={g}>
                {getGenderLabel(g)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Descripción
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Descripción de la prenda..."
        />
      </div>
    </>
  );
}

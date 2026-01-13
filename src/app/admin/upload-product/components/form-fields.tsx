'use client';

interface FormFieldsProps {
  // Form values
  name: string;
  price: string;
  size: string;
  color: string;
  category: string;
  gender: string[];
  description: string;
  featured: boolean;

  // Options
  colors: string[];
  loadingColors: boolean;
  colorsError: string | null;
  categories: string[];
  loadingCategories: boolean;
  categoriesError: string | null;
  gendersList: string[];
  loadingGenders: boolean;
  gendersError: string | null;

  // Handlers
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onGenderToggle: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFeaturedChange: (value: boolean) => void;
}

export function FormFields({
  name,
  price,
  size,
  color,
  category,
  gender,
  description,
  featured,
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
  onGenderToggle,
  onDescriptionChange,
  onFeaturedChange,
}: FormFieldsProps) {
  return (
    <>
      {/* Nom du produit */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Nom du produit *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Vestido Lino Verde"
          required
        />
      </div>

      {/* Prix */}
      <div>
        <label
          htmlFor="price"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Prix
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Ex: 10000"
          min="0"
          step="1"
        />
      </div>

      {/* Taille */}
      <div>
        <label
          htmlFor="size"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Taille
        </label>
        <input
          type="text"
          id="size"
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Ex: M, 42, S/M/L"
        />
      </div>

      {/* Couleur */}
      <div>
        <label
          htmlFor="color"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Couleur
        </label>
        {loadingColors ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Chargement des couleurs...
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
            <option value="">-- Sélectionner une couleur --</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Catégorie */}
      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Catégorie
        </label>
        {loadingCategories ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Chargement des catégories...
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
            <option value="">-- Sélectionner une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Genre */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Genre
        </label>
        {loadingGenders ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Chargement des genres...
          </div>
        ) : gendersError ? (
          <div className="text-sm text-red-600 dark:text-red-400">
            {gendersError}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gendersList &&
              gendersList.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGenderToggle(g)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    gender.includes(g)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                  {gender.includes(g) && ' ✓'}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Description du produit..."
        />
      </div>

      {/* Featured */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="featured"
          checked={featured}
          onChange={(e) => onFeaturedChange(e.target.checked)}
          className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
        />
        <label
          htmlFor="featured"
          className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Produit en vedette
        </label>
      </div>
    </>
  );
}



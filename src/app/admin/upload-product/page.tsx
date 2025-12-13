'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import UserSelector from '@/app/ui/user-selector';

export default function UploadProductPage() {
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // AI Mode (activé par défaut)
  const [aiMode, setAiMode] = useState(true);
  const [aiDescription, setAiDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch colors from Supabase public.colors
  const [colors, setColors] = useState<string[]>([]);
  const [loadingColors, setLoadingColors] = useState(true);
  const [colorsError, setColorsError] = useState<string | null>(null);
  // Fetch categories from Supabase public.categories
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  // Fetch genders from Supabase public.genders
  const [gendersList, setGendersList] = useState<string[]>([]);
  const [loadingGenders, setLoadingGenders] = useState(true);
  const [gendersError, setGendersError] = useState<string | null>(null);

  // Fetch categories and colors on mount
  useEffect(() => {
    const fetchColors = async () => {
      setLoadingColors(true);
      setColorsError(null);
      try {
        const res = await fetch('/api/colors');
        if (!res.ok) throw new Error('Erreur lors du chargement des couleurs');
        const data = await res.json();
        if (Array.isArray(data.colors)) {
          const sortedColors = data.colors
            .slice()
            .sort((a, b) =>
              a.localeCompare(b, undefined, { sensitivity: 'base' })
            );
          setColors(sortedColors);
        } else {
          setColors([]);
        }
      } catch (err) {
        setColorsError('Impossible de charger les couleurs');
        setColors([]);
      }
      setLoadingColors(false);
    };
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setCategoriesError(null);
      try {
        const res = await fetch('/api/categories');
        if (!res.ok)
          throw new Error('Erreur lors du chargement des catégories');
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        setCategoriesError('Impossible de charger les catégories');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    const fetchGenders = async () => {
      setLoadingGenders(true);
      setGendersError(null);
      try {
        const res = await fetch('/api/genders');
        if (!res.ok) throw new Error('Erreur lors du chargement des genres');
        const data = await res.json();
        if (Array.isArray(data.genders)) {
          setGendersList(data.genders);
        } else {
          setGendersList([]);
        }
      } catch (err) {
        setGendersError('Impossible de charger les genres');
        setGendersList([]);
      } finally {
        setLoadingGenders(false);
      }
    };

    fetchCategories();
    fetchColors();
    fetchGenders();
  }, []);

  const handleGenderToggle = (g: string) => {
    setGender((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const handleAiAnalyze = async () => {
    if (!aiDescription.trim()) {
      setMessage({
        type: 'error',
        text: "Veuillez entrer une description pour l'analyse AI",
      });
      return;
    }

    if (files.length === 0) {
      setMessage({
        type: 'error',
        text: "Veuillez ajouter au moins une image pour l'analyse AI",
      });
      return;
    }

    setAnalyzing(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('textDescription', aiDescription.trim());
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/ai-analyze-product', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      await fetchGenders();
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'analyse AI");
      }

      // Remplir automatiquement les champs avec les données AI
      if (result.data) {
        const data = result.data;
        if (data.name) setName(data.name);
        if (data.price) setPrice(data.price);
        if (data.size) setSize(data.size);
        if (data.color) setColor(data.color);
        if (data.category) setCategory(data.category);
        if (data.gender && Array.isArray(data.gender)) setGender(data.gender);
        if (data.description) setDescription(data.description);
        if (data.featured !== undefined) setFeatured(data.featured);

        setMessage({
          type: 'success',
          text: 'Analyse AI terminée ! Les champs ont été remplis automatiquement.',
        });
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse AI",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);

      // Créer des previews
      const newPreviews = acceptedFiles.map((file) => {
        return URL.createObjectURL(file);
      });
      setPreviews([...previews, ...newPreviews]);
    },
    [files, previews]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    // Revoke object URL to free memory
    URL.revokeObjectURL(previews[index]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un nom de produit' });
      return;
    }

    if (!ownerId) {
      setMessage({
        type: 'error',
        text: 'Veuillez sélectionner ou créer un utilisateur',
      });
      return;
    }

    if (files.length === 0) {
      setMessage({
        type: 'error',
        text: 'Veuillez ajouter au moins une image',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('ownerId', ownerId);
      if (price) formData.append('price', price);
      if (size) formData.append('size', size);
      if (color) formData.append('color', color);
      if (category) formData.append('category', category);
      if (gender.length > 0) formData.append('gender', JSON.stringify(gender));
      if (description) formData.append('description', description);
      formData.append('featured', featured.toString());
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/upload-product', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setMessage({ type: 'success', text: 'Produit uploadé avec succès !' });
      // Reset form
      setName('');
      setOwnerId('');
      setPrice('');
      setSize('');
      setColor('');
      setCategory('');
      setGender([]);
      setDescription('');
      setFeatured(false);
      setFiles([]);
      // Revoke all object URLs before clearing previews
      previews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : "Erreur lors de l'upload",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg bg-white p-6 shadow sm:p-8 dark:bg-gray-800">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Uploader un Produit
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Toggle AI Mode */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode AI (Remplissage automatique)
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Utilisez l'IA pour analyser les images et remplir
                  automatiquement les champs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiMode(!aiMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* AI Description Field */}
            {aiMode && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <label
                  htmlFor="aiDescription"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description du produit (pour l'analyse AI) *
                </label>
                <textarea
                  id="aiDescription"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={2}
                  className="focus:ring-primary-500 focus:border-primary-500 mb-3 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Jeans Zara hombre talle 42/44 anchos a $50.000"
                />
                <button
                  type="button"
                  onClick={handleAiAnalyze}
                  disabled={
                    analyzing || !aiDescription.trim() || files.length === 0
                  }
                  className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing ? 'Analyse en cours...' : 'Analyser avec AI'}
                </button>
              </div>
            )}

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
                onChange={(e) => setName(e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Vestido Lino Verde"
                required
              />
            </div>

            {/* Sélection/Création d'utilisateur */}
            <div>
              <UserSelector value={ownerId} onChange={setOwnerId} required />
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
                onChange={(e) => setPrice(e.target.value)}
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
                onChange={(e) => setSize(e.target.value)}
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
                  onChange={(e) => setColor(e.target.value)}
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
                  onChange={(e) => setCategory(e.target.value)}
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
                        onClick={() => handleGenderToggle(g)}
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
                onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setFeatured(e.target.checked)}
                className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="featured"
                className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Produit en vedette
              </label>
            </div>

            {/* Zone de drag & drop */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Images *
              </label>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isDragActive ? (
                    <p className="text-primary-600 dark:text-primary-400">
                      Déposez les images ici...
                    </p>
                  ) : (
                    <>
                      <p className="text-gray-600 dark:text-gray-400">
                        Glissez-déposez des images ici, ou cliquez pour
                        sélectionner
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PNG, JPG, WEBP jusqu'à 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Preview des images */}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-full rounded-md object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div className="bg-opacity-50 absolute right-0 bottom-0 left-0 rounded-b-md bg-black p-1 text-xs text-white">
                        {files[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-md p-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={uploading}
              className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 w-full rounded-md px-4 py-3 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Upload en cours...' : 'Uploader le produit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

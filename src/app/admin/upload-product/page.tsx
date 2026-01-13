'use client';

import { useState, useCallback, useEffect } from 'react';
import UserSelector from '@/app/ui/user-selector';
import {
  useColors,
  useCategories,
  useGenders,
} from './hooks/use-supabase-data';
import { useProductForm } from './hooks/use-product-form';
import { useImageUpload } from './hooks/use-image-upload';
import { useAiAnalysis } from './hooks/use-ai-analysis';
import { AiModeSection } from './components/ai-mode-section';
import { ImageUploadSection } from './components/image-upload-section';
import { FormFields } from './components/form-fields';

export default function UploadProductPage() {
  // Supabase data hooks
  const colors = useColors();
  const categories = useCategories();
  const genders = useGenders();

  // Image upload hook
  const { files, previews, addFiles, removeFile, clearAll } = useImageUpload();

  // Product form hook
  const {
    formData,
    updateField,
    validateAndPrepare,
    reset: resetForm,
  } = useProductForm({
    colors: colors.data,
    categories: categories.data,
    genders: genders.data,
  });

  // AI Analysis hook
  const { analyzing, analyze: analyzeWithAI } = useAiAnalysis();

  // Local state
  const [ownerId, setOwnerId] = useState('');

  // Sync ownerId to form data when it changes
  useEffect(() => {
    updateField('ownerId', ownerId);
  }, [ownerId, updateField]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [aiMode, setAiMode] = useState(true);
  const [aiDescription, setAiDescription] = useState('');

  // Handle AI analysis
  const handleAiAnalyze = useCallback(async () => {
    const result = await analyzeWithAI(aiDescription, files, {
      colors: colors.data,
      categories: categories.data,
      genders: genders.data,
    });

    if (!result.success) {
      setMessage({
        type: 'error',
        text: result.error || "Erreur lors de l'analyse AI",
      });
      return;
    }

    if (result.data) {
      // Update form fields with AI data
      if (result.data.name) updateField('name', result.data.name);
      if (result.data.price) updateField('price', result.data.price);
      if (result.data.size) updateField('size', result.data.size);
      if (result.data.color) {
        updateField('color', result.data.color);
      }
      if (result.data.category) {
        updateField('category', result.data.category);
      }
      if (result.data.gender && Array.isArray(result.data.gender)) {
        updateField('gender', result.data.gender);
      }
      if (result.data.description)
        updateField('description', result.data.description);
      if (result.data.featured !== undefined)
        updateField('featured', result.data.featured);

      const messageText =
        result.warnings && result.warnings.length > 0
          ? `Analyse AI terminée ! ${result.warnings.join(', ')}. Veuillez sélectionner manuellement.`
          : 'Analyse AI terminée ! Les champs ont été remplis automatiquement.';

      setMessage({
        type:
          result.warnings && result.warnings.length > 0 ? 'error' : 'success',
        text: messageText,
      });
    }
  }, [
    aiDescription,
    files,
    colors.data,
    categories.data,
    genders.data,
    analyzeWithAI,
    updateField,
  ]);

  // Handle gender toggle
  const handleGenderToggle = useCallback(
    (g: string) => {
      const currentGender = formData.gender;
      const newGender = currentGender.includes(g)
        ? currentGender.filter((item) => item !== g)
        : [...currentGender, g];
      updateField('gender', newGender);
    },
    [formData.gender, updateField]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);

      // Validate files
      if (files.length === 0) {
        setMessage({
          type: 'error',
          text: 'Veuillez ajouter au moins une image',
        });
        return;
      }

      // Validate ownerId (check both component state and form data)
      if (!ownerId || ownerId.trim() === '') {
        setMessage({
          type: 'error',
          text: 'Veuillez sélectionner ou créer un utilisateur',
        });
        return;
      }

      // Validate and prepare form data
      const validation = validateAndPrepare();
      if (!validation.isValid) {
        setMessage({
          type: 'error',
          text: validation.error || 'Erreur de validation',
        });
        return;
      }

      setUploading(true);

      try {
        const formDataToSend = new FormData();
        formDataToSend.append('name', validation.validatedData.name!);
        formDataToSend.append('ownerId', ownerId);
        if (validation.validatedData.price)
          formDataToSend.append('price', validation.validatedData.price);
        if (validation.validatedData.size)
          formDataToSend.append('size', validation.validatedData.size);
        if (validation.validatedData.color)
          formDataToSend.append('color', validation.validatedData.color);
        if (validation.validatedData.category)
          formDataToSend.append('category', validation.validatedData.category);
        if (
          validation.validatedData.gender &&
          validation.validatedData.gender.length > 0
        )
          formDataToSend.append(
            'gender',
            JSON.stringify(validation.validatedData.gender)
          );
        if (validation.validatedData.description)
          formDataToSend.append(
            'description',
            validation.validatedData.description
          );
        formDataToSend.append(
          'featured',
          String(validation.validatedData.featured || false)
        );
        files.forEach((file) => {
          formDataToSend.append('images', file);
        });

        const response = await fetch('/api/admin/upload-product', {
          method: 'POST',
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l'upload");
        }

        setMessage({ type: 'success', text: 'Produit uploadé avec succès !' });

        // Reset form
        resetForm();
        setOwnerId('');
        clearAll();
        setAiDescription('');
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
    },
    [files, ownerId, validateAndPrepare, resetForm, clearAll]
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg bg-white p-6 shadow sm:p-8 dark:bg-gray-800">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Uploader un Produit
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Mode Section */}
            <AiModeSection
              aiMode={aiMode}
              onToggle={() => setAiMode(!aiMode)}
              aiDescription={aiDescription}
              onDescriptionChange={setAiDescription}
              onAnalyze={handleAiAnalyze}
              analyzing={analyzing}
              hasFiles={files.length > 0}
            />

            {/* Form Fields */}
            <FormFields
              name={formData.name}
              price={formData.price}
              size={formData.size}
              color={formData.color}
              category={formData.category}
              gender={formData.gender}
              description={formData.description}
              featured={formData.featured}
              colors={colors.data}
              loadingColors={colors.loading}
              colorsError={colors.error}
              categories={categories.data}
              loadingCategories={categories.loading}
              categoriesError={categories.error}
              gendersList={genders.data}
              loadingGenders={genders.loading}
              gendersError={genders.error}
              onNameChange={(value) => updateField('name', value)}
              onPriceChange={(value) => updateField('price', value)}
              onSizeChange={(value) => updateField('size', value)}
              onColorChange={(value) => updateField('color', value)}
              onCategoryChange={(value) => updateField('category', value)}
              onGenderToggle={handleGenderToggle}
              onDescriptionChange={(value) => updateField('description', value)}
              onFeaturedChange={(value) => updateField('featured', value)}
            />

            {/* Sélection/Création d'utilisateur */}
            <div>
              <UserSelector value={ownerId} onChange={setOwnerId} required />
            </div>

            {/* Image Upload Section */}
            <ImageUploadSection
              files={files}
              previews={previews}
              onDrop={addFiles}
              onRemove={removeFile}
            />

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

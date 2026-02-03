'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useColors,
  useCategories,
  useGenders,
} from '@/app/admin/upload-product/hooks/use-supabase-data';
import { useProductForm } from '@/app/admin/upload-product/hooks/use-product-form';
import { useImageUpload } from '@/app/admin/upload-product/hooks/use-image-upload';
import { FormFieldsEs } from './form-fields-es';
import { ImageUploadSectionEs } from './image-upload-section-es';
import { Alert, Spinner } from 'flowbite-react';
import Button from '@/app/ui/button';

export default function MeAddProductPage() {
  const router = useRouter();
  const colors = useColors();
  const categories = useCategories();
  const genders = useGenders();

  const { files, previews, addFiles, removeFile, clearAll } = useImageUpload();

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

  const [ownerId, setOwnerId] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (!response.ok) throw new Error('Error loading profile');
        const data = await response.json();
        if (data.user?.id) {
          setOwnerId(String(data.user.id));
          updateField('ownerId', String(data.user.id));
        }
      } catch {
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [router, updateField]);

  useEffect(() => {
    if (ownerId) updateField('ownerId', ownerId);
  }, [ownerId, updateField]);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);

      if (files.length === 0) {
        setMessage({
          type: 'error',
          text: 'Agregá al menos una imagen',
        });
        return;
      }

      if (!ownerId || ownerId.trim() === '') {
        setMessage({
          type: 'error',
          text: 'Completá tu perfil (nombre y WhatsApp) en Mi Perfil antes de publicar.',
        });
        return;
      }

      const validation = validateAndPrepare();
      if (!validation.isValid) {
        setMessage({
          type: 'error',
          text: validation.error || 'Error de validación',
        });
        return;
      }

      setUploading(true);

      try {
        const formDataToSend = new FormData();
        formDataToSend.append('name', validation.validatedData.name!);
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
        formDataToSend.append('featured', 'false');
        files.forEach((file) => {
          formDataToSend.append('images', file);
        });

        const response = await fetch('/api/me/upload-product', {
          method: 'POST',
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al publicar la prenda');
        }

        setMessage({
          type: 'success',
          text: 'Prenda publicada correctamente.',
        });
        resetForm();
        clearAll();

        setTimeout(() => {
          router.push('/me');
        }, 1500);
      } catch (error) {
        console.error('Upload error:', error);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Error al publicar',
        });
      } finally {
        setUploading(false);
      }
    },
    [files, ownerId, validateAndPrepare, resetForm, clearAll, router]
  );

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </main>
    );
  }

  if (!ownerId) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Alert color="warning">
            <span className="font-medium">Completá tu perfil primero.</span>{' '}
            Agregá tu nombre y WhatsApp en tu perfil para poder publicar
            prendas.
          </Alert>
          <div className="mt-6">
            <Button href="/me" variant="primary" solid>
              Ir a Mi Perfil
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Button href="/me" variant="secondary">
            ← Volver al dashboard
          </Button>
        </div>
        <div className="rounded-lg bg-white p-6 shadow sm:p-8 dark:bg-gray-800">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Publicar prenda
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormFieldsEs
              name={formData.name}
              price={formData.price}
              size={formData.size}
              color={formData.color}
              category={formData.category}
              gender={formData.gender}
              description={formData.description}
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
            />

            <ImageUploadSectionEs
              files={files}
              previews={previews}
              onDrop={addFiles}
              onRemove={removeFile}
            />

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

            <button
              type="submit"
              disabled={uploading}
              className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 w-full rounded-md px-4 py-3 font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Publicando...' : 'Publicar prenda'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  useColors,
  useCategories,
  useGenders,
} from '@/app/admin/upload-product/hooks/use-supabase-data';
import { useProductForm } from '@/app/admin/upload-product/hooks/use-product-form';
import { useImageUpload } from '@/app/admin/upload-product/hooks/use-image-upload';
import { FormFieldsEs } from '@/app/me/product/add/form-fields-es';
import { ImageUploadSectionEs } from '@/app/me/product/add/image-upload-section-es';
import { Alert, Spinner } from 'flowbite-react';
import Button from '@/app/ui/button';

interface Product {
  id: number;
  name: string;
  public_id: string;
  images: string[];
  price: number | null;
  size: string | null;
  color: string | null;
  category: string | null;
  gender: string[] | null;
  description: string | null;
  owner: number;
}

export default function MeEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const colors = useColors();
  const categories = useCategories();
  const genders = useGenders();

  const { files, previews, addFiles, removeFile, clearAll } = useImageUpload();

  const { formData, updateField, validateAndPrepare } = useProductForm({
    colors: colors.data,
    categories: categories.data,
    genders: genders.data,
  });

  const [product, setProduct] = useState<Product | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`/api/me/products/${id}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404 || !res.ok) {
          setMessage({
            type: 'error',
            text: 'No se encontró la prenda o no tenés permiso para editarla.',
          });
          setLoading(false);
          return;
        }
        const data = await res.json();
        const p = data.product as Product;
        setProduct(p);
        setExistingImages(p.images ?? []);

        updateField('ownerId', String(p.owner));
        updateField('name', p.name ?? '');
        updateField('price', p.price != null ? String(p.price) : '');
        updateField('size', p.size ?? '');
        updateField('color', p.color ?? '');
        updateField('category', p.category ?? '');
        updateField('gender', Array.isArray(p.gender) ? p.gender : []);
        updateField('description', p.description ?? '');
      } catch {
        setMessage({
          type: 'error',
          text: 'Error al cargar la prenda.',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router, updateField]);

  const removeExistingImage = useCallback((index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

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

      const totalImages = existingImages.length + files.length;
      if (totalImages === 0) {
        setMessage({
          type: 'error',
          text: 'Agregá al menos una imagen.',
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
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
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
        files.forEach((file) => {
          formDataToSend.append('images', file);
        });

        const response = await fetch(`/api/me/products/${id}`, {
          method: 'PUT',
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al guardar la prenda');
        }

        setMessage({
          type: 'success',
          text: 'Prenda actualizada correctamente.',
        });

        setTimeout(() => {
          router.push('/me');
        }, 1500);
      } catch (error) {
        console.error('Update error:', error);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Error al guardar',
        });
      } finally {
        setUploading(false);
      }
    },
    [existingImages, files, id, validateAndPrepare, router]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </main>
    );
  }

  if (!product && !id) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4">
          <Alert color="failure">ID de producto inválido.</Alert>
          <Button href="/me" variant="primary" solid className="mt-4">
            Volver al dashboard
          </Button>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4">
          {message && (
            <Alert color="failure" className="mb-4">
              {message.text}
            </Alert>
          )}
          <Button href="/me" variant="primary" solid>
            Volver al dashboard
          </Button>
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
            Editar prenda
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

            <div>
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs text-gray-500">
                    Imágenes actuales (tocá la X para quitar)
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {existingImages.map((url, index) => (
                      <div key={`${url}-${index}`} className="group relative">
                        <img
                          src={url}
                          alt={`Actual ${index + 1}`}
                          className="h-32 w-full rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Quitar imagen"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="mb-2 text-xs text-gray-500">Agregar más imágenes</p>
              <ImageUploadSectionEs
                files={files}
                previews={previews}
                onDrop={addFiles}
                onRemove={removeFile}
              />
            </div>

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
              {uploading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

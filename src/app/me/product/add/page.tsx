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
import {
  HiArrowLeft,
  HiArrowUpTray,
  HiCamera,
  HiCheckCircle,
  HiClock,
  HiHeart,
  HiInformationCircle,
  HiShoppingBag,
  HiTag,
} from 'react-icons/hi2';
import {
  MAX_PRODUCT_IMAGE_COUNT,
  getUploadApiErrorMessage,
  getUploadExceptionMessage,
  getTooManyProductImagesMessage,
  prepareProductImagesForUpload,
  readUploadApiResponse,
} from '@/app/lib/client-upload';

type UploadStep = 'idle' | 'preparing' | 'publishing';

export default function MeAddProductPage() {
  const router = useRouter();
  const colors = useColors();
  const categories = useCategories();
  const genders = useGenders();

  const {
    files,
    previews,
    error: imageUploadError,
    addFiles,
    removeFile,
    moveFile,
    clearAll,
  } = useImageUpload();

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
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const uploading = uploadStep !== 'idle';
  const submitText =
    uploadStep === 'preparing'
      ? 'Preparando fotos...'
      : uploadStep === 'publishing'
        ? 'Publicando...'
        : 'Publicar prenda';

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

  const completionItems = [
    {
      label: 'Fotos',
      detail:
        files.length > 0
          ? `${files.length}/${MAX_PRODUCT_IMAGE_COUNT} foto${files.length !== 1 ? 's' : ''} lista${files.length !== 1 ? 's' : ''}`
          : 'Subí al menos una foto',
      done: files.length > 0,
      icon: <HiCamera className="h-4 w-4" />,
    },
    {
      label: 'Nombre',
      detail: formData.name.trim() ? 'Título claro' : 'Contá qué prenda es',
      done: Boolean(formData.name.trim()),
      icon: <HiTag className="h-4 w-4" />,
    },
    {
      label: 'Detalles',
      detail:
        formData.price || formData.size || formData.category
          ? 'Ya suma información útil'
          : 'Precio, talle o categoría',
      done: Boolean(formData.price || formData.size || formData.category),
      icon: <HiInformationCircle className="h-4 w-4" />,
    },
  ];
  const completedItems = completionItems.filter((item) => item.done).length;
  const completionPercent = Math.round(
    (completedItems / completionItems.length) * 100
  );

  const handleGenderChange = useCallback(
    (value: string) => {
      updateField('gender', value ? [value] : []);
    },
    [updateField]
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

      if (files.length > MAX_PRODUCT_IMAGE_COUNT) {
        setMessage({
          type: 'error',
          text: getTooManyProductImagesMessage(),
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

      setUploadStep('preparing');

      try {
        const uploadFiles = await prepareProductImagesForUpload(files);
        setUploadStep('publishing');
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
        const genderToSend =
          validation.validatedData.gender &&
          validation.validatedData.gender.length > 0
            ? validation.validatedData.gender
            : formData.gender?.length > 0
              ? formData.gender
              : null;
        if (genderToSend && genderToSend.length > 0) {
          formDataToSend.append('gender', JSON.stringify(genderToSend));
        }
        if (validation.validatedData.description)
          formDataToSend.append(
            'description',
            validation.validatedData.description
          );
        formDataToSend.append('featured', 'false');
        uploadFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        const response = await fetch('/api/me/upload-product', {
          method: 'POST',
          body: formDataToSend,
        });

        const data = await readUploadApiResponse(response);

        if (!response.ok) {
          throw new Error(
            getUploadApiErrorMessage(data, 'Error al publicar la prenda')
          );
        }

        setMessage({
          type: 'success',
          text: 'Prenda publicada correctamente.',
        });
        try {
          resetForm();
          clearAll();
        } catch (cleanupError) {
          console.warn('[Me Upload] Preview cleanup failed:', cleanupError);
        }

        setTimeout(() => {
          router.push('/me');
        }, 1500);
      } catch (error) {
        console.error('Upload error:', error);
        setMessage({
          type: 'error',
          text: getUploadExceptionMessage(error),
        });
      } finally {
        setUploadStep('idle');
      }
    },
    [
      files,
      ownerId,
      validateAndPrepare,
      resetForm,
      clearAll,
      router,
      formData.gender,
    ]
  );

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf4] px-4">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Spinner size="xl" />
          <p className="mt-4 text-sm font-medium text-gray-700">
            Preparando tu espacio de publicación...
          </p>
        </div>
      </main>
    );
  }

  if (!ownerId) {
    return (
      <main className="min-h-screen bg-[#f7faf4] py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Alert color="warning">
            <span className="font-medium">Completá tu perfil primero.</span>{' '}
            Agregá tu nombre y WhatsApp en tu perfil para poder publicar
            prendas.
          </Alert>
          <div className="mt-6">
            <Button
              link="/me"
              variant="primary"
              solid
              startIcon={<HiArrowLeft className="h-4 w-4" />}
              text="Ir a Mi Perfil"
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Button
            link="/me"
            variant="secondary"
            startIcon={<HiArrowLeft className="h-4 w-4" />}
            text="Volver al dashboard"
          />
        </div>

        <section className="border-primary-100 mb-6 rounded-lg border bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
              <HiHeart className="h-4 w-4" />
              Dale otra vida a una prenda
            </div>
            <h1 className="text-3xl font-bold text-gray-950 sm:text-4xl dark:text-white">
              Publicá rápido y hacé que tu prenda se vea deseable.
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
              Empezá por las fotos. Después sumá los datos que ayudan a que
              alguien confíe, pregunte y se anime a comprar.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {completionItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      item.done
                        ? 'bg-primary-800 text-white'
                        : 'bg-white text-gray-500 dark:bg-gray-800'
                    }`}
                  >
                    {item.done ? (
                      <HiCheckCircle className="h-4 w-4" />
                    ) : (
                      item.icon
                    )}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {item.done ? 'Listo' : 'Pendiente'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-950 dark:text-white">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUploadSectionEs
              files={files}
              previews={previews}
              currentCount={files.length}
              error={imageUploadError}
              maxFiles={MAX_PRODUCT_IMAGE_COUNT}
              onDrop={addFiles}
              onRemove={removeFile}
              onMove={moveFile}
            />

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
              onGenderChange={handleGenderChange}
              onDescriptionChange={(value) => updateField('description', value)}
            />

            {message && (
              <div
                className={`rounded-lg border p-4 text-sm font-medium ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300'
                }`}
                aria-live="polite"
              >
                {message.text}
              </div>
            )}

            <div className="sticky bottom-4 z-10 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-950 dark:text-white">
                    {completedItems === completionItems.length
                      ? 'Lista para publicar'
                      : 'Te faltan pocos datos'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Podés publicar cuando tengas al menos una foto y el nombre.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  aria-busy={uploading}
                  className="bg-primary-800 hover:bg-primary-900 focus:ring-primary-300 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-sm transition focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <HiArrowUpTray className="h-5 w-5" />
                  {submitText}
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-start gap-3">
                <div className="bg-primary-100 text-primary-900 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <HiShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950 dark:text-white">
                    Tu publicación
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {completionPercent}% completa
                  </p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="bg-primary-800 h-full rounded-full transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-4 space-y-3">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.done
                          ? 'bg-primary-800 text-white'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                      }`}
                    >
                      {item.done ? (
                        <HiCheckCircle className="h-4 w-4" />
                      ) : (
                        item.icon
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-950 dark:text-white">
                <HiClock className="h-5 w-5 text-rose-600" />
                Publicá sin pensarlo demasiado
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                <p>
                  Una publicación simple con buenas fotos funciona mejor que una
                  descripción perfecta que nunca se sube.
                </p>
                <p>
                  Si te falta algo, podés volver a editar la prenda desde tu
                  dashboard.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useCallback, useEffect, type DragEvent } from 'react';
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
import {
  BoostTeaserButton,
  LockedPlusTools,
  MonetizationTeaserProvider,
} from '@/app/me/ui/monetization-teasers';
import { HiArrowLeft, HiArrowRight, HiXMark } from 'react-icons/hi2';
import {
  MAX_PRODUCT_IMAGE_COUNT,
  getUploadApiErrorMessage,
  getUploadExceptionMessage,
  getTooManyProductImagesMessage,
  prepareProductImagesForUpload,
  readUploadApiResponse,
} from '@/app/lib/client-upload';

type UploadStep = 'idle' | 'preparing' | 'publishing';

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  if (item === undefined) return items;
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

interface Product {
  id: number;
  name: string;
  public_id: string;
  images: string[];
  price: number | null;
  size: string | null;
  color: string | null;
  category: string | null;
  gender?: string | string[] | null;
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

  const [product, setProduct] = useState<Product | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const remainingNewImageSlots = Math.max(
    0,
    MAX_PRODUCT_IMAGE_COUNT - existingImages.length
  );
  const {
    files,
    previews,
    error: imageUploadError,
    addFiles,
    removeFile,
    moveFile,
  } = useImageUpload({
    maxFiles: remainingNewImageSlots,
    tooManyFilesMessage: getTooManyProductImagesMessage(),
  });

  const { formData, updateField, validateAndPrepare } = useProductForm({
    colors: colors.data,
    categories: categories.data,
    genders: genders.data,
  });

  const [loading, setLoading] = useState(true);
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
        ? 'Guardando...'
        : 'Guardar cambios';

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
        const genderArr = Array.isArray(p.gender)
          ? p.gender
          : typeof p.gender === 'string' && p.gender.trim()
            ? [p.gender.trim()]
            : [];
        updateField('gender', genderArr);
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

  const moveExistingImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      setExistingImages((prev) => moveItem(prev, fromIndex, toIndex));
    },
    []
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

      const totalImages = existingImages.length + files.length;
      if (totalImages === 0) {
        setMessage({
          type: 'error',
          text: 'Agregá al menos una imagen.',
        });
        return;
      }

      if (totalImages > MAX_PRODUCT_IMAGE_COUNT) {
        setMessage({
          type: 'error',
          text: getTooManyProductImagesMessage(),
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
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
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
        uploadFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        const response = await fetch(`/api/me/products/${id}`, {
          method: 'PUT',
          body: formDataToSend,
        });

        const data = await readUploadApiResponse(response);

        if (!response.ok) {
          throw new Error(
            getUploadApiErrorMessage(data, 'Error al guardar la prenda')
          );
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
          text: getUploadExceptionMessage(error),
        });
      } finally {
        setUploadStep('idle');
      }
    },
    [existingImages, files, id, validateAndPrepare, router, formData.gender]
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
          <Button
            link="/me"
            variant="primary"
            solid
            className="mt-4"
            text="Volver al dashboard"
          />
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
          <Button
            link="/me"
            variant="primary"
            solid
            text="Volver al dashboard"
          />
        </div>
      </main>
    );
  }

  return (
    <MonetizationTeaserProvider>
      {(openTeaser) => (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center gap-4">
              <Button
                link="/me"
                variant="secondary"
                text="← Volver al dashboard"
              />
            </div>
            <div className="rounded-lg bg-white p-6 shadow sm:p-8 dark:bg-gray-800">
              <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
                Editar prenda
              </h1>

              <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950">
                    Más visibilidad para esta prenda
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    Estamos probando boosts de 3 y 7 días para aparecer en
                    espacios destacados.
                  </p>
                </div>
                <BoostTeaserButton
                  productId={product.id}
                  productName={product.name}
                  source="edit_product"
                  onOpen={openTeaser}
                  className="w-full md:w-auto"
                />
              </div>

              <div className="mb-6">
                <LockedPlusTools source="edit_product" onOpen={openTeaser} />
              </div>

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
                  onGenderChange={handleGenderChange}
                  onDescriptionChange={(value) =>
                    updateField('description', value)
                  }
                />

                <div>
                  {existingImages.length > 0 && (
                    <ExistingImagesEditor
                      images={existingImages}
                      onMove={moveExistingImage}
                      onRemove={removeExistingImage}
                    />
                  )}
                  <p className="mb-2 text-xs text-gray-500">
                    Agregar más imágenes
                  </p>
                  <ImageUploadSectionEs
                    files={files}
                    previews={previews}
                    currentCount={existingImages.length + files.length}
                    error={imageUploadError}
                    maxFiles={MAX_PRODUCT_IMAGE_COUNT}
                    onDrop={addFiles}
                    onRemove={removeFile}
                    onMove={moveFile}
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
                  {submitText}
                </button>
              </form>
            </div>
          </div>
        </main>
      )}
    </MonetizationTeaserProvider>
  );
}

function ExistingImagesEditor({
  images,
  onMove,
  onRemove,
}: {
  images: string[];
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
}) {
  function handleDragStart(event: DragEvent<HTMLDivElement>, index: number) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(fromIndex)) {
      onMove(fromIndex, index);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Imágenes actuales
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          La primera imagen será la portada en la vitrina. Arrastrá las fotos o
          usá los botones para cambiar el orden.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            draggable
            onDragStart={(event) => handleDragStart(event, index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, index)}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700"
          >
            <img
              src={url}
              alt={`Actual ${index + 1}`}
              className="h-32 w-full object-cover transition group-hover:scale-105"
            />
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {index === 0 ? (
                <span className="rounded-full bg-rose-600 px-2 py-1 text-[11px] font-bold text-white shadow">
                  Portada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onMove(index, 0)}
                  className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-gray-800 shadow transition hover:bg-rose-50 hover:text-rose-700"
                >
                  Usar como portada
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow transition hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none"
              aria-label={`Quitar imagen ${index + 1}`}
            >
              <HiXMark className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <div className="absolute right-2 bottom-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Mover imagen ${index + 1} a la izquierda`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <HiArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === images.length - 1}
                  aria-label={`Mover imagen ${index + 1} a la derecha`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <HiArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
'use client';

import { useDropzone } from 'react-dropzone';
import {
  HiArrowUpTray,
  HiCheckCircle,
  HiPhoto,
  HiSparkles,
  HiXMark,
} from 'react-icons/hi2';

interface ImageUploadSectionEsProps {
  files: File[];
  previews: string[];
  onDrop: (acceptedFiles: File[]) => void;
  onRemove: (index: number) => void;
}

export function ImageUploadSectionEs({
  files,
  previews,
  onDrop,
  onRemove,
}: ImageUploadSectionEsProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const hasImages = previews.length > 0;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <HiPhoto className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              Subí fotos que den ganas de preguntar
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
              Mostrá la prenda completa, un detalle de la tela y cualquier marca
              o particularidad.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          <HiCheckCircle className="text-primary-800 h-4 w-4" />
          {files.length} foto{files.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`group cursor-pointer rounded-lg border-2 border-dashed p-4 transition sm:p-5 ${
          isDragActive
            ? 'border-primary-800 bg-primary-100 dark:bg-primary-900/20'
            : 'hover:border-primary-700 hover:bg-primary-100/40 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900'
        }`}
      >
        <input {...getInputProps()} />
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)] md:items-center">
          <div className="min-h-56 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
            {hasImages ? (
              <img
                src={previews[0]}
                alt="Foto principal de la prenda"
                className="h-64 w-full object-cover md:h-72"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center md:h-72">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition group-hover:scale-105">
                  <HiArrowUpTray className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    Arrastrá tus fotos acá
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    O tocá para elegir desde tu dispositivo
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            {isDragActive ? (
              <p className="text-primary-900 dark:text-primary-300 text-sm font-semibold">
                Soltá las imágenes acá...
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
                  <HiSparkles className="h-4 w-4 text-rose-500" />
                  La primera foto será la portada
                </p>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Una buena portada mejora mucho la chance de que alguien abra
                  la publicación.
                </p>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Cualquier formato de imagen
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((preview, index) => (
            <div
              key={preview}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700"
            >
              <img
                src={preview}
                alt={`Vista previa ${index + 1}`}
                className="h-32 w-full object-cover transition group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Eliminar foto ${index + 1}`}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow transition hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none"
              >
                <HiXMark className="h-5 w-5" />
              </button>
              <div className="absolute right-0 bottom-0 left-0 bg-black/60 px-2 py-1 text-xs text-white">
                <span className="line-clamp-1">{files[index]?.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

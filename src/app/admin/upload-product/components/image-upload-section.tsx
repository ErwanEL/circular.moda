/* eslint-disable @next/next/no-img-element */
'use client';

import { useDropzone } from 'react-dropzone';
import { MAX_PRODUCT_IMAGE_COUNT } from '@/app/lib/client-upload';

interface ImageUploadSectionProps {
  files: File[];
  previews: string[];
  currentCount?: number;
  error?: string | null;
  maxFiles?: number;
  onDrop: (acceptedFiles: File[]) => void;
  onRemove: (index: number) => void;
}

export function ImageUploadSection({
  files,
  previews,
  currentCount,
  error,
  maxFiles = MAX_PRODUCT_IMAGE_COUNT,
  onDrop,
  onRemove,
}: ImageUploadSectionProps) {
  const displayedCount = currentCount ?? files.length;
  const isLimitReached = displayedCount >= maxFiles;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled: isLimitReached,
    onDrop,
    multiple: true,
  });

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Images * ({displayedCount}/{maxFiles})
      </label>
      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isLimitReached
            ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-80 dark:border-gray-600 dark:bg-gray-900'
            : isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'cursor-pointer border-gray-300 hover:border-gray-400 dark:border-gray-600'
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
          {isLimitReached ? (
            <p className="text-gray-600 dark:text-gray-400">
              Limite de {maxFiles} images atteinte.
            </p>
          ) : isDragActive ? (
            <p className="text-primary-600 dark:text-primary-400">
              Déposez les images ici...
            </p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                Glissez-déposez des images ici, ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Maximum {maxFiles} images par produit. Les images sont
                optimisées automatiquement avant l&apos;upload.
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

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
                onClick={() => onRemove(index)}
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
  );
}

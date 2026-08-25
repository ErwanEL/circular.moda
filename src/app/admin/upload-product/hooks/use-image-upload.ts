import { useState, useCallback } from 'react';
import {
  MAX_PRODUCT_IMAGE_COUNT,
  getTooManyProductImagesMessage,
} from '@/app/lib/client-upload';

interface UseImageUploadResult {
  files: File[];
  previews: string[];
  error: string | null;
  addFiles: (acceptedFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearAll: () => void;
}

interface UseImageUploadOptions {
  maxFiles?: number;
  tooManyFilesMessage?: string;
}

function revokePreviewUrl(url: string | undefined) {
  if (!url || !url.startsWith('blob:')) {
    return;
  }

  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('[ImageUpload] Could not revoke preview URL:', error);
  }
}

function createPreviewUrl(file: File): string | null {
  try {
    return URL.createObjectURL(file);
  } catch (error) {
    console.warn('[ImageUpload] Could not create preview URL:', error);
    return null;
  }
}

export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadResult {
  const maxFiles = options.maxFiles ?? MAX_PRODUCT_IMAGE_COUNT;
  const tooManyFilesMessage =
    options.tooManyFilesMessage ?? getTooManyProductImagesMessage(maxFiles);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      if (maxFiles <= 0 || files.length + acceptedFiles.length > maxFiles) {
        setError(tooManyFilesMessage);
        return;
      }

      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      setError(null);

      // Créer des previews
      const newPreviews = acceptedFiles
        .map(createPreviewUrl)
        .filter((preview): preview is string => preview !== null);
      setPreviews([...previews, ...newPreviews]);
    },
    [files, maxFiles, previews, tooManyFilesMessage]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      const newPreviews = previews.filter((_, i) => i !== index);
      setFiles(newFiles);
      setPreviews(newPreviews);
      setError(null);
      revokePreviewUrl(previews[index]);
    },
    [files, previews]
  );

  const clearAll = useCallback(() => {
    previews.forEach(revokePreviewUrl);
    setFiles([]);
    setPreviews([]);
    setError(null);
  }, [previews]);

  return {
    files,
    previews,
    error,
    addFiles,
    removeFile,
    clearAll,
  };
}

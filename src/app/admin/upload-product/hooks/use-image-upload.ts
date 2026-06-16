import { useState, useCallback } from 'react';

interface UseImageUploadResult {
  files: File[];
  previews: string[];
  addFiles: (acceptedFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearAll: () => void;
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

export function useImageUpload(): UseImageUploadResult {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const addFiles = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);

      // Créer des previews
      const newPreviews = acceptedFiles
        .map(createPreviewUrl)
        .filter((preview): preview is string => preview !== null);
      setPreviews([...previews, ...newPreviews]);
    },
    [files, previews]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      const newPreviews = previews.filter((_, i) => i !== index);
      setFiles(newFiles);
      setPreviews(newPreviews);
      revokePreviewUrl(previews[index]);
    },
    [files, previews]
  );

  const clearAll = useCallback(() => {
    previews.forEach(revokePreviewUrl);
    setFiles([]);
    setPreviews([]);
  }, [previews]);

  return {
    files,
    previews,
    addFiles,
    removeFile,
    clearAll,
  };
}

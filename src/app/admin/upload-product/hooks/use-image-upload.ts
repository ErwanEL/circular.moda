import { useState, useCallback } from 'react';

interface UseImageUploadResult {
  files: File[];
  previews: string[];
  addFiles: (acceptedFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearAll: () => void;
}

export function useImageUpload(): UseImageUploadResult {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const addFiles = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);

    // Créer des previews
    const newPreviews = acceptedFiles.map((file) => {
      return URL.createObjectURL(file);
    });
    setPreviews([...previews, ...newPreviews]);
  }, [files, previews]);

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      const newPreviews = previews.filter((_, i) => i !== index);
      setFiles(newFiles);
      setPreviews(newPreviews);
      // Revoke object URL to free memory
      URL.revokeObjectURL(previews[index]);
    },
    [files, previews]
  );

  const clearAll = useCallback(() => {
    // Revoke all object URLs before clearing previews
    previews.forEach((url) => URL.revokeObjectURL(url));
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


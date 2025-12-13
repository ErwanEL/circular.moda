'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import UserSelector from '@/app/ui/user-selector';

export default function UploadProductPage() {
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);

    // Créer des previews
    const newPreviews = acceptedFiles.map((file) => {
      return URL.createObjectURL(file);
    });
    setPreviews([...previews, ...newPreviews]);
  }, [files, previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    // Revoke object URL to free memory
    URL.revokeObjectURL(previews[index]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un nom de produit' });
      return;
    }

    if (!ownerId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner ou créer un utilisateur' });
      return;
    }

    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez ajouter au moins une image' });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('ownerId', ownerId);
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/upload-product', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      setMessage({ type: 'success', text: 'Produit uploadé avec succès !' });
      // Reset form
      setName('');
      setOwnerId('');
      setFiles([]);
      // Revoke all object URLs before clearing previews
      previews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl">
        <div className="bg-white shadow rounded-lg p-6 sm:p-8 dark:bg-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 dark:text-white">
            Uploader un Produit
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom du produit */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nom du produit *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Vestido Lino Verde"
                required
              />
            </div>

            {/* Sélection/Création d'utilisateur */}
            <div>
              <UserSelector
                value={ownerId}
                onChange={setOwnerId}
                required
              />
            </div>

            {/* Zone de drag & drop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images *
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
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
                  {isDragActive ? (
                    <p className="text-primary-600 dark:text-primary-400">
                      Déposez les images ici...
                    </p>
                  ) : (
                    <>
                      <p className="text-gray-600 dark:text-gray-400">
                        Glissez-déposez des images ici, ou cliquez pour sélectionner
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PNG, JPG, WEBP jusqu'à 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Preview des images */}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-4 h-4"
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
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md">
                        {files[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-md ${
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
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Upload en cours...' : 'Uploader le produit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


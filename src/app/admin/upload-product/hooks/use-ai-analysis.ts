import { useState } from 'react';
import {
  getUploadApiErrorMessage,
  prepareProductImagesForUpload,
  readUploadApiResponse,
} from '@/app/lib/client-upload';
import { mapAiValuesToValid } from '../utils/matching';

type AiAnalysisData = {
  name?: string;
  price?: string;
  size?: string;
  color?: string;
  category?: string;
  gender?: string[];
  description?: string;
  featured?: boolean;
  [key: string]: unknown;
};

interface UseAiAnalysisResult {
  analyzing: boolean;
  analyze: (
    description: string,
    files: File[],
    options: { colors: string[]; categories: string[]; genders: string[] }
  ) => Promise<{
    success: boolean;
    data?: AiAnalysisData;
    warnings?: string[];
    error?: string;
  }>;
}

export function useAiAnalysis(): UseAiAnalysisResult {
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async (
    description: string,
    files: File[],
    options: { colors: string[]; categories: string[]; genders: string[] }
  ) => {
    if (!description.trim()) {
      return {
        success: false,
        error: "Veuillez entrer une description pour l'analyse AI",
      };
    }

    if (files.length === 0) {
      return {
        success: false,
        error: "Veuillez ajouter au moins une image pour l'analyse AI",
      };
    }

    setAnalyzing(true);

    try {
      const uploadFiles = await prepareProductImagesForUpload(files);
      const formData = new FormData();
      formData.append('textDescription', description.trim());
      uploadFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/ai-analyze-product', {
        method: 'POST',
        body: formData,
      });

      const result = await readUploadApiResponse<{
        data?: AiAnalysisData;
        error?: unknown;
      }>(response);

      if (!response.ok) {
        return {
          success: false,
          error: getUploadApiErrorMessage(
            result,
            "Erreur lors de l'analyse AI"
          ),
        };
      }

      if (result.data) {
        // Mapper les valeurs de l'IA aux valeurs valides dans Supabase
        const mappedData = mapAiValuesToValid(
          result.data,
          options
        ) as AiAnalysisData;

        const warnings: string[] = [];
        if (result.data.color && !mappedData.color) {
          warnings.push(`Couleur "${result.data.color}" non trouvée`);
        }
        if (result.data.category && !mappedData.category) {
          warnings.push(`Catégorie "${result.data.category}" non trouvée`);
        }

        return {
          success: true,
          data: mappedData,
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }

      return {
        success: false,
        error: 'Aucune donnée retournée par l\'IA',
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse AI",
      };
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyzing, analyze };
}



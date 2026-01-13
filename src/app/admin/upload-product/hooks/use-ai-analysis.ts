import { useState } from 'react';
import { mapAiValuesToValid } from '../utils/matching';

interface UseAiAnalysisResult {
  analyzing: boolean;
  analyze: (
    description: string,
    files: File[],
    options: { colors: string[]; categories: string[]; genders: string[] }
  ) => Promise<{
    success: boolean;
    data?: any;
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
      const formData = new FormData();
      formData.append('textDescription', description.trim());
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/ai-analyze-product', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Erreur lors de l'analyse AI",
        };
      }

      if (result.data) {
        // Mapper les valeurs de l'IA aux valeurs valides dans Supabase
        const mappedData = mapAiValuesToValid(result.data, options);

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



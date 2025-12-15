import { useState, useCallback } from 'react';
import { findClosestMatch } from '../utils/matching';

interface ProductFormData {
  name: string;
  ownerId: string;
  price: string;
  size: string;
  color: string;
  category: string;
  gender: string[];
  description: string;
  featured: boolean;
}

interface UseProductFormOptions {
  colors: string[];
  categories: string[];
  genders: string[];
}

interface UseProductFormResult {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
  validateAndPrepare: () => {
    isValid: boolean;
    validatedData: Partial<ProductFormData>;
    error?: string;
  };
  reset: () => void;
}

const initialFormData: ProductFormData = {
  name: '',
  ownerId: '',
  price: '',
  size: '',
  color: '',
  category: '',
  gender: [],
  description: '',
  featured: false,
};

export function useProductForm(
  options: UseProductFormOptions
): UseProductFormResult {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const updateField = useCallback(
    <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const validateAndPrepare = useCallback(() => {
    if (!formData.name.trim()) {
      return {
        isValid: false,
        validatedData: {},
        error: 'Veuillez entrer un nom de produit',
      };
    }

    if (!formData.ownerId) {
      return {
        isValid: false,
        validatedData: {},
        error: 'Veuillez sélectionner ou créer un utilisateur',
      };
    }

    const validatedData: Partial<ProductFormData> = {
      name: formData.name.trim(),
      ownerId: formData.ownerId,
    };

    // Valider et mapper la couleur
    if (formData.color && options.colors.length > 0) {
      const matchedColor = findClosestMatch(formData.color, options.colors);
      if (matchedColor) {
        validatedData.color = matchedColor;
      } else {
        return {
          isValid: false,
          validatedData: {},
          error: `La couleur "${formData.color}" n'est pas valide. Veuillez en sélectionner une dans la liste.`,
        };
      }
    }

    // Valider et mapper la catégorie
    if (formData.category && options.categories.length > 0) {
      const matchedCategory = findClosestMatch(
        formData.category,
        options.categories
      );
      if (matchedCategory) {
        validatedData.category = matchedCategory;
      } else {
        return {
          isValid: false,
          validatedData: {},
          error: `La catégorie "${formData.category}" n'est pas valide. Veuillez en sélectionner une dans la liste.`,
        };
      }
    }

    // Valider et mapper les genres
    if (formData.gender.length > 0 && options.genders.length > 0) {
      const matchedGenders = formData.gender
        .map((g) => findClosestMatch(g, options.genders))
        .filter((g): g is string => g !== null);
      if (matchedGenders.length === 0 && formData.gender.length > 0) {
        return {
          isValid: false,
          validatedData: {},
          error: `Les genres sélectionnés ne sont pas valides. Veuillez en sélectionner dans la liste.`,
        };
      }
      validatedData.gender = matchedGenders;
    }

    // Ajouter les champs optionnels
    if (formData.price) validatedData.price = formData.price;
    if (formData.size) validatedData.size = formData.size;
    if (formData.description) validatedData.description = formData.description;
    validatedData.featured = formData.featured;

    return {
      isValid: true,
      validatedData,
    };
  }, [formData, options]);

  const reset = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    validateAndPrepare,
    reset,
  };
}


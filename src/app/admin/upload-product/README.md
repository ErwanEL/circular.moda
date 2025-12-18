# Product Upload Form - Architecture

Ce dossier contient le formulaire d'upload de produits refactorisé pour améliorer la maintenabilité.

## Structure

```
upload-product/
├── page.tsx                    # Composant principal (orchestrateur)
├── components/                 # Composants UI réutilisables
│   ├── ai-mode-section.tsx    # Section mode AI avec toggle
│   ├── form-fields.tsx         # Tous les champs du formulaire
│   └── image-upload-section.tsx # Zone de drag & drop pour images
├── hooks/                      # Hooks personnalisés
│   ├── use-supabase-data.ts    # Hook pour charger colors/categories/genders
│   ├── use-product-form.ts     # Hook pour gérer l'état du formulaire
│   ├── use-image-upload.ts     # Hook pour gérer l'upload d'images
│   └── use-ai-analysis.ts      # Hook pour l'analyse AI
└── utils/                      # Fonctions utilitaires
    └── matching.ts             # Fonctions de matching (Levenshtein, etc.)
```

## Composants

### `page.tsx`
Composant principal qui orchestre tous les hooks et composants. Responsabilités :
- Gestion de l'état global (ownerId, uploading, message)
- Coordination entre les différents hooks
- Gestion de la soumission du formulaire

### `components/ai-mode-section.tsx`
Section dédiée au mode AI :
- Toggle pour activer/désactiver le mode AI
- Champ de description pour l'analyse AI
- Bouton d'analyse

### `components/form-fields.tsx`
Tous les champs du formulaire :
- Nom, Prix, Taille
- Couleur, Catégorie, Genre (avec sélecteurs dynamiques)
- Description, Featured

### `components/image-upload-section.tsx`
Zone de drag & drop pour les images :
- Gestion du dropzone
- Preview des images
- Suppression d'images

## Hooks

### `use-supabase-data.ts`
Hook générique pour charger des données depuis Supabase :
- `useColors()` - Charge et trie les couleurs
- `useCategories()` - Charge les catégories
- `useGenders()` - Charge les genres

### `use-product-form.ts`
Gère l'état et la validation du formulaire :
- `formData` - État du formulaire
- `updateField()` - Mise à jour d'un champ
- `validateAndPrepare()` - Validation et préparation des données
- `reset()` - Réinitialisation du formulaire

### `use-image-upload.ts`
Gère l'upload d'images :
- `files` - Liste des fichiers
- `previews` - URLs de prévisualisation
- `addFiles()` - Ajouter des fichiers
- `removeFile()` - Supprimer un fichier
- `clearAll()` - Tout effacer

### `use-ai-analysis.ts`
Gère l'analyse AI :
- `analyzing` - État de chargement
- `analyze()` - Lancer l'analyse avec description et images

## Utilitaires

### `utils/matching.ts`
Fonctions de matching pour mapper les valeurs AI aux valeurs valides :
- `levenshteinDistance()` - Calcul de distance de Levenshtein
- `findClosestMatch()` - Trouve la valeur la plus proche dans une liste
- `mapAiValuesToValid()` - Mappe les valeurs AI aux valeurs valides Supabase

## Avantages de cette architecture

1. **Séparation des responsabilités** : Chaque hook/composant a une responsabilité claire
2. **Réutilisabilité** : Les hooks peuvent être réutilisés dans d'autres composants
3. **Testabilité** : Chaque partie peut être testée indépendamment
4. **Maintenabilité** : Code plus facile à comprendre et modifier
5. **Performance** : Hooks optimisés avec `useCallback` et `useMemo` si nécessaire

## Utilisation

Le composant principal `page.tsx` utilise tous ces hooks et composants de manière déclarative :

```tsx
const colors = useColors();
const { formData, updateField, validateAndPrepare } = useProductForm({...});
const { files, addFiles, removeFile } = useImageUpload();
const { analyzing, analyze } = useAiAnalysis();
```

Cela rend le code principal beaucoup plus lisible et maintenable.



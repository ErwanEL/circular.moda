/**
 * Distance de Levenshtein simplifiée pour la similarité
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Trouve la valeur la plus proche dans une liste d'options
 * Gère les correspondances exactes, partielles, et par similarité
 */
export function findClosestMatch(
  value: string,
  options: string[]
): string | null {
  if (!value || !options || options.length === 0) return null;

  const normalizedValue = value.toLowerCase().trim();

  // 1. Correspondance exacte (insensible à la casse)
  const exactMatch = options.find(
    (opt) => opt.toLowerCase().trim() === normalizedValue
  );
  if (exactMatch) return exactMatch;

  // 2. Extraction du mot principal (avant les parenthèses)
  const mainWord = normalizedValue.split('(')[0].trim();

  // 3. Correspondance par mot principal (insensible aux parenthèses)
  const mainWordMatch = options.find((opt) => {
    const normalizedOpt = opt.toLowerCase().trim();
    const optMainWord = normalizedOpt.split('(')[0].trim();
    return optMainWord === mainWord || mainWord === optMainWord;
  });
  if (mainWordMatch) return mainWordMatch;

  // 4. Correspondance partielle (contient le mot principal)
  const partialMatch = options.find((opt) => {
    const normalizedOpt = opt.toLowerCase().trim();
    const optMainWord = normalizedOpt.split('(')[0].trim();
    return (
      normalizedOpt.includes(mainWord) ||
      mainWord.includes(optMainWord) ||
      optMainWord.includes(mainWord) ||
      normalizedOpt.includes(normalizedValue) ||
      normalizedValue.includes(normalizedOpt)
    );
  });
  if (partialMatch) return partialMatch;

  // 5. Correspondance par similarité (Levenshtein simplifié) sur le mot principal
  let bestMatch: string | null = null;
  let bestScore = Infinity;

  for (const opt of options) {
    const normalizedOpt = opt.toLowerCase().trim();
    const optMainWord = normalizedOpt.split('(')[0].trim();

    // Comparer le mot principal
    const score = levenshteinDistance(mainWord, optMainWord);
    if (score < bestScore && score <= Math.max(3, mainWord.length / 2)) {
      bestScore = score;
      bestMatch = opt;
    }
  }

  return bestMatch;
}

/**
 * Mappe les valeurs de l'IA aux valeurs valides dans Supabase
 */
export function mapAiValuesToValid(
  data: any,
  options: {
    colors: string[];
    categories: string[];
    genders: string[];
  }
): any {
  const mapped: any = { ...data };

  // Mapper la couleur
  if (data.color && options.colors.length > 0) {
    const matchedColor = findClosestMatch(data.color, options.colors);
    if (matchedColor) {
      mapped.color = matchedColor;
    } else {
      mapped.color = '';
    }
  }

  // Mapper la catégorie
  if (data.category && options.categories.length > 0) {
    const matchedCategory = findClosestMatch(
      data.category,
      options.categories
    );
    if (matchedCategory) {
      mapped.category = matchedCategory;
    } else {
      mapped.category = '';
    }
  }

  // Mapper les genres
  if (data.gender && Array.isArray(data.gender) && options.genders.length > 0) {
    const matchedGenders = data.gender
      .map((g: string) => findClosestMatch(g, options.genders))
      .filter((g: string | null): g is string => g !== null);
    mapped.gender = matchedGenders;
  }

  return mapped;
}


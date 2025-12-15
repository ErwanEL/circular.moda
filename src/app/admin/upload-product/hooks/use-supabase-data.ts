import { useState, useEffect } from 'react';

interface UseSupabaseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useSupabaseData<T>(
  endpoint: string,
  dataKey: string
): UseSupabaseDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Erreur lors du chargement des ${dataKey}`);
      const result = await res.json();
      if (Array.isArray(result[dataKey])) {
        setData(result[dataKey]);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(`Impossible de charger les ${dataKey}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint, dataKey]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useColors() {
  const result = useSupabaseData<string>('/api/colors', 'colors');
  // Sort colors alphabetically
  const sortedColors = [...result.data].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
  return { ...result, data: sortedColors };
}

export function useCategories() {
  return useSupabaseData<string>('/api/categories', 'categories');
}

export function useGenders() {
  return useSupabaseData<string>('/api/genders', 'genders');
}


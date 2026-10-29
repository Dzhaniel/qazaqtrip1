import { useEffect, useState } from 'react';

/**
 * Локальді деректер жүктеле жатқанда skeleton-дер үшін қысқа «жүктеу» күйі.
 */
export function useFakeLoad(ms = 450): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return loading;
}

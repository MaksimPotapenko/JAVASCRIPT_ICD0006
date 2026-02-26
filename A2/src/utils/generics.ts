export function sortBy<T, K>(items: readonly T[], keyFn: (item: T) => K, order: 'asc' | 'desc' = 'asc'): T[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const ka = keyFn(a) as any;
    const kb = keyFn(b) as any;
    if (ka < kb) return order === 'asc' ? -1 : 1;
    if (ka > kb) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return copy;
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
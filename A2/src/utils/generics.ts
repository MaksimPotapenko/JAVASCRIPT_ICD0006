/** Generic utilities (required: at least 3) */

export function groupBy<T, K extends PropertyKey>(items: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sortBy<T, K>(items: readonly T[], keyFn: (item: T) => K, order: 'asc' | 'desc' = 'asc'): T[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const ka = keyFn(a) as any;
    const kb = keyFn(b) as any;

    // Handle null/undefined consistently
    const aNil = ka === undefined || ka === null;
    const bNil = kb === undefined || kb === null;
    if (aNil && bNil) return 0;
    if (aNil) return order === 'asc' ? 1 : -1;
    if (bNil) return order === 'asc' ? -1 : 1;

    if (ka < kb) return order === 'asc' ? -1 : 1;
    if (ka > kb) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return copy;
}

export function uniqueBy<T, K extends PropertyKey>(items: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

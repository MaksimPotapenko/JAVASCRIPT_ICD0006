export function sortBy(items, keyFn, order = 'asc') {
    const copy = [...items];
    copy.sort((a, b) => {
        const ka = keyFn(a);
        const kb = keyFn(b);
        if (ka < kb)
            return order === 'asc' ? -1 : 1;
        if (ka > kb)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
    return copy;
}
export function safeJsonParse(raw, fallback) {
    if (raw == null)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}

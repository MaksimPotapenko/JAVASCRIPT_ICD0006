/** Generic utilities (required: at least 3) */
export function groupBy(items, keyFn) {
    return items.reduce((acc, item) => {
        const key = keyFn(item);
        (acc[key] ?? (acc[key] = [])).push(item);
        return acc;
    }, {});
}
export function sortBy(items, keyFn, order = 'asc') {
    const copy = [...items];
    copy.sort((a, b) => {
        const ka = keyFn(a);
        const kb = keyFn(b);
        // Handle null/undefined consistently
        const aNil = ka === undefined || ka === null;
        const bNil = kb === undefined || kb === null;
        if (aNil && bNil)
            return 0;
        if (aNil)
            return order === 'asc' ? 1 : -1;
        if (bNil)
            return order === 'asc' ? -1 : 1;
        if (ka < kb)
            return order === 'asc' ? -1 : 1;
        if (ka > kb)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
    return copy;
}
export function uniqueBy(items, keyFn) {
    const seen = new Set();
    const out = [];
    for (const item of items) {
        const key = keyFn(item);
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(item);
    }
    return out;
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

export function todayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
export function isIsoDate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
export function compareIsoDates(a, b) {
    // Works for YYYY-MM-DD
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
export function addRecurrence(baseIso, rule) {
    const base = isIsoDate(baseIso) ? new Date(`${baseIso}T00:00:00`) : new Date();
    const next = new Date(base);
    const interval = Math.max(1, Math.floor(rule.interval));
    switch (rule.frequency) {
        case 'daily':
            next.setDate(next.getDate() + interval);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7 * interval);
            break;
        case 'monthly': {
            const month = next.getMonth();
            next.setMonth(month + interval);
            break;
        }
        default: {
            const exhaustive = rule.frequency;
            return exhaustive;
        }
    }
    const yyyy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, '0');
    const dd = String(next.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

import { safeJsonParse } from './utils/generics.js';
const TASKS_KEY = 'tasks_v2';
const CATEGORIES_KEY = 'categories_v2';
function assertStorageAvailable() {
    // Basic guard for private browsing / disabled storage
    const testKey = '__tm_test__';
    try {
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
    }
    catch {
        throw new Error('localStorage is not available in this browser context');
    }
}
export async function loadTasks() {
    assertStorageAvailable();
    const raw = localStorage.getItem(TASKS_KEY);
    return safeJsonParse(raw, []);
}
export async function saveTasks(tasks) {
    assertStorageAvailable();
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
export async function loadCategories() {
    assertStorageAvailable();
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return safeJsonParse(raw, []);
}
export async function saveCategories(categories) {
    assertStorageAvailable();
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

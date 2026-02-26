import { safeJsonParse } from './utils/generics.js';
const KEY = 'tasks';
export async function loadTasks() {
    return safeJsonParse(localStorage.getItem(KEY), []);
}
export async function saveTasks(tasks) {
    localStorage.setItem(KEY, JSON.stringify(tasks));
}

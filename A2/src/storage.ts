import type { Task } from './models.js';
import { safeJsonParse } from './utils/generics.js';

const KEY = 'tasks';

export async function loadTasks(): Promise<Task[]> {
  return safeJsonParse<Task[]>(localStorage.getItem(KEY), []);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}
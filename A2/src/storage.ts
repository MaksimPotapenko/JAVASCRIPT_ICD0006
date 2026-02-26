import type { Task } from './models.js';

const KEY = 'tasks';

export async function loadTasks(): Promise<Task[]> {
  return JSON.parse(localStorage.getItem(KEY) || '[]') as Task[];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}
import { loadTasks, saveTasks } from "./storage.js";
import type { Task } from './models.js';
import type { Priority, TaskStatus } from './models.js';

function makeId(): string {
  return Date.now().toString();
}

export interface AddTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  tags?: string[];
}

export async function addTask(data: AddTaskInput): Promise<Task> {
  if (!data.title || data.title.length < 2) {
    throw new Error('Title too short');
  }

  const tasks = await loadTasks();

  const task: Task = {
    id: makeId(),
    title: data.title,
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || '',
    tags: data.tags || []
  };

  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function listTasks(): Promise<Task[]> {
  return await loadTasks();
}

export async function deleteTask(id) {
  if (!id) {
    throw new Error("ID is required");
  }

  const tasks = await loadTasks();

  const next = tasks.filter(t => t.id !== id);

  if (next.length === tasks.length) {
    throw new Error("Task not found");
  }

  await saveTasks(next);
}

export async function updateTask(id, newTitle) {
  if (!id) {
    throw new Error("ID is required");
  }

  if (!newTitle || newTitle.length < 2) {
    throw new Error("Title too short");
  }

  const tasks = await loadTasks();
  const task = tasks.find(t => t.id === id);

  if (!task) {
    throw new Error("Task not found");
  }

  task.title = newTitle;
  await saveTasks(tasks);

  return task;
}

export async function searchTasks(query) {
  if (!query || query.trim().length === 0) {
    throw new Error("Search query empty");
  }

  const tasks = await loadTasks();
  const q = query.toLowerCase();

  return tasks.filter(task =>
    task.title.toLowerCase().includes(q)
  );
}

export async function filterTasks(filters) {
  const tasks = await loadTasks();

  return tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.tag && !task.tags?.includes(filters.tag)) return false;

    return true;
  });
}



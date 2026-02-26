import { loadTasks, saveTasks } from "./storage.js";
import type { Task, Priority, TaskStatus, SortField, SortOrder } from './models.js';
import { sortBy } from './utils/generics.js';

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

export async function listTasks(sort?: { field: SortField; order: SortOrder }): Promise<Task[]> {
  const tasks = await loadTasks();
  if (!sort) return tasks;

  return sortBy(tasks, t => {
    switch (sort.field) {
      case 'dueDate': return t.dueDate || '9999-12-31';
      case 'priority': return t.priority === 'high' ? 0 : t.priority === 'medium' ? 1 : 2;
      case 'status': return t.status === 'todo' ? 0 : t.status === 'in-progress' ? 1 : 2;
      case 'title': return t.title.toLowerCase();
    }
  }, sort.order);
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

export interface UpdateTaskPatch {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  tags?: string[];
}

export async function updateTask(id: string, patch: UpdateTaskPatch): Promise<Task> {
  if (!id) throw new Error('ID is required');

  const tasks = await loadTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) throw new Error('Task not found');

  if (patch.title !== undefined) {
    if (patch.title.length < 2) throw new Error('Title too short');
    task.title = patch.title;
  }
  if (patch.description !== undefined) task.description = patch.description;
  if (patch.status !== undefined) task.status = patch.status;
  if (patch.priority !== undefined) task.priority = patch.priority;
  if (patch.dueDate !== undefined) task.dueDate = patch.dueDate;
  if (patch.tags !== undefined) task.tags = patch.tags;

  await saveTasks(tasks);
  return task;
}

// export async function searchTasks(query) {
//   if (!query || query.trim().length === 0) {
//     throw new Error("Search query empty");
//   }

//   const tasks = await loadTasks();
//   const q = query.toLowerCase();

//   return tasks.filter(task =>
//     task.title.toLowerCase().includes(q)
//   );
// }

// export async function filterTasks(filters) {
//   const tasks = await loadTasks();

//   return tasks.filter(task => {
//     if (filters.status && task.status !== filters.status) return false;
//     if (filters.priority && task.priority !== filters.priority) return false;
//     if (filters.tag && !task.tags?.includes(filters.tag)) return false;

//     return true;
//   });
}



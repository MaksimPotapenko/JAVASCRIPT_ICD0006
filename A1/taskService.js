import { loadTasks, saveTasks } from "./storage.js";

function makeId() {
  return Date.now().toString();
}

export async function addTask(title) {
  const tasks = await loadTasks();
  const task = { id: makeId(), title, status: "todo" };
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function listTasks() {
  return await loadTasks();
}

export async function deleteTask(id) {
  const tasks = await loadTasks();

  const next = tasks.filter(t => t.id !== id);

  if (next.length === tasks.length) {
    throw new Error("Task not found");
  }

  await saveTasks(next);
}

export async function updateTask(id, newTitle) {
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
  if (!query) return [];

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



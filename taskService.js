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

import { loadTasks, saveTasks } from "./storage.js";

const VALID_STATUSES = ["todo", "in-progress", "done"];
const VALID_PRIORITIES = ["low", "medium", "high"];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function assertNonEmptyString(value, field, minLength = 1) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    throw new Error(`${field} must be at least ${minLength} characters`);
  }
}

function assertStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }
}

function assertPriority(priority) {
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }
}

function assertDateOrEmpty(value, field) {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }

  if (value !== "" && !ISO_DATE_RE.test(value)) {
    throw new Error(`${field} must be YYYY-MM-DD or empty`);
  }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set();

  return tags
    .filter(tag => typeof tag === "string")
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(tag => {
      const key = tag.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function normalizeTaskInput(data, baseTask) {
  const title = data.title !== undefined ? data.title : baseTask?.title;
  const description = data.description !== undefined ? data.description : baseTask?.description ?? "";
  const status = data.status !== undefined ? data.status : baseTask?.status ?? "todo";
  const priority = data.priority !== undefined ? data.priority : baseTask?.priority ?? "medium";
  const dueDate = data.dueDate !== undefined ? data.dueDate : baseTask?.dueDate ?? "";
  const tags = data.tags !== undefined ? data.tags : baseTask?.tags ?? [];

  assertNonEmptyString(title, "Title", 2);
  assertStatus(status);
  assertPriority(priority);
  assertDateOrEmpty(dueDate, "dueDate");

  return {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    status,
    priority,
    dueDate,
    tags: normalizeTags(tags)
  };
}

function normalizeStoredTask(task) {
  return {
    id: typeof task?.id === "string" ? task.id : makeId(),
    title: typeof task?.title === "string" ? task.title : "",
    description: typeof task?.description === "string" ? task.description : "",
    status: VALID_STATUSES.includes(task?.status) ? task.status : "todo",
    priority: VALID_PRIORITIES.includes(task?.priority) ? task.priority : "medium",
    dueDate: typeof task?.dueDate === "string" && ISO_DATE_RE.test(task.dueDate) ? task.dueDate : "",
    tags: normalizeTags(task?.tags)
  };
}

export async function addTask(data) {
  const tasks = await loadTasks();
  const normalized = normalizeTaskInput(data);

  const task = {
    id: makeId(),
    ...normalized
  };

  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function listTasks() {
  const tasks = await loadTasks();
  return tasks.map(normalizeStoredTask);
}

export async function deleteTask(id) {
  assertNonEmptyString(id, "ID");

  const tasks = await loadTasks();
  const next = tasks
    .map(normalizeStoredTask)
    .filter(task => task.id !== id);

  if (next.length === tasks.length) {
    throw new Error("Task not found");
  }

  await saveTasks(next);
}

export async function updateTask(id, updates) {
  assertNonEmptyString(id, "ID");

  if (!updates || typeof updates !== "object") {
    throw new Error("Updates are required");
  }

  const tasks = await loadTasks();
  const normalizedTasks = tasks.map(normalizeStoredTask);
  const task = normalizedTasks.find(item => item.id === id);

  if (!task) {
    throw new Error("Task not found");
  }

  const normalized = normalizeTaskInput(updates, task);

  task.title = normalized.title;
  task.description = normalized.description;
  task.status = normalized.status;
  task.priority = normalized.priority;
  task.dueDate = normalized.dueDate;
  task.tags = normalized.tags;

  await saveTasks(normalizedTasks);
  return task;
}

export async function searchTasks(query) {
  assertNonEmptyString(query, "Search query");

  const tasks = (await loadTasks()).map(normalizeStoredTask);
  const q = query.trim().toLowerCase();

  return tasks.filter(task => {
    const haystack = [
      task.title,
      task.description,
      task.status,
      task.priority,
      task.dueDate,
      task.tags.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export async function filterTasks(filters) {
  const tasks = (await loadTasks()).map(normalizeStoredTask);

  return tasks.filter(task => {
    if (filters.status) {
      assertStatus(filters.status);
      if (task.status !== filters.status) return false;
    }

    if (filters.priority) {
      assertPriority(filters.priority);
      if (task.priority !== filters.priority) return false;
    }

    if (filters.tag) {
      const tag = filters.tag.trim().toLowerCase();
      const hasTag = task.tags.some(item => item.toLowerCase() === tag);
      if (!hasTag) return false;
    }

    if (filters.dueDate) {
      assertDateOrEmpty(filters.dueDate, "dueDate");
      if (task.dueDate !== filters.dueDate) return false;
    }

    return true;
  });
}

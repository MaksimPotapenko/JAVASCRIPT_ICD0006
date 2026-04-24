import { v4 as uuid } from "uuid";

import { readDb, writeDb } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { notFound, sendValidationError } from "../utils/errors.js";

function nowIso() {
  return new Date().toISOString();
}

function sortBy(field) {
  return (left, right) => Number(left[field]) - Number(right[field]);
}

function assertCategoryPayload(payload) {
  if (!payload?.categoryName?.trim()) return "Category name is required";
  if (!Number.isFinite(Number(payload.categorySort))) return "Category sort must be a number";
  return null;
}

function assertPriorityPayload(payload) {
  if (!payload?.priorityName?.trim()) return "Priority name is required";
  if (!Number.isFinite(Number(payload.prioritySort))) return "Priority sort must be a number";
  return null;
}

function assertTaskPayload(payload) {
  if (!payload?.taskName?.trim()) return "Task name is required";
  if (!Number.isFinite(Number(payload.taskSort))) return "Task sort must be a number";
  if (!payload?.todoCategoryId) return "todoCategoryId is required";
  if (!payload?.todoPriorityId) return "todoPriorityId is required";
  return null;
}

function ownItems(items, userId) {
  return items.filter((item) => item.userId === userId);
}

export function registerTodoRoutes(app) {
  app.use("/api/v1/TodoCategories", requireAuth);
  app.use("/api/v1/TodoPriorities", requireAuth);
  app.use("/api/v1/TodoTasks", requireAuth);

  app.get("/api/v1/TodoCategories", (request, response) => {
    const db = readDb();
    response.json(ownItems(db.categories, request.auth.userId).sort(sortBy("categorySort")));
  });

  app.post("/api/v1/TodoCategories", (request, response) => {
    const errorMessage = assertCategoryPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const category = {
      id: uuid(),
      userId: request.auth.userId,
      categoryName: request.body.categoryName.trim(),
      categorySort: Number(request.body.categorySort),
      syncDt: nowIso(),
      tag: request.body.tag?.trim() || null,
    };

    db.categories.push(category);
    writeDb(db);
    response.status(201).json(category);
  });

  app.put("/api/v1/TodoCategories/:id", (request, response) => {
    const errorMessage = assertCategoryPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const category = db.categories.find((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (!category) {
      return notFound(response, "Category");
    }

    category.categoryName = request.body.categoryName.trim();
    category.categorySort = Number(request.body.categorySort);
    category.tag = request.body.tag?.trim() || null;
    category.syncDt = request.body.syncDt ?? nowIso();

    writeDb(db);
    response.json(category);
  });

  app.delete("/api/v1/TodoCategories/:id", (request, response) => {
    const db = readDb();
    const categoryIndex = db.categories.findIndex((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (categoryIndex < 0) {
      return notFound(response, "Category");
    }

    const [removedCategory] = db.categories.splice(categoryIndex, 1);
    db.tasks = db.tasks.filter((task) => task.todoCategoryId !== removedCategory.id || task.userId !== request.auth.userId);

    writeDb(db);
    response.status(204).send();
  });

  app.get("/api/v1/TodoPriorities", (request, response) => {
    const db = readDb();
    response.json(ownItems(db.priorities, request.auth.userId).sort(sortBy("prioritySort")));
  });

  app.post("/api/v1/TodoPriorities", (request, response) => {
    const errorMessage = assertPriorityPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const priority = {
      id: uuid(),
      userId: request.auth.userId,
      priorityName: request.body.priorityName.trim(),
      prioritySort: Number(request.body.prioritySort),
      syncDt: request.body.syncDt ?? nowIso(),
    };

    db.priorities.push(priority);
    writeDb(db);
    response.status(201).json(priority);
  });

  app.put("/api/v1/TodoPriorities/:id", (request, response) => {
    const errorMessage = assertPriorityPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const priority = db.priorities.find((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (!priority) {
      return notFound(response, "Priority");
    }

    priority.priorityName = request.body.priorityName.trim();
    priority.prioritySort = Number(request.body.prioritySort);
    priority.syncDt = request.body.syncDt ?? nowIso();

    writeDb(db);
    response.json(priority);
  });

  app.delete("/api/v1/TodoPriorities/:id", (request, response) => {
    const db = readDb();
    const priorityIndex = db.priorities.findIndex((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (priorityIndex < 0) {
      return notFound(response, "Priority");
    }

    const [removedPriority] = db.priorities.splice(priorityIndex, 1);
    db.tasks = db.tasks.filter((task) => task.todoPriorityId !== removedPriority.id || task.userId !== request.auth.userId);

    writeDb(db);
    response.status(204).send();
  });

  app.get("/api/v1/TodoTasks", (request, response) => {
    const db = readDb();
    response.json(ownItems(db.tasks, request.auth.userId).sort(sortBy("taskSort")));
  });

  app.post("/api/v1/TodoTasks", (request, response) => {
    const errorMessage = assertTaskPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const hasCategory = db.categories.some((item) => item.id === request.body.todoCategoryId && item.userId === request.auth.userId);
    const hasPriority = db.priorities.some((item) => item.id === request.body.todoPriorityId && item.userId === request.auth.userId);

    if (!hasCategory || !hasPriority) {
      return sendValidationError(response, "Task references an unknown category or priority");
    }

    const task = {
      id: uuid(),
      userId: request.auth.userId,
      taskName: request.body.taskName.trim(),
      taskSort: Number(request.body.taskSort),
      createdDt: request.body.createdDt ?? nowIso(),
      dueDt: request.body.dueDt ?? null,
      isCompleted: Boolean(request.body.isCompleted),
      isArchived: Boolean(request.body.isArchived),
      todoCategoryId: request.body.todoCategoryId,
      todoPriorityId: request.body.todoPriorityId,
      syncDt: request.body.syncDt ?? nowIso(),
    };

    db.tasks.push(task);
    writeDb(db);
    response.status(201).json(task);
  });

  app.put("/api/v1/TodoTasks/:id", (request, response) => {
    const errorMessage = assertTaskPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const task = db.tasks.find((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (!task) {
      return notFound(response, "Task");
    }

    const hasCategory = db.categories.some((item) => item.id === request.body.todoCategoryId && item.userId === request.auth.userId);
    const hasPriority = db.priorities.some((item) => item.id === request.body.todoPriorityId && item.userId === request.auth.userId);

    if (!hasCategory || !hasPriority) {
      return sendValidationError(response, "Task references an unknown category or priority");
    }

    task.taskName = request.body.taskName.trim();
    task.taskSort = Number(request.body.taskSort);
    task.createdDt = request.body.createdDt ?? task.createdDt;
    task.dueDt = request.body.dueDt ?? null;
    task.isCompleted = Boolean(request.body.isCompleted);
    task.isArchived = Boolean(request.body.isArchived);
    task.todoCategoryId = request.body.todoCategoryId;
    task.todoPriorityId = request.body.todoPriorityId;
    task.syncDt = request.body.syncDt ?? nowIso();

    writeDb(db);
    response.json(task);
  });

  app.delete("/api/v1/TodoTasks/:id", (request, response) => {
    const db = readDb();
    const taskIndex = db.tasks.findIndex((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (taskIndex < 0) {
      return notFound(response, "Task");
    }

    db.tasks.splice(taskIndex, 1);
    writeDb(db);
    response.status(204).send();
  });
}

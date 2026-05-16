import { v4 as uuid } from "uuid";

import { readDb, writeDb } from "../db/store.js";
import { requireAuth } from "../middleware/auth.js";
import { notFound, sendValidationError } from "../utils/errors.js";

/**
 * Returns the current timestamp in ISO format for sync and creation fields.
 */
function nowIso() {
  return new Date().toISOString();
}

/**
 * Creates a numeric ascending comparator for the chosen field name.
 */
function sortBy(field) {
  return (left, right) => Number(left[field]) - Number(right[field]);
}

/**
 * Validates category payloads for both creation and update requests.
 */
function assertCategoryPayload(payload) {
  if (!payload?.categoryName?.trim()) return "Category name is required";
  if (!Number.isFinite(Number(payload.categorySort))) return "Category sort must be a number";
  return null;
}

/**
 * Validates priority payloads for both creation and update requests.
 */
function assertPriorityPayload(payload) {
  if (!payload?.priorityName?.trim()) return "Priority name is required";
  if (!Number.isFinite(Number(payload.prioritySort))) return "Priority sort must be a number";
  return null;
}

/**
 * Validates task payloads before relation checks and persistence.
 */
function assertTaskPayload(payload) {
  if (!payload?.taskName?.trim()) return "Task name is required";
  if (!Number.isFinite(Number(payload.taskSort))) return "Task sort must be a number";
  if (!payload?.todoCategoryId) return "todoCategoryId is required";
  if (!payload?.todoPriorityId) return "todoPriorityId is required";
  return null;
}

/**
 * Filters a collection down to records owned by the authenticated user.
 */
function ownItems(items, userId) {
  return items.filter((item) => item.userId === userId);
}

/**
 * Registers the protected Todo CRUD endpoints for categories, priorities, and tasks.
 */
export function registerTodoRoutes(app) {
  // Protect every request under these route prefixes with JWT authentication.
  app.use("/api/v1/TodoCategories", requireAuth);
  app.use("/api/v1/TodoPriorities", requireAuth);
  app.use("/api/v1/TodoTasks", requireAuth);

  app.get("/api/v1/TodoCategories", (request, response) => {
    const db = readDb();
    // Return only the current user's categories in UI-friendly sort order.
    response.json(ownItems(db.categories, request.auth.userId).sort(sortBy("categorySort")));
  });

  app.post("/api/v1/TodoCategories", (request, response) => {
    // Validate before building the new category object.
    const errorMessage = assertCategoryPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const category = {
      id: uuid(),
      // The owner id keeps each user's data isolated inside the shared JSON file.
      userId: request.auth.userId,
      categoryName: request.body.categoryName.trim(),
      categorySort: Number(request.body.categorySort),
      syncDt: nowIso(),
      tag: request.body.tag?.trim() || null,
    };

    // Append the record, then persist the whole snapshot.
    db.categories.push(category);
    writeDb(db);
    response.status(201).json(category);
  });

  app.put("/api/v1/TodoCategories/:id", (request, response) => {
    // PUT uses the same validation rules as POST for a consistent data shape.
    const errorMessage = assertCategoryPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    // Combine id and userId matching so cross-user edits are impossible.
    const category = db.categories.find((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (!category) {
      return notFound(response, "Category");
    }

    // Update fields in place to keep the mutation flow explicit for learning purposes.
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

    // Cascading delete keeps tasks from pointing at a category that no longer exists.
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
    // Priorities follow the same shape as categories: validate, build, push, persist.
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
      // Allow the client to preserve a server sync timestamp if needed, otherwise generate one now.
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
    // Look up by both id and owner to preserve per-user isolation.
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

    // Delete tasks tied to the removed priority so the remaining data stays consistent.
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
    // Tasks need scalar validation first, then relation validation against categories and priorities.
    const errorMessage = assertTaskPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    // The related category and priority must already exist and belong to the same user.
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
      // Use a client-provided created timestamp when syncing, otherwise stamp it on the server.
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
    // Update validation mirrors task creation to keep POST and PUT behavior aligned.
    const errorMessage = assertTaskPayload(request.body);
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    // Only the task owner can update an existing task.
    const task = db.tasks.find((item) => item.id === request.params.id && item.userId === request.auth.userId);

    if (!task) {
      return notFound(response, "Task");
    }

    // Re-check relations because the update may point to different category or priority ids.
    const hasCategory = db.categories.some((item) => item.id === request.body.todoCategoryId && item.userId === request.auth.userId);
    const hasPriority = db.priorities.some((item) => item.id === request.body.todoPriorityId && item.userId === request.auth.userId);

    if (!hasCategory || !hasPriority) {
      return sendValidationError(response, "Task references an unknown category or priority");
    }

    // Assign each property individually so the resulting task shape is obvious during code review.
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

    // Tasks do not own child records, so deletion is a single array splice.
    db.tasks.splice(taskIndex, 1);
    writeDb(db);
    response.status(204).send();
  });
}

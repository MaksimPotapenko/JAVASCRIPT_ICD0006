import { apiRequest } from "@/services/api";
import type {
  TodoCategory,
  TodoCategoryCreate,
  TodoPriority,
  TodoPriorityCreate,
  TodoTask,
  TodoTaskCreate,
} from "@/types/api";

/**
 * Wraps Todo-related backend endpoints behind small typed request helpers.
 */
export const todoApi = {
  /**
   * Fetches all categories for dashboard rendering and task/category lookups.
   */
  getCategories() {
    // Categories are needed for both rendering and task-category relationships.
    return apiRequest<TodoCategory[]>("/TodoCategories");
  },
  /**
   * Creates a new category entity in the backend.
   */
  createCategory(payload: TodoCategoryCreate) {
    // New categories are sent as plain JSON to the protected backend endpoint.
    return apiRequest<TodoCategory>("/TodoCategories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  /**
   * Updates an existing category by id.
   */
  updateCategory(id: string, payload: TodoCategory) {
    // The backend expects the full edited category model on update.
    return apiRequest<TodoCategory>(`/TodoCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  /**
   * Deletes a category by id.
   */
  deleteCategory(id: string) {
    // DELETE returns no payload, so the caller only needs completion confirmation.
    return apiRequest<void>(`/TodoCategories/${id}`, { method: "DELETE" });
  },
  /**
   * Fetches all priorities used by the task editor and priority list.
   */
  getPriorities() {
    // Priorities drive both the editor dropdown and the rendered task metadata.
    return apiRequest<TodoPriority[]>("/TodoPriorities");
  },
  /**
   * Creates a new priority entity in the backend.
   */
  createPriority(payload: TodoPriorityCreate) {
    // Priority creation is a straightforward protected POST request.
    return apiRequest<TodoPriority>("/TodoPriorities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  /**
   * Updates an existing priority by id.
   */
  updatePriority(id: string, payload: TodoPriority) {
    // Updates send the full priority object back to the API.
    return apiRequest<TodoPriority>(`/TodoPriorities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  /**
   * Deletes a priority by id.
   */
  deletePriority(id: string) {
    // Callers clean up local dependent tasks after this request resolves.
    return apiRequest<void>(`/TodoPriorities/${id}`, { method: "DELETE" });
  },
  /**
   * Fetches all tasks for the active and archived task views.
   */
  getTasks() {
    // Tasks are split into active and archived lists later in the context layer.
    return apiRequest<TodoTask[]>("/TodoTasks");
  },
  /**
   * Creates a new task in the backend.
   */
  createTask(payload: TodoTaskCreate) {
    // Task creation includes links to both category and priority entities.
    return apiRequest<TodoTask>("/TodoTasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  /**
   * Updates an existing task by id.
   */
  updateTask(id: string, payload: TodoTask) {
    // Inline editing in the dashboard sends the whole updated task model.
    return apiRequest<TodoTask>(`/TodoTasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  /**
   * Deletes a task by id.
   */
  deleteTask(id: string) {
    // Task deletion is fire-and-forget from the perspective of the API layer.
    return apiRequest<void>(`/TodoTasks/${id}`, { method: "DELETE" });
  },
};

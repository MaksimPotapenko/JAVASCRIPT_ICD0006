import { apiRequest } from "@/services/api";
import type {
  TodoCategory,
  TodoCategoryCreate,
  TodoPriority,
  TodoPriorityCreate,
  TodoTask,
  TodoTaskCreate,
} from "@/types/api";

export const todoApi = {
  // Fetches all categories for dashboard rendering and task/category lookups.
  getCategories() {
    return apiRequest<TodoCategory[]>("/TodoCategories");
  },
  // Creates a new category entity in the backend.
  createCategory(payload: TodoCategoryCreate) {
    return apiRequest<TodoCategory>("/TodoCategories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  // Updates an existing category by id.
  updateCategory(id: string, payload: TodoCategory) {
    return apiRequest<TodoCategory>(`/TodoCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  // Deletes a category by id.
  deleteCategory(id: string) {
    return apiRequest<void>(`/TodoCategories/${id}`, { method: "DELETE" });
  },

  // Fetches all priorities used by the task editor and priority list.
  getPriorities() {
    return apiRequest<TodoPriority[]>("/TodoPriorities");
  },
  // Creates a new priority entity in the backend.
  createPriority(payload: TodoPriorityCreate) {
    return apiRequest<TodoPriority>("/TodoPriorities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  // Updates an existing priority by id.
  updatePriority(id: string, payload: TodoPriority) {
    return apiRequest<TodoPriority>(`/TodoPriorities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  // Deletes a priority by id.
  deletePriority(id: string) {
    return apiRequest<void>(`/TodoPriorities/${id}`, { method: "DELETE" });
  },

  // Fetches all tasks for the active and archived task views.
  getTasks() {
    return apiRequest<TodoTask[]>("/TodoTasks");
  },
  // Creates a new task in the backend.
  createTask(payload: TodoTaskCreate) {
    return apiRequest<TodoTask>("/TodoTasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  // Updates an existing task by id.
  updateTask(id: string, payload: TodoTask) {
    return apiRequest<TodoTask>(`/TodoTasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  // Deletes a task by id.
  deleteTask(id: string) {
    return apiRequest<void>(`/TodoTasks/${id}`, { method: "DELETE" });
  },
};

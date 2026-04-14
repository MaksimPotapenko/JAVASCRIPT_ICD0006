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
  getCategories() {
    return apiRequest<TodoCategory[]>("/TodoCategories");
  },
  createCategory(payload: TodoCategoryCreate) {
    return apiRequest<TodoCategory>("/TodoCategories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCategory(id: string, payload: TodoCategory) {
    return apiRequest<TodoCategory>(`/TodoCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteCategory(id: string) {
    return apiRequest<void>(`/TodoCategories/${id}`, { method: "DELETE" });
  },

  getPriorities() {
    return apiRequest<TodoPriority[]>("/TodoPriorities");
  },
  createPriority(payload: TodoPriorityCreate) {
    return apiRequest<TodoPriority>("/TodoPriorities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updatePriority(id: string, payload: TodoPriority) {
    return apiRequest<TodoPriority>(`/TodoPriorities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deletePriority(id: string) {
    return apiRequest<void>(`/TodoPriorities/${id}`, { method: "DELETE" });
  },

  getTasks() {
    return apiRequest<TodoTask[]>("/TodoTasks");
  },
  createTask(payload: TodoTaskCreate) {
    return apiRequest<TodoTask>("/TodoTasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateTask(id: string, payload: TodoTask) {
    return apiRequest<TodoTask>(`/TodoTasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteTask(id: string) {
    return apiRequest<void>(`/TodoTasks/${id}`, { method: "DELETE" });
  },
};

import { apiRequest } from "@/services/api";
import type {
  TodoCategory,
  TodoCategoryCreate,
  TodoCategoryEdit,
  TodoPriority,
  TodoTask,
  TodoTaskUpsert,
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
  updateCategory(id: string, payload: TodoCategoryEdit) {
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
  createPriority(payload: TodoPriority) {
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
  createTask(payload: TodoTaskUpsert) {
    return apiRequest<TodoTask>("/TodoTasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateTask(id: string, payload: TodoTaskUpsert) {
    return apiRequest<TodoTask>(`/TodoTasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteTask(id: string) {
    return apiRequest<void>(`/TodoTasks/${id}`, { method: "DELETE" });
  },
};

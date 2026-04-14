import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { todoApi } from "@/services/todo-api";
import type { TodoCategory, TodoPriority, TodoTask } from "@/types/api";

// Generates a current ISO timestamp for create/update payloads that require sync metadata.
function nowIso() {
  return new Date().toISOString();
}

export const useTodoStore = defineStore("todos", () => {
  const categories = ref<TodoCategory[]>([]);
  const priorities = ref<TodoPriority[]>([]);
  const tasks = ref<TodoTask[]>([]);
  const isLoading = ref(false);
  const error = ref("");

  const activeTasks = computed(() => tasks.value.filter((task) => !task.isArchived));
  const archivedTasks = computed(() => tasks.value.filter((task) => task.isArchived));

  // Loads all Todo entities in parallel so the dashboard starts with a full working state.
  async function loadAll() {
    isLoading.value = true;
    error.value = "";
    try {
      const [nextCategories, nextPriorities, nextTasks] = await Promise.all([
        todoApi.getCategories(),
        todoApi.getPriorities(),
        todoApi.getTasks(),
      ]);

      categories.value = nextCategories;
      priorities.value = nextPriorities;
      tasks.value = nextTasks;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Could not load todo data";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Creates a category through the API and keeps the local list sorted by display order.
  async function addCategory(input: { categoryName: string; categorySort: number; tag?: string }) {
    const created = await todoApi.createCategory({
      categoryName: input.categoryName.trim(),
      categorySort: input.categorySort,
      tag: input.tag?.trim() || null,
    });

    categories.value = [...categories.value, created].sort((a, b) => a.categorySort - b.categorySort);
  }

  // Saves inline category edits back to the backend and replaces the updated entity in the store.
  async function saveCategory(category: TodoCategory) {
    const updated = await todoApi.updateCategory(category.id, {
      ...category,
      categoryName: category.categoryName.trim(),
      tag: category.tag ?? null,
    });

    categories.value = categories.value.map((item) => (item.id === updated.id ? updated : item));
  }

  // Deletes a category and removes tasks that would otherwise point to a missing category.
  async function removeCategory(id: string) {
    await todoApi.deleteCategory(id);
    categories.value = categories.value.filter((item) => item.id !== id);
    tasks.value = tasks.value.filter((task) => task.todoCategoryId !== id);
  }

  // Creates a priority through the API and keeps the local list sorted by display order.
  async function addPriority(input: { priorityName: string; prioritySort: number }) {
    const created = await todoApi.createPriority({
      priorityName: input.priorityName.trim(),
      prioritySort: input.prioritySort,
      syncDt: nowIso(),
    });

    priorities.value = [...priorities.value, created].sort((a, b) => a.prioritySort - b.prioritySort);
  }

  // Saves inline priority edits and updates the matching item in the local store.
  async function savePriority(priority: TodoPriority) {
    const updated = await todoApi.updatePriority(priority.id, {
      ...priority,
      priorityName: priority.priorityName.trim(),
      syncDt: priority.syncDt,
    });

    priorities.value = priorities.value.map((item) => (item.id === updated.id ? updated : item));
  }

  // Deletes a priority and drops tasks that still reference that removed priority.
  async function removePriority(id: string) {
    await todoApi.deletePriority(id);
    priorities.value = priorities.value.filter((item) => item.id !== id);
    tasks.value = tasks.value.filter((task) => task.todoPriorityId !== id);
  }

  // Creates a task from the form state and normalizes date values into API-friendly ISO strings.
  async function addTask(input: {
    taskName: string;
    taskSort: number;
    dueDt?: string;
    todoCategoryId: string;
    todoPriorityId: string;
    isCompleted: boolean;
    isArchived: boolean;
  }) {
    const created = await todoApi.createTask({
      createdDt: nowIso(),
      taskName: input.taskName.trim(),
      taskSort: input.taskSort,
      dueDt: input.dueDt ? new Date(input.dueDt).toISOString() : null,
      todoCategoryId: input.todoCategoryId,
      todoPriorityId: input.todoPriorityId,
      isCompleted: input.isCompleted,
      isArchived: input.isArchived,
    });

    tasks.value = [...tasks.value, created].sort((a, b) => a.taskSort - b.taskSort);
  }

  // Saves inline task edits, including due-date normalization and a fresh sync timestamp.
  async function saveTask(task: TodoTask) {
    const updated = await todoApi.updateTask(task.id, {
      ...task,
      dueDt: task.dueDt ? new Date(task.dueDt).toISOString() : null,
      syncDt: nowIso(),
    });

    tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));
  }

  // Deletes a single task from both the backend and the local store.
  async function removeTask(id: string) {
    await todoApi.deleteTask(id);
    tasks.value = tasks.value.filter((item) => item.id !== id);
  }

  return {
    activeTasks,
    archivedTasks,
    categories,
    error,
    isLoading,
    loadAll,
    priorities,
    tasks,
    addCategory,
    addPriority,
    addTask,
    removeCategory,
    removePriority,
    removeTask,
    saveCategory,
    savePriority,
    saveTask,
  };
});

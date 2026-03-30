import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { todoApi } from "@/services/todo-api";
import type { TodoCategory, TodoPriority, TodoTask } from "@/types/api";

function newId() {
  return crypto.randomUUID();
}

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

  async function addCategory(input: { categoryName: string; categorySort: number; tag?: string }) {
    const created = await todoApi.createCategory({
      id: newId(),
      categoryName: input.categoryName.trim(),
      categorySort: input.categorySort,
      tag: input.tag?.trim() || null,
    });

    categories.value = [...categories.value, created].sort((a, b) => a.categorySort - b.categorySort);
  }

  async function saveCategory(category: TodoCategory) {
    const updated = await todoApi.updateCategory(category.id, {
      id: category.id,
      categoryName: category.categoryName.trim(),
      categorySort: category.categorySort,
      tag: category.tag ?? null,
      syncDt: category.syncDt,
    });

    categories.value = categories.value.map((item) => (item.id === updated.id ? updated : item));
  }

  async function removeCategory(id: string) {
    await todoApi.deleteCategory(id);
    categories.value = categories.value.filter((item) => item.id !== id);
    tasks.value = tasks.value.filter((task) => task.todoCategoryId !== id);
  }

  async function addPriority(input: { priorityName: string; prioritySort: number; tag?: string }) {
    const created = await todoApi.createPriority({
      id: newId(),
      priorityName: input.priorityName.trim(),
      prioritySort: input.prioritySort,
      tag: input.tag?.trim() || null,
      syncDt: nowIso(),
    });

    priorities.value = [...priorities.value, created].sort((a, b) => a.prioritySort - b.prioritySort);
  }

  async function savePriority(priority: TodoPriority) {
    const updated = await todoApi.updatePriority(priority.id, {
      ...priority,
      priorityName: priority.priorityName.trim(),
      syncDt: priority.syncDt ?? nowIso(),
    });

    priorities.value = priorities.value.map((item) => (item.id === updated.id ? updated : item));
  }

  async function removePriority(id: string) {
    await todoApi.deletePriority(id);
    priorities.value = priorities.value.filter((item) => item.id !== id);
    tasks.value = tasks.value.filter((task) => task.todoPriorityId !== id);
  }

  async function addTask(input: {
    taskName: string;
    taskSort: number;
    dueDt?: string;
    todoCategoryId: string;
    todoPriorityId: string;
    isCompleted: boolean;
    isArchived: boolean;
  }) {
    const timestamp = nowIso();
    const created = await todoApi.createTask({
      id: newId(),
      taskName: input.taskName.trim(),
      taskSort: input.taskSort,
      createdDt: timestamp,
      dueDt: input.dueDt ? new Date(input.dueDt).toISOString() : null,
      todoCategoryId: input.todoCategoryId,
      todoPriorityId: input.todoPriorityId,
      isCompleted: input.isCompleted,
      isArchived: input.isArchived,
      syncDt: timestamp,
    });

    tasks.value = [...tasks.value, created].sort((a, b) => a.taskSort - b.taskSort);
  }

  async function saveTask(task: TodoTask) {
    const updated = await todoApi.updateTask(task.id, {
      ...task,
      dueDt: task.dueDt ? new Date(task.dueDt).toISOString() : null,
      syncDt: nowIso(),
    });

    tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));
  }

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

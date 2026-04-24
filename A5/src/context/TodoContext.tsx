import { createContext, useContext, useReducer } from "react";

import { nowIso } from "@/lib/date";
import { todoApi } from "@/services/todo-api";
import type { TodoCategory, TodoPriority, TodoTask } from "@/types/api";

interface TodoState {
  categories: TodoCategory[];
  priorities: TodoPriority[];
  tasks: TodoTask[];
  isLoading: boolean;
  error: string;
}

type TodoAction =
  | { type: "todo/start" }
  | { type: "todo/error"; payload: string }
  | { type: "todo/load-success"; payload: { categories: TodoCategory[]; priorities: TodoPriority[]; tasks: TodoTask[] } }
  | { type: "todo/categories"; payload: TodoCategory[] }
  | { type: "todo/priorities"; payload: TodoPriority[] }
  | { type: "todo/tasks"; payload: TodoTask[] }
  | { type: "todo/clear" };

interface TodoContextValue {
  state: TodoState;
  activeTasks: TodoTask[];
  archivedTasks: TodoTask[];
  loadAll: () => Promise<void>;
  clearAll: () => void;
  addCategory: (input: { categoryName: string; categorySort: number; tag?: string }) => Promise<void>;
  saveCategory: (category: TodoCategory) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addPriority: (input: { priorityName: string; prioritySort: number }) => Promise<void>;
  savePriority: (priority: TodoPriority) => Promise<void>;
  removePriority: (id: string) => Promise<void>;
  addTask: (input: {
    taskName: string;
    taskSort: number;
    dueDt?: string;
    todoCategoryId: string;
    todoPriorityId: string;
    isCompleted: boolean;
    isArchived: boolean;
  }) => Promise<void>;
  saveTask: (task: TodoTask) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
}

const initialState: TodoState = {
  categories: [],
  priorities: [],
  tasks: [],
  isLoading: false,
  error: "",
};

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "todo/start":
      return { ...state, isLoading: true, error: "" };
    case "todo/error":
      return { ...state, isLoading: false, error: action.payload };
    case "todo/load-success":
      return {
        categories: action.payload.categories,
        priorities: action.payload.priorities,
        tasks: action.payload.tasks,
        isLoading: false,
        error: "",
      };
    case "todo/categories":
      return { ...state, categories: action.payload, isLoading: false, error: "" };
    case "todo/priorities":
      return { ...state, priorities: action.payload, isLoading: false, error: "" };
    case "todo/tasks":
      return { ...state, tasks: action.payload, isLoading: false, error: "" };
    case "todo/clear":
      return initialState;
    default:
      return state;
  }
}

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  async function loadAll() {
    dispatch({ type: "todo/start" });

    try {
      const [categories, priorities, tasks] = await Promise.all([
        todoApi.getCategories(),
        todoApi.getPriorities(),
        todoApi.getTasks(),
      ]);

      dispatch({
        type: "todo/load-success",
        payload: { categories, priorities, tasks },
      });
    } catch (error) {
      dispatch({
        type: "todo/error",
        payload: error instanceof Error ? error.message : "Could not load todo data",
      });
      throw error;
    }
  }

  function clearAll() {
    dispatch({ type: "todo/clear" });
  }

  async function addCategory(input: { categoryName: string; categorySort: number; tag?: string }) {
    const created = await todoApi.createCategory({
      categoryName: input.categoryName.trim(),
      categorySort: input.categorySort,
      tag: input.tag?.trim() || null,
    });

    dispatch({
      type: "todo/categories",
      payload: [...state.categories, created].sort((left, right) => left.categorySort - right.categorySort),
    });
  }

  async function saveCategory(category: TodoCategory) {
    const updated = await todoApi.updateCategory(category.id, {
      ...category,
      categoryName: category.categoryName.trim(),
      tag: category.tag ?? null,
    });

    dispatch({
      type: "todo/categories",
      payload: state.categories
        .map((item) => (item.id === updated.id ? updated : item))
        .sort((left, right) => left.categorySort - right.categorySort),
    });
  }

  async function removeCategory(id: string) {
    await todoApi.deleteCategory(id);

    dispatch({
      type: "todo/categories",
      payload: state.categories.filter((item) => item.id !== id),
    });
    dispatch({
      type: "todo/tasks",
      payload: state.tasks.filter((task) => task.todoCategoryId !== id),
    });
  }

  async function addPriority(input: { priorityName: string; prioritySort: number }) {
    const created = await todoApi.createPriority({
      priorityName: input.priorityName.trim(),
      prioritySort: input.prioritySort,
      syncDt: nowIso(),
    });

    dispatch({
      type: "todo/priorities",
      payload: [...state.priorities, created].sort((left, right) => left.prioritySort - right.prioritySort),
    });
  }

  async function savePriority(priority: TodoPriority) {
    const updated = await todoApi.updatePriority(priority.id, {
      ...priority,
      priorityName: priority.priorityName.trim(),
      syncDt: priority.syncDt,
    });

    dispatch({
      type: "todo/priorities",
      payload: state.priorities
        .map((item) => (item.id === updated.id ? updated : item))
        .sort((left, right) => left.prioritySort - right.prioritySort),
    });
  }

  async function removePriority(id: string) {
    await todoApi.deletePriority(id);

    dispatch({
      type: "todo/priorities",
      payload: state.priorities.filter((item) => item.id !== id),
    });
    dispatch({
      type: "todo/tasks",
      payload: state.tasks.filter((task) => task.todoPriorityId !== id),
    });
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

    dispatch({
      type: "todo/tasks",
      payload: [...state.tasks, created].sort((left, right) => left.taskSort - right.taskSort),
    });
  }

  async function saveTask(task: TodoTask) {
    const updated = await todoApi.updateTask(task.id, {
      ...task,
      dueDt: task.dueDt ? new Date(task.dueDt).toISOString() : null,
      syncDt: nowIso(),
    });

    dispatch({
      type: "todo/tasks",
      payload: state.tasks
        .map((item) => (item.id === updated.id ? updated : item))
        .sort((left, right) => left.taskSort - right.taskSort),
    });
  }

  async function removeTask(id: string) {
    await todoApi.deleteTask(id);

    dispatch({
      type: "todo/tasks",
      payload: state.tasks.filter((item) => item.id !== id),
    });
  }

  const value: TodoContextValue = {
    state,
    activeTasks: state.tasks.filter((task) => !task.isArchived),
    archivedTasks: state.tasks.filter((task) => task.isArchived),
    loadAll,
    clearAll,
    addCategory,
    saveCategory,
    removeCategory,
    addPriority,
    savePriority,
    removePriority,
    addTask,
    saveTask,
    removeTask,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodos must be used within TodoProvider");
  }

  return context;
}

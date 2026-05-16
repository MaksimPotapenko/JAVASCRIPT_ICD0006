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

/**
 * Keeps all Todo-related state transitions in one place so CRUD updates stay easy to reason about.
 */
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "todo/start":
      // Start actions clear stale errors and show loading indicators in the dashboard.
      return { ...state, isLoading: true, error: "" };
    case "todo/error":
      // Errors stop loading while preserving already loaded data for the user.
      return { ...state, isLoading: false, error: action.payload };
    case "todo/load-success":
      // Initial load replaces all entity collections at once with the backend snapshot.
      return {
        categories: action.payload.categories,
        priorities: action.payload.priorities,
        tasks: action.payload.tasks,
        isLoading: false,
        error: "",
      };
    case "todo/categories":
      // Category-specific updates only replace the category slice.
      return { ...state, categories: action.payload, isLoading: false, error: "" };
    case "todo/priorities":
      // Priority-specific updates only replace the priority slice.
      return { ...state, priorities: action.payload, isLoading: false, error: "" };
    case "todo/tasks":
      // Task-specific updates only replace the task slice.
      return { ...state, tasks: action.payload, isLoading: false, error: "" };
    case "todo/clear":
      // Clearing returns the context to its fresh guest-session state.
      return initialState;
    default:
      return state;
  }
}

const TodoContext = createContext<TodoContextValue | null>(null);

/**
 * Owns the fetched Todo entities and exposes typed CRUD helpers backed by reducers.
 */
export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  /**
   * Loads categories, priorities, and tasks together so the dashboard has a complete working dataset.
   */
  async function loadAll() {
    // One loading action covers the full dashboard bootstrap sequence.
    dispatch({ type: "todo/start" });

    try {
      // Loading all three entity sets together avoids partial dashboard states.
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

  /**
   * Resets all Todo state, typically used when the user logs out.
   */
  function clearAll() {
    // The auth layer calls this during logout so private Todo data disappears immediately.
    dispatch({ type: "todo/clear" });
  }

  /**
   * Creates a category and merges it into the local sorted category list.
   */
  async function addCategory(input: { categoryName: string; categorySort: number; tag?: string }) {
    // Normalize text fields before they are persisted to the backend.
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

  /**
   * Persists category field edits and replaces the matching entity in local state.
   */
  async function saveCategory(category: TodoCategory) {
    // Inline edits send back the full entity so the backend stays authoritative.
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

  /**
   * Removes a category and eagerly removes any tasks that referenced it from the local state.
   */
  async function removeCategory(id: string) {
    // The backend removes the category, then the context mirrors that locally.
    await todoApi.deleteCategory(id);

    dispatch({
      type: "todo/categories",
      payload: state.categories.filter((item) => item.id !== id),
    });
    dispatch({
      type: "todo/tasks",
      // Remove dependent tasks locally so the dashboard stays consistent right away.
      payload: state.tasks.filter((task) => task.todoCategoryId !== id),
    });
  }

  /**
   * Creates a priority and inserts it into the locally sorted priority list.
   */
  async function addPriority(input: { priorityName: string; prioritySort: number }) {
    // New priorities get a fresh sync timestamp before they are created.
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

  /**
   * Persists priority edits and keeps the local order consistent with the backend entity.
   */
  async function savePriority(priority: TodoPriority) {
    // Priority updates preserve sort order after the edited entity is replaced.
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

  /**
   * Removes a priority and filters out tasks that depended on it from the current state.
   */
  async function removePriority(id: string) {
    // Delete the priority remotely first, then clean up local state.
    await todoApi.deletePriority(id);

    dispatch({
      type: "todo/priorities",
      payload: state.priorities.filter((item) => item.id !== id),
    });
    dispatch({
      type: "todo/tasks",
      // Tasks pointing at the removed priority should disappear from the local view too.
      payload: state.tasks.filter((task) => task.todoPriorityId !== id),
    });
  }

  /**
   * Creates a new task using the category and priority selected in the composer.
   */
  async function addTask(input: {
    taskName: string;
    taskSort: number;
    dueDt?: string;
    todoCategoryId: string;
    todoPriorityId: string;
    isCompleted: boolean;
    isArchived: boolean;
  }) {
    // Convert the optional due date into backend-friendly ISO format.
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

  /**
   * Persists inline task edits and swaps the updated task into the sorted task list.
   */
  async function saveTask(task: TodoTask) {
    // Inline task edits also normalize the due date before saving.
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

  /**
   * Deletes a task and removes it from the active local task collection.
   */
  async function removeTask(id: string) {
    // Task deletion is reflected locally as soon as the backend confirms removal.
    await todoApi.deleteTask(id);

    dispatch({
      type: "todo/tasks",
      payload: state.tasks.filter((item) => item.id !== id),
    });
  }

  const value: TodoContextValue = {
    state,
    // The dashboard splits tasks into two panels based on the archived flag.
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

/**
 * Provides strongly typed access to the shared Todo context.
 */
export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    // This helps catch provider wiring mistakes during development.
    throw new Error("useTodos must be used within TodoProvider");
  }

  return context;
}

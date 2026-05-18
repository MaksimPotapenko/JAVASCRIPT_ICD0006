import { FormEvent, useEffect, useState } from "react";

import { toDateTimeLocal } from "@/lib/date";
import { useAuth } from "@/context/AuthContext";
import { useTodos } from "@/context/TodoContext";
import type { TodoCategory, TodoPriority, TodoTask } from "@/types/api";

/**
 * Manages Todo categories, including creation, inline editing, and removal.
 */
function CategorySection() {
  const { state, addCategory, saveCategory, removeCategory } = useTodos();
  // Keeps the editable category creation fields local to the category panel.
  const [draft, setDraft] = useState({
    categoryName: "",
    categorySort: "1",
    tag: "",
  });

  /**
   * Creates a category from the draft form and resets the local editor afterwards.
   */
  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from reloading when the form is submitted.
    event.preventDefault();
    await addCategory({
      categoryName: draft.categoryName,
      categorySort: Number(draft.categorySort),
      tag: draft.tag,
    });
    setDraft({
      categoryName: "",
      categorySort: String(state.categories.length + 2),
      tag: "",
    });
  }

  /**
   * Persists a single inline category field change through the shared Todo context.
   */
  async function handleUpdate(category: TodoCategory, field: keyof TodoCategory, value: string) {
    // Build the next version of the entity locally before sending it through the shared context.
    const nextCategory: TodoCategory = {
      ...category,
      [field]: field === "categorySort" ? Number(value) : value,
    } as TodoCategory;

    await saveCategory(nextCategory);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Categories</h2>
        <p>Group tasks into stable buckets you can reuse across sessions.</p>
      </div>

      // The create form is local to this panel, while persistence goes through the shared context.
      <form className="stack-form" onSubmit={handleCreate}>
        <input
          placeholder="Category name"
          value={draft.categoryName}
          onChange={(event) => setDraft((current) => ({ ...current, categoryName: event.target.value }))}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Sort"
          value={draft.categorySort}
          onChange={(event) => setDraft((current) => ({ ...current, categorySort: event.target.value }))}
          required
        />
        <input
          placeholder="Tag (optional)"
          value={draft.tag}
          onChange={(event) => setDraft((current) => ({ ...current, tag: event.target.value }))}
        />
        <button type="submit">Add category</button>
      </form>

      <div className="entity-list">
        {state.categories.map((category) => (
          <article key={category.id} className="entity-card">
            <label>
              <span>Name</span>
              <input
                value={category.categoryName}
                onChange={(event) => void handleUpdate(category, "categoryName", event.target.value)}
              />
            </label>
            <label>
              <span>Sort</span>
              <input
                type="number"
                min="1"
                value={category.categorySort}
                onChange={(event) => void handleUpdate(category, "categorySort", event.target.value)}
              />
            </label>
            <label>
              <span>Tag</span>
              <input value={category.tag ?? ""} onChange={(event) => void handleUpdate(category, "tag", event.target.value)} />
            </label>
            <button type="button" className="danger-button" onClick={() => void removeCategory(category.id)}>
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Manages reusable Todo priorities with the same inline editing pattern as categories.
 */
function PrioritySection() {
  const { state, addPriority, savePriority, removePriority } = useTodos();
  // Keeps the create-priority draft isolated to the priority panel.
  const [draft, setDraft] = useState({
    priorityName: "",
    prioritySort: "1",
  });

  /**
   * Creates a priority from the local draft form.
   */
  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from reloading when the form is submitted.
    event.preventDefault();
    await addPriority({
      priorityName: draft.priorityName,
      prioritySort: Number(draft.prioritySort),
    });
    setDraft({
      priorityName: "",
      prioritySort: String(state.priorities.length + 2),
    });
  }

  /**
   * Persists a single inline priority field change through the shared Todo context.
   */
  async function handleUpdate(priority: TodoPriority, field: keyof TodoPriority, value: string) {
    // Build the next version of the entity locally before sending it through the shared context.
    const nextPriority: TodoPriority = {
      ...priority,
      [field]: field === "prioritySort" ? Number(value) : value,
    } as TodoPriority;

    await savePriority(nextPriority);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Priorities</h2>
        <p>Maintain reusable urgency levels for all Todo tasks.</p>
      </div>

      // The create form is local to this panel, while persistence goes through the shared context.
      <form className="stack-form" onSubmit={handleCreate}>
        <input
          placeholder="Priority name"
          value={draft.priorityName}
          onChange={(event) => setDraft((current) => ({ ...current, priorityName: event.target.value }))}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Sort"
          value={draft.prioritySort}
          onChange={(event) => setDraft((current) => ({ ...current, prioritySort: event.target.value }))}
          required
        />
        <button type="submit">Add priority</button>
      </form>

      <div className="entity-list">
        {state.priorities.map((priority) => (
          <article key={priority.id} className="entity-card">
            <label>
              <span>Name</span>
              <input
                value={priority.priorityName}
                onChange={(event) => void handleUpdate(priority, "priorityName", event.target.value)}
              />
            </label>
            <label>
              <span>Sort</span>
              <input
                type="number"
                min="1"
                value={priority.prioritySort}
                onChange={(event) => void handleUpdate(priority, "prioritySort", event.target.value)}
              />
            </label>
            <button type="button" className="danger-button" onClick={() => void removePriority(priority.id)}>
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Builds new tasks once categories and priorities are available.
 */
function TaskComposer() {
  const { state, addTask } = useTodos();
  // Stores the editable task draft before it is submitted to the backend.
  const [draft, setDraft] = useState({
    taskName: "",
    taskSort: "1",
    dueDt: "",
    todoCategoryId: "",
    todoPriorityId: "",
    isCompleted: false,
    isArchived: false,
  });

  useEffect(() => {
    // Preselect the first available category and priority so task creation needs fewer manual steps.
    if (!draft.todoCategoryId && state.categories[0]) {
      setDraft((current) => ({ ...current, todoCategoryId: state.categories[0].id }));
    }
    if (!draft.todoPriorityId && state.priorities[0]) {
      setDraft((current) => ({ ...current, todoPriorityId: state.priorities[0].id }));
    }
  }, [draft.todoCategoryId, draft.todoPriorityId, state.categories, state.priorities]);

  /**
   * Creates a task from the current draft and resets the task-specific fields afterwards.
   */
  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from reloading when the form is submitted.
    event.preventDefault();
    await addTask({
      taskName: draft.taskName,
      taskSort: Number(draft.taskSort),
      dueDt: draft.dueDt,
      todoCategoryId: draft.todoCategoryId,
      todoPriorityId: draft.todoPriorityId,
      isCompleted: draft.isCompleted,
      isArchived: draft.isArchived,
    });
    setDraft((current) => ({
      ...current,
      taskName: "",
      taskSort: String(state.tasks.length + 2),
      dueDt: "",
      isCompleted: false,
      isArchived: false,
    }));
  }

  const isDisabled = state.categories.length === 0 || state.priorities.length === 0;

  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <h2>Task composer</h2>
        <p>Create tasks once categories and priorities are available.</p>
      </div>

      // Task creation is blocked until the related lookup entities exist.
      <form className="task-form" onSubmit={handleCreate}>
        <input
          placeholder="Task name"
          value={draft.taskName}
          onChange={(event) => setDraft((current) => ({ ...current, taskName: event.target.value }))}
          required
          disabled={isDisabled}
        />
        <input
          type="number"
          min="1"
          placeholder="Sort"
          value={draft.taskSort}
          onChange={(event) => setDraft((current) => ({ ...current, taskSort: event.target.value }))}
          required
          disabled={isDisabled}
        />
        <input
          type="datetime-local"
          value={draft.dueDt}
          onChange={(event) => setDraft((current) => ({ ...current, dueDt: event.target.value }))}
          disabled={isDisabled}
        />
        <select
          value={draft.todoCategoryId}
          onChange={(event) => setDraft((current) => ({ ...current, todoCategoryId: event.target.value }))}
          disabled={isDisabled}
        >
          {state.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </select>
        <select
          value={draft.todoPriorityId}
          onChange={(event) => setDraft((current) => ({ ...current, todoPriorityId: event.target.value }))}
          disabled={isDisabled}
        >
          {state.priorities.map((priority) => (
            <option key={priority.id} value={priority.id}>
              {priority.priorityName}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={draft.isCompleted}
            onChange={(event) => setDraft((current) => ({ ...current, isCompleted: event.target.checked }))}
            disabled={isDisabled}
          />
          <span>Completed</span>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={draft.isArchived}
            onChange={(event) => setDraft((current) => ({ ...current, isArchived: event.target.checked }))}
            disabled={isDisabled}
          />
          <span>Archived</span>
        </label>
        <button type="submit" disabled={isDisabled}>
          Add task
        </button>
      </form>
      {isDisabled ? <p className="panel-hint">Create at least one category and one priority before adding tasks.</p> : null}
    </section>
  );
}

/**
 * Renders either the active or archived task collection with inline edit controls.
 */
function TaskList({ title, tasks }: { title: string; tasks: TodoTask[] }) {
  const { state, saveTask, removeTask } = useTodos();

  /**
   * Persists a single inline task field edit back through the shared Todo context.
   */
  async function handleFieldChange(task: TodoTask, field: keyof TodoTask, value: string | boolean) {
    // Build the next version of the task locally before sending it through the shared context.
    const nextTask: TodoTask = {
      ...task,
      [field]:
        field === "taskSort"
          ? Number(value)
          : field === "dueDt"
            ? (value as string)
            : value,
    } as TodoTask;

    await saveTask(nextTask);
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <h2>{title}</h2>
        <p>Edit Todo entries inline. Changes are pushed directly back to the backend.</p>
      </div>

      // Every control here edits the live backend entity through the shared Todo context.
      <div className="entity-list">
        {tasks.map((task) => (
          <article key={task.id} className="entity-card task-card">
            <label>
              <span>Task</span>
              <input value={task.taskName} onChange={(event) => void handleFieldChange(task, "taskName", event.target.value)} />
            </label>
            <label>
              <span>Sort</span>
              <input
                type="number"
                min="1"
                value={task.taskSort}
                onChange={(event) => void handleFieldChange(task, "taskSort", event.target.value)}
              />
            </label>
            <label>
              <span>Due</span>
              <input
                type="datetime-local"
                value={toDateTimeLocal(task.dueDt)}
                onChange={(event) => void handleFieldChange(task, "dueDt", event.target.value)}
              />
            </label>
            <label>
              <span>Category</span>
              <select value={task.todoCategoryId} onChange={(event) => void handleFieldChange(task, "todoCategoryId", event.target.value)}>
                {state.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select value={task.todoPriorityId} onChange={(event) => void handleFieldChange(task, "todoPriorityId", event.target.value)}>
                {state.priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.priorityName}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={(event) => void handleFieldChange(task, "isCompleted", event.target.checked)}
              />
              <span>Completed</span>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={task.isArchived}
                onChange={(event) => void handleFieldChange(task, "isArchived", event.target.checked)}
              />
              <span>Archived</span>
            </label>
            <button type="button" className="danger-button" onClick={() => void removeTask(task.id)}>
              Delete
            </button>
          </article>
        ))}
        {tasks.length === 0 ? <p className="panel-hint">No tasks in this view yet.</p> : null}
      </div>
    </section>
  );
}

/**
 * Composes the protected Todo workspace and orchestrates the initial Todo data load.
 */
export function DashboardPage() {
  const { state: authState, fullName, logoutUser } = useAuth();
  const { state: todoState, loadAll, activeTasks, archivedTasks, clearAll } = useTodos();

  useEffect(() => {
    // Load the full Todo dataset once the protected dashboard mounts.
    void loadAll();
  }, []);

  /**
   * Clears Todo state first so no private data lingers locally after the session is removed.
   */
  function handleLogout() {
    // Clear domain data first, then remove the auth session so protected content disappears cleanly.
    clearAll();
    logoutUser();
  }

  return (
    <main className="dashboard-layout">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Assignment 5</p>
          <h1>React Todo dashboard</h1>
          <p>
            This React app uses Context, reducers, protected routes, bearer auth, and refresh-token renewal against the
            TalTech backend.
          </p>
        </div>
        <div className="hero-actions">
          <div className="session-card">
            <strong>{fullName || "Authenticated user"}</strong>
            <span>{authState.session?.email}</span>
          </div>
          <a className="button-link button-link-ghost" href="https://mpotap.proxy.itcollege.ee/">
            Back to main page
          </a>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>

      <section className="status-strip">
        <span>{todoState.isLoading ? "Loading Todo data..." : "Todo data loaded from the API."}</span>
        <span>{activeTasks.length} active tasks</span>
        <span>{archivedTasks.length} archived tasks</span>
        <span>JWT + refresh-token session handling</span>
      </section>

      {todoState.error ? <p className="form-error dashboard-error">{todoState.error}</p> : null}

      <div className="dashboard-grid">
        <CategorySection />
        <PrioritySection />
        <TaskComposer />
        <TaskList title="Active tasks" tasks={activeTasks} />
        <TaskList title="Archived tasks" tasks={archivedTasks} />
      </div>
    </main>
  );
}

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";

import { useTodoStore } from "@/stores/todos";

/** Exposes Todo collections and CRUD actions for the protected dashboard. */
const todoStore = useTodoStore();

/** Stores the editable category form fields before a category is created. */
const categoryForm = reactive({
  categoryName: "",
  categorySort: 0,
  tag: "",
});

/** Stores the editable priority form fields before a priority is created. */
const priorityForm = reactive({
  priorityName: "",
  prioritySort: 0,
});

/** Stores the editable task form fields before a task is created. */
const taskForm = reactive({
  taskName: "",
  taskSort: 0,
  dueDt: "",
  todoCategoryId: "",
  todoPriorityId: "",
  isCompleted: false,
  isArchived: false,
});

/** Enables task creation only after both required foreign-key selections are made. */
const canCreateTask = computed(() => Boolean(taskForm.todoCategoryId && taskForm.todoPriorityId));

onMounted(async () => {
  await todoStore.loadAll();

  // After the first load, preselect the first available category to reduce required clicks.
  if (!taskForm.todoCategoryId && todoStore.categories[0]) {
    taskForm.todoCategoryId = todoStore.categories[0].id;
  }

  // Do the same for priorities so the task form becomes usable immediately.
  if (!taskForm.todoPriorityId && todoStore.priorities[0]) {
    taskForm.todoPriorityId = todoStore.priorities[0].id;
  }
});

/**
 * Creates a category from the form and keeps the category select ready for the next task.
 */
async function submitCategory() {
  await todoStore.addCategory({ ...categoryForm });
  // Reset the create form after a successful request so the user can add another category.
  categoryForm.categoryName = "";
  categoryForm.categorySort = todoStore.categories.length;
  categoryForm.tag = "";

  if (!taskForm.todoCategoryId && todoStore.categories[0]) {
    // If task creation had no category selected yet, use the newly available category list.
    taskForm.todoCategoryId = todoStore.categories[0].id;
  }
}

/**
 * Creates a priority from the form and updates the default task priority selection when needed.
 */
async function submitPriority() {
  await todoStore.addPriority({ ...priorityForm });
  priorityForm.priorityName = "";
  priorityForm.prioritySort = todoStore.priorities.length;

  if (!taskForm.todoPriorityId && todoStore.priorities[0]) {
    // If task creation had no priority selected yet, use the first available priority.
    taskForm.todoPriorityId = todoStore.priorities[0].id;
  }
}

/**
 * Creates a task and resets the form while preserving selected category and priority values.
 */
async function submitTask() {
  await todoStore.addTask({ ...taskForm });
  // Clear only the transient fields and keep selected relations for faster repeated entry.
  taskForm.taskName = "";
  taskForm.taskSort = todoStore.tasks.length;
  taskForm.dueDt = "";
  taskForm.isCompleted = false;
  taskForm.isArchived = false;
}

/**
 * Resolves a category name for task cards from the currently loaded category list.
 */
function categoryLabel(categoryId: string) {
  return todoStore.categories.find((item) => item.id === categoryId)?.categoryName ?? "Unknown";
}

/**
 * Resolves a priority name for task cards from the currently loaded priority list.
 */
function priorityLabel(priorityId: string) {
  return todoStore.priorities.find((item) => item.id === priorityId)?.priorityName ?? "Unknown";
}

/**
 * Formats API date strings into a readable local date/time label for the UI.
 */
function formatDate(value?: string | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString();
}

/**
 * Converts stored ISO dates into the local datetime-local input format expected by the browser.
 */
function dueDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  // datetime-local expects local time without timezone, so we offset the stored UTC value first.
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}
</script>

<template>
  <section class="dashboard">
    <div class="hero-panel">
      <div>
        <p class="eyebrow">Protected Workspace</p>
        <h2>JWT + refresh-token Todo client</h2>
        <p class="hero-copy">
          This Vue 3 app uses router guards, Pinia state, bearer auth, and refresh-token renewal against the TalTech backend.
        </p>
      </div>
      <div class="hero-stats">
        <article>
          <strong>{{ todoStore.activeTasks.length }}</strong>
          <span>Active tasks</span>
        </article>
        <article>
          <strong>{{ todoStore.categories.length }}</strong>
          <span>Categories</span>
        </article>
        <article>
          <strong>{{ todoStore.priorities.length }}</strong>
          <span>Priorities</span>
        </article>
      </div>
    </div>

    <p v-if="todoStore.error" class="message error">{{ todoStore.error }}</p>

    <div class="grid dashboard-grid">
      <section class="panel">
        <h3>Create category</h3>
        <form class="stack" @submit.prevent="submitCategory">
          <label class="field">
            <span>Name</span>
            <input v-model.trim="categoryForm.categoryName" required />
          </label>
          <label class="field">
            <span>Sort order</span>
            <input v-model.number="categoryForm.categorySort" type="number" min="0" required />
          </label>
          <label class="field">
            <span>Tag</span>
            <input v-model.trim="categoryForm.tag" />
          </label>
          <button class="button" type="submit">Add category</button>
        </form>

        <div class="list stack compact">
          <article v-for="category in todoStore.categories" :key="category.id" class="list-card">
            <div class="stack compact">
              <input v-model.trim="category.categoryName" />
              <div class="grid two-up">
                <input v-model.number="category.categorySort" type="number" min="0" />
                <input v-model.trim="category.tag" placeholder="Tag" />
              </div>
            </div>
            <div class="inline-actions">
              <button class="button small ghost" type="button" @click="todoStore.saveCategory(category)">Save</button>
              <button class="button small danger" type="button" @click="todoStore.removeCategory(category.id)">Delete</button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <h3>Create priority</h3>
        <form class="stack" @submit.prevent="submitPriority">
          <label class="field">
            <span>Name</span>
            <input v-model.trim="priorityForm.priorityName" required />
          </label>
          <label class="field">
            <span>Sort order</span>
            <input v-model.number="priorityForm.prioritySort" type="number" min="0" required />
          </label>
          <button class="button" type="submit">Add priority</button>
        </form>

        <div class="list stack compact">
          <article v-for="priority in todoStore.priorities" :key="priority.id" class="list-card">
            <div class="stack compact">
              <input v-model.trim="priority.priorityName" />
              <input v-model.number="priority.prioritySort" type="number" min="0" />
            </div>
            <div class="inline-actions">
              <button class="button small ghost" type="button" @click="todoStore.savePriority(priority)">Save</button>
              <button class="button small danger" type="button" @click="todoStore.removePriority(priority.id)">Delete</button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <section class="panel wide-panel">
      <h3>Create task</h3>
      <form class="grid task-form-grid" @submit.prevent="submitTask">
        <label class="field task-name-field">
          <span>Task name</span>
          <input v-model.trim="taskForm.taskName" required />
        </label>

        <label class="field task-category-field">
          <span>Category</span>
          <select v-model="taskForm.todoCategoryId" required>
            <option disabled value="">Select category</option>
            <option v-for="category in todoStore.categories" :key="category.id" :value="category.id">
              {{ category.categoryName }}
            </option>
          </select>
        </label>

        <label class="field task-priority-field">
          <span>Priority</span>
          <select v-model="taskForm.todoPriorityId" required>
            <option disabled value="">Select priority</option>
            <option v-for="priority in todoStore.priorities" :key="priority.id" :value="priority.id">
              {{ priority.priorityName }}
            </option>
          </select>
        </label>

        <label class="field task-sort-field">
          <span>Sort order</span>
          <input v-model.number="taskForm.taskSort" type="number" min="0" required />
        </label>

        <label class="field task-due-field">
          <span>Due date</span>
          <input v-model="taskForm.dueDt" type="datetime-local" />
        </label>

        <label class="field checkbox-field task-completed-field">
          <input v-model="taskForm.isCompleted" type="checkbox" />
          <span>Completed</span>
        </label>

        <label class="field checkbox-field task-archived-field">
          <input v-model="taskForm.isArchived" type="checkbox" />
          <span>Archived</span>
        </label>

        <button class="button task-submit-button" type="submit" :disabled="!canCreateTask">Add task</button>
      </form>
    </section>

    <div class="grid dashboard-grid">
      <section class="panel">
        <h3>Active tasks</h3>
        <div class="list stack">
          <article v-for="task in todoStore.activeTasks" :key="task.id" class="list-card">
            <div class="stack compact">
              <input v-model.trim="task.taskName" />
              <div class="grid two-up">
                <select v-model="task.todoCategoryId">
                  <option v-for="category in todoStore.categories" :key="category.id" :value="category.id">
                    {{ category.categoryName }}
                  </option>
                </select>
                <select v-model="task.todoPriorityId">
                  <option v-for="priority in todoStore.priorities" :key="priority.id" :value="priority.id">
                    {{ priority.priorityName }}
                  </option>
                </select>
              </div>
              <div class="grid two-up">
                <input v-model.number="task.taskSort" type="number" min="0" />
                <input
                  :value="dueDateInputValue(task.dueDt)"
                  type="datetime-local"
                  @input="task.dueDt = ($event.target as HTMLInputElement).value"
                />
              </div>
              <div class="inline-meta">
                <label class="checkbox-inline">
                  <input v-model="task.isCompleted" type="checkbox" />
                  <span>Completed</span>
                </label>
                <label class="checkbox-inline">
                  <input v-model="task.isArchived" type="checkbox" />
                  <span>Archived</span>
                </label>
              </div>
              <small>{{ categoryLabel(task.todoCategoryId) }} | {{ priorityLabel(task.todoPriorityId) }} | {{ formatDate(task.dueDt) }}</small>
            </div>
            <div class="inline-actions">
              <button class="button small ghost" type="button" @click="todoStore.saveTask(task)">Save</button>
              <button class="button small danger" type="button" @click="todoStore.removeTask(task.id)">Delete</button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <h3>Archived tasks</h3>
        <div class="list stack">
          <article v-for="task in todoStore.archivedTasks" :key="task.id" class="list-card muted">
            <div class="stack compact">
              <strong>{{ task.taskName }}</strong>
              <small>{{ categoryLabel(task.todoCategoryId) }} | {{ priorityLabel(task.todoPriorityId) }}</small>
              <small>{{ formatDate(task.dueDt) }}</small>
            </div>
            <div class="inline-actions">
              <button class="button small ghost" type="button" @click="todoStore.saveTask({ ...task, isArchived: false })">
                Restore
              </button>
              <button class="button small danger" type="button" @click="todoStore.removeTask(task.id)">Delete</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";

import { useTodoStore } from "@/stores/todos";

const todoStore = useTodoStore();

const categoryForm = reactive({
  categoryName: "",
  categorySort: 0,
  tag: "",
});

const priorityForm = reactive({
  priorityName: "",
  prioritySort: 0,
  tag: "",
});

const taskForm = reactive({
  taskName: "",
  taskSort: 0,
  dueDt: "",
  todoCategoryId: "",
  todoPriorityId: "",
  isCompleted: false,
  isArchived: false,
});

const canCreateTask = computed(() => Boolean(taskForm.todoCategoryId && taskForm.todoPriorityId));

onMounted(async () => {
  await todoStore.loadAll();

  if (!taskForm.todoCategoryId && todoStore.categories[0]) {
    taskForm.todoCategoryId = todoStore.categories[0].id;
  }

  if (!taskForm.todoPriorityId && todoStore.priorities[0]) {
    taskForm.todoPriorityId = todoStore.priorities[0].id;
  }
});

async function submitCategory() {
  await todoStore.addCategory({ ...categoryForm });
  categoryForm.categoryName = "";
  categoryForm.categorySort = todoStore.categories.length;
  categoryForm.tag = "";

  if (!taskForm.todoCategoryId && todoStore.categories[0]) {
    taskForm.todoCategoryId = todoStore.categories[0].id;
  }
}

async function submitPriority() {
  await todoStore.addPriority({ ...priorityForm });
  priorityForm.priorityName = "";
  priorityForm.prioritySort = todoStore.priorities.length;
  priorityForm.tag = "";

  if (!taskForm.todoPriorityId && todoStore.priorities[0]) {
    taskForm.todoPriorityId = todoStore.priorities[0].id;
  }
}

async function submitTask() {
  await todoStore.addTask({ ...taskForm });
  taskForm.taskName = "";
  taskForm.taskSort = todoStore.tasks.length;
  taskForm.dueDt = "";
  taskForm.isCompleted = false;
  taskForm.isArchived = false;
}

function categoryLabel(categoryId: string) {
  return todoStore.categories.find((item) => item.id === categoryId)?.categoryName ?? "Unknown";
}

function priorityLabel(priorityId: string) {
  return todoStore.priorities.find((item) => item.id === priorityId)?.priorityName ?? "Unknown";
}

function formatDate(value?: string | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString();
}

function dueDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
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
          <label class="field">
            <span>Tag</span>
            <input v-model.trim="priorityForm.tag" />
          </label>
          <button class="button" type="submit">Add priority</button>
        </form>

        <div class="list stack compact">
          <article v-for="priority in todoStore.priorities" :key="priority.id" class="list-card">
            <div class="stack compact">
              <input v-model.trim="priority.priorityName" />
              <div class="grid two-up">
                <input v-model.number="priority.prioritySort" type="number" min="0" />
                <input v-model.trim="priority.tag" placeholder="Tag" />
              </div>
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
              <small>
                {{ categoryLabel(task.todoCategoryId) }} · {{ priorityLabel(task.todoPriorityId) }} · {{ formatDate(task.dueDt) }}
              </small>
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
              <small>{{ categoryLabel(task.todoCategoryId) }} · {{ priorityLabel(task.todoPriorityId) }}</small>
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

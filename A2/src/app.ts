import {
  addCategory,
  addTask,
  categoryStats,
  deleteCategory,
  deleteTask,
  getStatistics,
  listCategories,
  listTasks,
  searchTasks,
  updateCategory,
  updateTask
} from './taskService.js';
import type { Priority, SortField, SortOrder, TaskFilters, TaskStatus } from './models.js';

// UI elements
const input = document.getElementById('commandInput') as HTMLInputElement | null;
const output = document.getElementById('output') as HTMLPreElement | null;
const btn = document.getElementById('runBtn') as HTMLButtonElement | null;

const addBtn = document.getElementById('addBtn') as HTMLButtonElement | null;

function print(data: unknown): void {
  if (!output) return;
  if (typeof data === 'string') output.textContent = data;
  else output.textContent = JSON.stringify(data, null, 2);
}

function toCsvArray(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function parseKeyValueArgs(raw: string): Record<string, string> {
  // Supports: key=value, key="value with spaces"
  const args: Record<string, string> = {};
  const re = /(\w+)=("[^"]*"|\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const key = m[1];
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    args[key] = value;
  }
  return args;
}

async function handleFormAdd(): Promise<void> {
  try {
    const title = (document.getElementById('titleInput') as HTMLInputElement | null)?.value.trim() ?? '';
    const description = (document.getElementById('descInput') as HTMLInputElement | null)?.value.trim() ?? '';
    const status = (document.getElementById('statusInput') as HTMLSelectElement | null)?.value as TaskStatus | undefined;
    const priority = (document.getElementById('priorityInput') as HTMLSelectElement | null)?.value as Priority | undefined;
    const dueDate = (document.getElementById('dateInput') as HTMLInputElement | null)?.value ?? '';
    const tagsRaw = (document.getElementById('tagsInput') as HTMLInputElement | null)?.value ?? '';
    const categoryId = (document.getElementById('categoryInput') as HTMLInputElement | null)?.value.trim() || undefined;
    const depsRaw = (document.getElementById('depsInput') as HTMLInputElement | null)?.value ?? '';
    const recurRaw = (document.getElementById('recurInput') as HTMLInputElement | null)?.value ?? '';

    const task = await addTask({
      title,
      description,
      status,
      priority,
      dueDate,
      tags: toCsvArray(tagsRaw),
      categoryId,
      dependencies: toCsvArray(depsRaw),
      recurrence: recurRaw
    });

    print(`Added task ${task.id}`);
  } catch (err: unknown) {
    print(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

addBtn?.addEventListener('click', () => {
  void handleFormAdd();
});

btn?.addEventListener('click', () => {
  void handleCommand();
});

async function handleCommand(): Promise<void> {
  const cmd = (input?.value ?? '').trim();
  if (!cmd) {
    print('Enter a command');
    return;
  }

  try {
    // ---- categories ----
    if (cmd.startsWith('cat ')) {
      const rest = cmd.slice(4).trim();

      if (rest === 'list') {
        const cats = await listCategories();
        print(cats.length ? cats : 'No categories');
        return;
      }

      if (rest === 'stats') {
        const s = await categoryStats();
        print(s);
        return;
      }

      if (rest.startsWith('add ')) {
        const args = parseKeyValueArgs(rest.slice(4));
        const name = args.name ?? '';
        const priorities = args.priorities ? (toCsvArray(args.priorities) as Priority[]) : undefined;
        const cat = await addCategory({ name, allowedPriorities: priorities });
        print({ message: 'Added category', id: cat.id, name: cat.name, allowedPriorities: cat.allowedPriorities });
        return;
      }

      if (rest.startsWith('update ')) {
        const after = rest.slice(7).trim();
        const [id, ...tail] = after.split(' ');
        const args = parseKeyValueArgs(tail.join(' '));
        const patch: any = {};
        if (args.name) patch.name = args.name;
        if (args.priorities) patch.allowedPriorities = toCsvArray(args.priorities) as Priority[];
        const cat = await updateCategory(id, patch);
        print({ message: 'Updated category', cat });
        return;
      }

      if (rest.startsWith('delete ')) {
        const id = rest.split(' ')[1];
        await deleteCategory(id);
        print(`Deleted category ${id}`);
        return;
      }

      print('Unknown category command. Try: cat list | cat add name="Work" priorities=low,medium | cat update <id> ... | cat delete <id> | cat stats');
      return;
    }

    // ---- stats ----
    if (cmd === 'stats') {
      const stats = await getStatistics();
      print(stats);
      return;
    }

    // ---- list with optional filters/sort ----
    if (cmd === 'list' || cmd.startsWith('list ')) {
      const args = cmd === 'list' ? {} : parseKeyValueArgs(cmd.slice(5));
      const filters: TaskFilters = {};
      if (args.status) filters.status = args.status as TaskStatus;
      if (args.priority) filters.priority = args.priority as Priority;
      if (args.tag) filters.tag = args.tag;
      if (args.category) filters.categoryId = args.category;
      if (args.overdue) filters.overdue = args.overdue === 'true' || args.overdue === '1';

      const sortField = (args.sort as SortField | undefined) ?? undefined;
      const sortOrder = (args.order as SortOrder | undefined) ?? 'asc';

      const tasks = await listTasks(Object.keys(filters).length ? filters : undefined, sortField ? { field: sortField, order: sortOrder } : undefined);
      print(tasks.length ? tasks : 'No tasks found');
      return;
    }

    // ---- add via command ----
    if (cmd.startsWith('add ')) {
      const args = parseKeyValueArgs(cmd.slice(4));
      const title = args.title ?? cmd.slice(4).trim();
      const task = await addTask({
        title,
        description: args.desc,
        status: args.status as TaskStatus | undefined,
        priority: args.priority as Priority | undefined,
        dueDate: args.due,
        tags: args.tags ? toCsvArray(args.tags) : undefined,
        categoryId: args.category,
        dependencies: args.deps ? toCsvArray(args.deps) : undefined,
        recurrence: args.recur
      });
      print(`Added task ${task.id}`);
      return;
    }

    // ---- delete ----
    if (cmd.startsWith('delete ')) {
      const id = cmd.split(' ')[1];
      await deleteTask(id);
      print(`Deleted ${id}`);
      return;
    }

    // ---- update ----
    if (cmd.startsWith('update ')) {
      const after = cmd.slice(7).trim();
      const [id, ...tail] = after.split(' ');
      const args = parseKeyValueArgs(tail.join(' '));

      const patch: any = {};
      if (args.title) patch.title = args.title;
      if (args.desc) patch.description = args.desc;
      if (args.status) patch.status = args.status as TaskStatus;
      if (args.priority) patch.priority = args.priority as Priority;
      if (args.due !== undefined) patch.dueDate = args.due;
      if (args.tags) patch.tags = toCsvArray(args.tags);
      if (args.category) patch.categoryId = args.category;
      if (args.category === 'null') patch.categoryId = null;
      if (args.deps) patch.dependencies = toCsvArray(args.deps);
      if (args.recur) patch.recurrence = args.recur;
      if (args.recur === 'null') patch.recurrence = null;

      const updated = await updateTask(id, patch);
      print({ message: 'Updated', task: updated });
      return;
    }

    // ---- search ----
    if (cmd.startsWith('search ')) {
      const q = cmd.slice(7).trim();
      const results = await searchTasks(q);
      print(results.length ? results : 'No matches');
      return;
    }

    print('Unknown command. Try: list, add, update, delete, search, stats, cat ...');
  } catch (err: unknown) {
    print(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

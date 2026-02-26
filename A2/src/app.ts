import {
  addTask,
  deleteTask,
  listTasks,
  searchTasks,
  updateTask
} from './taskService.js';

import type {
  Priority,
  SortField,
  SortOrder,
  TaskStatus
} from './models.js';

// get UI elements
const input = document.getElementById('commandInput') as HTMLInputElement | null;
const output = document.getElementById('output') as HTMLPreElement | null;
const btn = document.getElementById('runBtn') as HTMLButtonElement | null;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement | null;

async function handleFormAdd(): Promise<void> {
  try {
    const title =
      (document.getElementById('titleInput') as HTMLInputElement | null)?.value.trim() ?? '';
    const description =
      (document.getElementById('descInput') as HTMLInputElement | null)?.value.trim() ?? '';
    const status =
      (document.getElementById('statusInput') as HTMLSelectElement | null)?.value as TaskStatus | undefined;
    const priority =
      (document.getElementById('priorityInput') as HTMLSelectElement | null)?.value as Priority | undefined;
    const dueDate =
      (document.getElementById('dateInput') as HTMLInputElement | null)?.value ?? '';
    const tagsRaw =
      (document.getElementById('tagsInput') as HTMLInputElement | null)?.value ?? '';
    const task = await addTask({
      title,
      description,
      status,
      priority,
      dueDate,
      tags: toCsvArray(tagsRaw)
    });
    print(`Added task ${task.id}`);
  } catch(err: unknown){
    print(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

addBtn?.addEventListener('click', () => {
  void handleFormAdd();
});

// helper to print
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
  // supports: key=value, key="value with spaces"
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

// button click handler
btn?.addEventListener('click',()=>{
 void handleCommand();
});

async function handleCommand(): Promise<void> {
  const cmd = (input?.value ?? '').trim();
  if (!cmd) {
    print('Enter a command');
    return;
  }
  try {

    // ----- ADD TASK -----

    if (cmd.startsWith('add ')) {
      const args = parseKeyValueArgs(cmd.slice(4));
      const title =
        args.title ?? cmd.slice(4).trim();
      const task = await addTask({
        title,
        description: args.desc,
        status: args.status as TaskStatus | undefined,
        priority: args.priority as Priority | undefined,
        dueDate: args.due,
        tags:
          args.tags
            ? toCsvArray(args.tags)
            : undefined,
      });
      print(`Added task ${task.id}`);
      return;
    }


    // ----- DELETE -----

    if (cmd.startsWith('delete ')) {
      const id = cmd.split(' ')[1];
      await deleteTask(id);
      print(`Deleted ${id}`);
      return;
    }


    // ----- SEARCH -----

    if (cmd.startsWith('search ')) {
      const results =
        await searchTasks(cmd.slice(7).trim());
      print(results.length ? results : 'No matches');
      return;
    }


    // ----- LIST -----

    if (cmd === 'list' || cmd.startsWith('list ')) {
      return;
    }
    print('Unknown command');
  }
  catch (err: unknown) {
    print(
      `Error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
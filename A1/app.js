import {
  addTask,
  listTasks,
  deleteTask,
  updateTask,
  searchTasks,
  filterTasks
} from "./taskService.js";

// get UI elements
const input = document.getElementById("commandInput");
const output = document.getElementById("output");
const btn = document.getElementById("runBtn");
const addBtn = document.getElementById("addBtn");

function getErrorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

function print(data) {
  if (!output) return;

  if (typeof data === "string") {
    output.textContent = data;
  } else {
    output.textContent = JSON.stringify(data, null, 2);
  }
}

function toCsvArray(raw) {
  return raw
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function parseKeyValueArgs(raw) {
  const args = {};
  const re = /(\w+)=("[^"]*"|\S+)/g;
  let match;

  while ((match = re.exec(raw)) !== null) {
    const key = match[1];
    let value = match[2];

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    args[key] = value;
  }

  return args;
}

function getFormTaskData() {
  const titleInput = document.getElementById("titleInput");
  const descInput = document.getElementById("descInput");
  const statusInput = document.getElementById("statusInput");
  const priorityInput = document.getElementById("priorityInput");
  const dateInput = document.getElementById("dateInput");
  const tagsInput = document.getElementById("tagsInput");

  if (!titleInput || !descInput || !statusInput || !priorityInput || !dateInput || !tagsInput) {
    throw new Error("Task form is not available");
  }

  return {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    status: statusInput.value,
    priority: priorityInput.value,
    dueDate: dateInput.value,
    tags: toCsvArray(tagsInput.value)
  };
}

async function handleFormAdd() {
  try {
    const task = await addTask(getFormTaskData());
    print(`Added task ${task.id}`);
  } catch (err) {
    print(`Error: ${getErrorMessage(err)}`);
  }
}

async function handleCommand() {
  if (!input) {
    print("Command input is not available");
    return;
  }

  const cmd = input.value.trim();

  if (!cmd) {
    print("Enter a command");
    return;
  }

  try {

    // LIST
    if (cmd === "list") {
      const tasks = await listTasks();
      print(tasks.length ? tasks : "No tasks found");
      return;
    }

    // ADD
    if (cmd.startsWith("add ")) {
      const args = parseKeyValueArgs(cmd.slice(4));
      const plainTitle = cmd.slice(4).trim();
      const task = await addTask({
        title: args.title || plainTitle,
        description: args.desc || "",
        status: args.status,
        priority: args.priority,
        dueDate: args.dueDate || "",
        tags: args.tags ? toCsvArray(args.tags) : []
      });
      print(`Added task ${task.id}`);
      return;
    }

    // DELETE
    if (cmd.startsWith("delete ")) {
      const id = cmd.split(" ")[1];
      await deleteTask(id);
      print(`Deleted ${id}`);
      return;
    }

    // UPDATE
    if (cmd.startsWith("update ")) {
      const body = cmd.slice(7).trim();
      const [id, ...rest] = body.split(" ");
      const rawUpdates = rest.join(" ").trim();
      const args = parseKeyValueArgs(rawUpdates);
      let updates = {};

      if (Object.keys(args).length > 0) {
        updates = {
          ...(args.title !== undefined ? { title: args.title } : {}),
          ...(args.desc !== undefined ? { description: args.desc } : {}),
          ...(args.status !== undefined ? { status: args.status } : {}),
          ...(args.priority !== undefined ? { priority: args.priority } : {}),
          ...(args.dueDate !== undefined ? { dueDate: args.dueDate } : {}),
          ...(args.tags !== undefined ? { tags: toCsvArray(args.tags) } : {})
        };
      } else {
        updates = { title: rawUpdates };
      }

      const updated = await updateTask(id, updates);
      print(updated);
      return;
    }

    // SEARCH
    if (cmd.startsWith("search ")) {
      const q = cmd.slice(7).trim();
      const results = await searchTasks(q);
      print(results.length ? results : "No matches found");
      return;
    }

    // FILTER
    if (cmd.startsWith("filter ")) {
      const parts = parseKeyValueArgs(cmd.slice(7));
      const filters = {
        ...(parts.status ? { status: parts.status } : {}),
        ...(parts.priority ? { priority: parts.priority } : {}),
        ...(parts.tag ? { tag: parts.tag } : {}),
        ...(parts.dueDate ? { dueDate: parts.dueDate } : {})
      };

      const results = await filterTasks(filters);
      print(results.length ? results : "No tasks match filter");
      return;
    }

    // UNKNOWN COMMAND
    print("Unknown command");
  } catch (err) {
    print(`Error: ${getErrorMessage(err)}`);
  }
}

if (addBtn) {
  addBtn.addEventListener("click", () => {
    void handleFormAdd();
  });
}

if (btn) {
  btn.addEventListener("click", () => {
    void handleCommand();
  });
}

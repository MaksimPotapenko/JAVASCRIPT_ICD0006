import { addTask, listTasks } from "./taskService.js";

// get UI elements
const input = document.getElementById("commandInput");
const output = document.getElementById("output");
const btn = document.getElementById("runBtn");

// helper to print
function print(data) {
  if (typeof data === "string") {
    output.textContent = data;
  } else {
    output.textContent = JSON.stringify(data, null, 2);
  }
}

// button click handler
btn.addEventListener("click", async () => {
  const cmd = input.value.trim();

  try {
    // ADD COMMAND
    if (cmd.startsWith("add ")) {
      const title = cmd.slice(4).trim();

      if (!title) {
        print("Title required");
        return;
      }

      const task = await addTask(title);
      print(`Added task with id ${task.id}`);
      return;
    }

    // LIST COMMAND
    if (cmd === "list") {
      const tasks = await listTasks();

      if (tasks.length === 0) {
        print("No tasks found");
      } else {
        print(tasks);
      }
      return;
    }

    // UNKNOWN COMMAND
    print("Unknown command");
  } catch (err) {
    print("Error: " + err.message);
  }
});

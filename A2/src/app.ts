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

addBtn.addEventListener("click", async () => {
  try {
    const taskData = {
      title: document.getElementById("titleInput").value.trim(),
      description: document.getElementById("descInput").value.trim(),
      status: document.getElementById("statusInput").value,
      priority: document.getElementById("priorityInput").value,
      dueDate: document.getElementById("dateInput").value,
      tags: document.getElementById("tagsInput").value
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
    };

    const task = await addTask(taskData);
    print("Added task " + task.id);
  } catch (err) {
    print("Error: " + err.message);
  }
});

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

    // DELETE
    if (cmd.startsWith("delete ")) {
      const id = cmd.split(" ")[1];
      await deleteTask(id);
      print("Deleted " + id);
      return;
    }

    // UPDATE
    if (cmd.startsWith("update ")) {
      const parts = cmd.split(" ");
      const id = parts[1];
      const newTitle = parts.slice(2).join(" ");

      const updated = await updateTask(id, { title: newTitle });
      print("Updated: " + updated.id);
      return;
    }

    // SEARCH
    if (cmd.startsWith("search ")) {
      const q = cmd.slice(7).trim();
      const results = await searchTasks(q);

      if (results.length === 0) {
        print("No matches found");
      } else {
        print(results);
      }
      return;
    }

    // FILTER
    if (cmd.startsWith("filter ")) {
      const parts = cmd.slice(7).split(" ");
      const filters = {};

      parts.forEach(p => {
        const [key, value] = p.split("=");
        if (key && value) {
          filters[key] = value;
        }
      });

      const results = await filterTasks(filters);

      if (results.length === 0) {
        print("No tasks match filter");
      } else {
        print(results);
      }

      return;
    }

    // UNKNOWN COMMAND
    print("Unknown command");
  } catch (err) {
    print("Error: " + err.message);
  }
});

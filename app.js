import { loadTasks } from "./storage.js";

loadTasks().then(tasks => {
  console.log("Loaded:", tasks.length);
});

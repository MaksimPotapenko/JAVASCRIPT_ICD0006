const KEY = "tasks";

function assertStorageAvailable() {
  const testKey = "__task_manager_test__";

  try {
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
  } catch {
    throw new Error("localStorage is not available in this browser");
  }
}

export async function loadTasks() {
  assertStorageAvailable();

  const raw = localStorage.getItem(KEY);

  if (raw === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error("Stored task data is corrupted");
  }
}

export async function saveTasks(tasks) {
  assertStorageAvailable();
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

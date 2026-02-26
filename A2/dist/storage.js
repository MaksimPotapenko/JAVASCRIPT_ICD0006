const KEY = "tasks";
export async function loadTasks() {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
}
export async function saveTasks(tasks) {
    localStorage.setItem(KEY, JSON.stringify(tasks));
}

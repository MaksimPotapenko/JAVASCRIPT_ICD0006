import { addTask, deleteTask, searchTasks } from './taskService.js';
// get UI elements
const input = document.getElementById('commandInput');
const output = document.getElementById('output');
const btn = document.getElementById('runBtn');
const addBtn = document.getElementById('addBtn');
async function handleFormAdd() {
    try {
        const title = document.getElementById('titleInput')?.value.trim() ?? '';
        const description = document.getElementById('descInput')?.value.trim() ?? '';
        const status = document.getElementById('statusInput')?.value;
        const priority = document.getElementById('priorityInput')?.value;
        const dueDate = document.getElementById('dateInput')?.value ?? '';
        const tagsRaw = document.getElementById('tagsInput')?.value ?? '';
        const task = await addTask({
            title,
            description,
            status,
            priority,
            dueDate,
            tags: toCsvArray(tagsRaw)
        });
        print(`Added task ${task.id}`);
    }
    catch (err) {
        print(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
}
addBtn?.addEventListener('click', () => {
    void handleFormAdd();
});
// helper to print
function print(data) {
    if (!output)
        return;
    if (typeof data === 'string')
        output.textContent = data;
    else
        output.textContent = JSON.stringify(data, null, 2);
}
function toCsvArray(raw) {
    return raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}
function parseKeyValueArgs(raw) {
    // supports: key=value, key="value with spaces"
    const args = {};
    const re = /(\w+)=("[^"]*"|\S+)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
        const key = m[1];
        let value = m[2];
        if (value.startsWith('"') && value.endsWith('"'))
            value = value.slice(1, -1);
        args[key] = value;
    }
    return args;
}
// button click handler
btn?.addEventListener('click', () => {
    void handleCommand();
});
async function handleCommand() {
    const cmd = (input?.value ?? '').trim();
    if (!cmd) {
        print('Enter a command');
        return;
    }
    try {
        // ----- ADD TASK -----
        if (cmd.startsWith('add ')) {
            const args = parseKeyValueArgs(cmd.slice(4));
            const title = args.title ?? cmd.slice(4).trim();
            const task = await addTask({
                title,
                description: args.desc,
                status: args.status,
                priority: args.priority,
                dueDate: args.due,
                tags: args.tags
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
            const results = await searchTasks(cmd.slice(7).trim());
            print(results.length ? results : 'No matches');
            return;
        }
        // ----- LIST -----
        if (cmd === 'list' || cmd.startsWith('list ')) {
            return;
        }
        print('Unknown command');
    }
    catch (err) {
        print(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
}

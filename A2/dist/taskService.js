import { loadCategories, loadTasks, saveCategories, saveTasks } from './storage.js';
import { addRecurrence, compareIsoDates, todayIso } from './utils/date.js';
import { groupBy, sortBy, uniqueBy } from './utils/generics.js';
import { assertIsoDateOrEmpty, assertNonEmptyString, assertPriority, assertStatus, parseRecurrence } from './utils/validation.js';
function makeId() {
    // Collision-resistant enough for a small local app
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function normalizeTags(tags) {
    if (!Array.isArray(tags))
        return [];
    return uniqueBy(tags
        .filter((t) => typeof t === 'string')
        .map(t => t.trim())
        .filter(Boolean), t => t.toLowerCase());
}
function isOverdue(task, today = todayIso()) {
    return task.dueDate !== '' && compareIsoDates(task.dueDate, today) < 0 && task.status !== 'done';
}
async function validateCategoryAndPriority(categoryId, priority) {
    if (!categoryId)
        return;
    const categories = await loadCategories();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat)
        throw new Error('Category not found');
    if (!cat.allowedPriorities.includes(priority)) {
        throw new Error(`Priority '${priority}' is not allowed for category '${cat.name}'`);
    }
}
export async function addTask(input) {
    assertNonEmptyString(input.title, 'title', 2);
    const status = input.status ?? 'todo';
    assertStatus(status);
    const priority = input.priority ?? 'medium';
    assertPriority(priority);
    const dueDate = input.dueDate ?? '';
    assertIsoDateOrEmpty(dueDate, 'dueDate');
    const dependencies = Array.isArray(input.dependencies)
        ? input.dependencies.filter((x) => typeof x === 'string').map(x => x.trim()).filter(Boolean)
        : [];
    const recurrence = parseRecurrence(input.recurrence);
    await validateCategoryAndPriority(input.categoryId, priority);
    const now = Date.now();
    const task = {
        id: makeId(),
        title: input.title.trim(),
        description: (input.description ?? '').trim(),
        status,
        priority,
        dueDate,
        tags: normalizeTags(input.tags),
        categoryId: input.categoryId || undefined,
        dependencies,
        recurrence,
        createdAt: now,
        updatedAt: now
    };
    const tasks = await loadTasks();
    // Validate dependencies exist (optional, but nicer UX)
    const allIds = new Set(tasks.map(t => t.id));
    const missing = dependencies.filter(d => !allIds.has(d));
    if (missing.length > 0) {
        throw new Error(`Dependency not found: ${missing.join(', ')}`);
    }
    tasks.push(task);
    await saveTasks(tasks);
    return task;
}
export async function listTasks(filters, sort) {
    const tasks = await loadTasks();
    const today = todayIso();
    let out = tasks;
    if (filters) {
        out = out.filter(t => {
            if (filters.status && t.status !== filters.status)
                return false;
            if (filters.priority && t.priority !== filters.priority)
                return false;
            if (filters.tag && !t.tags.includes(filters.tag))
                return false;
            if (filters.categoryId && t.categoryId !== filters.categoryId)
                return false;
            if (filters.overdue === true && !isOverdue(t, today))
                return false;
            return true;
        });
    }
    if (sort) {
        out = sortBy(out, t => {
            switch (sort.field) {
                case 'dueDate':
                    return t.dueDate || '9999-12-31';
                case 'priority':
                    return t.priority === 'high' ? 0 : t.priority === 'medium' ? 1 : 2;
                case 'status':
                    return t.status === 'todo' ? 0 : t.status === 'in-progress' ? 1 : 2;
                case 'title':
                    return t.title.toLowerCase();
                case 'createdAt':
                    return t.createdAt;
                case 'updatedAt':
                    return t.updatedAt;
                default: {
                    const exhaustive = sort.field;
                    return exhaustive;
                }
            }
        }, sort.order);
    }
    return out;
}
export async function deleteTask(id) {
    assertNonEmptyString(id, 'id', 1);
    const tasks = await loadTasks();
    const next = tasks.filter(t => t.id !== id);
    if (next.length === tasks.length)
        throw new Error('Task not found');
    // Remove from dependencies
    for (const t of next) {
        if (t.dependencies.includes(id)) {
            t.dependencies = t.dependencies.filter(d => d !== id);
            t.updatedAt = Date.now();
        }
    }
    await saveTasks(next);
}
export async function updateTask(id, patch) {
    assertNonEmptyString(id, 'id', 1);
    const tasks = await loadTasks();
    const task = tasks.find(t => t.id === id);
    if (!task)
        throw new Error('Task not found');
    if (patch.title !== undefined) {
        assertNonEmptyString(patch.title, 'title', 2);
        task.title = patch.title.trim();
    }
    if (patch.description !== undefined) {
        task.description = patch.description.trim();
    }
    if (patch.dueDate !== undefined) {
        assertIsoDateOrEmpty(patch.dueDate, 'dueDate');
        task.dueDate = patch.dueDate;
    }
    if (patch.priority !== undefined) {
        assertPriority(patch.priority);
        await validateCategoryAndPriority(patch.categoryId === null ? undefined : (patch.categoryId ?? task.categoryId), patch.priority);
        task.priority = patch.priority;
    }
    if (patch.categoryId !== undefined) {
        const nextCategoryId = patch.categoryId === null ? undefined : patch.categoryId;
        await validateCategoryAndPriority(nextCategoryId, task.priority);
        task.categoryId = nextCategoryId;
    }
    if (patch.tags !== undefined) {
        task.tags = normalizeTags(patch.tags);
    }
    if (patch.dependencies !== undefined) {
        task.dependencies = patch.dependencies.map(x => x.trim()).filter(Boolean);
        if (task.dependencies.includes(task.id))
            throw new Error('Task cannot depend on itself');
        const ids = new Set(tasks.map(t => t.id));
        const missing = task.dependencies.filter(d => !ids.has(d));
        if (missing.length > 0)
            throw new Error(`Dependency not found: ${missing.join(', ')}`);
    }
    if (patch.recurrence !== undefined) {
        if (patch.recurrence === null) {
            task.recurrence = undefined;
        }
        else {
            task.recurrence = parseRecurrence(patch.recurrence);
        }
    }
    if (patch.status !== undefined) {
        assertStatus(patch.status);
        // Dependency rule: cannot mark done unless deps are done
        if (patch.status === 'done' && task.dependencies.length > 0) {
            const deps = tasks.filter(t => task.dependencies.includes(t.id));
            const incomplete = deps.filter(d => d.status !== 'done');
            if (incomplete.length > 0) {
                throw new Error(`Cannot complete task. Incomplete dependencies: ${incomplete.map(t => t.id).join(', ')}`);
            }
        }
        // Only spawn next recurrence on a transition into done
        const wasDone = task.status === 'done';
        task.status = patch.status;
        if (!wasDone && patch.status === 'done' && task.recurrence) {
            const base = task.dueDate || todayIso();
            const nextDue = addRecurrence(base, task.recurrence);
            const end = task.recurrence.endDate;
            if (!end || compareIsoDates(nextDue, end) <= 0) {
                const seriesId = task.seriesId ?? task.id;
                // Prevent duplicates for same series + dueDate
                const alreadyExists = tasks.some(t => (t.seriesId ?? t.id) === seriesId && t.dueDate === nextDue);
                if (!alreadyExists) {
                    const now = Date.now();
                    const nextTask = {
                        ...task,
                        id: makeId(),
                        status: 'todo',
                        dueDate: nextDue,
                        seriesId,
                        createdAt: now,
                        updatedAt: now
                    };
                    tasks.push(nextTask);
                }
            }
        }
    }
    task.updatedAt = Date.now();
    await saveTasks(tasks);
    return task;
}
export async function searchTasks(query) {
    assertNonEmptyString(query, 'query', 1);
    const tasks = await loadTasks();
    const q = query.toLowerCase();
    return tasks.filter(t => {
        const hay = [t.title, t.description, t.tags.join(' ')].join(' ').toLowerCase();
        return hay.includes(q);
    });
}
export async function getStatistics() {
    const tasks = await loadTasks();
    const today = todayIso();
    const byStatus = {
        'todo': 0,
        'in-progress': 0,
        'done': 0
    };
    const byPriority = {
        'low': 0,
        'medium': 0,
        'high': 0
    };
    for (const t of tasks) {
        byStatus[t.status] += 1;
        byPriority[t.priority] += 1;
    }
    const overdue = tasks.filter(t => isOverdue(t, today)).length;
    const dueToday = tasks.filter(t => t.dueDate === today && t.status !== 'done').length;
    const total = tasks.length;
    const done = byStatus['done'];
    return {
        total,
        byStatus: byStatus,
        byPriority: byPriority,
        overdue,
        dueToday,
        completionRate: total === 0 ? 0 : done / total
    };
}
export async function addCategory(input) {
    assertNonEmptyString(input.name, 'name', 2);
    const allowed = (input.allowedPriorities ?? ['low', 'medium', 'high']).slice();
    for (const p of allowed)
        assertPriority(p);
    const now = Date.now();
    const category = {
        id: makeId(),
        name: input.name.trim(),
        allowedPriorities: uniqueBy(allowed, p => p),
        createdAt: now,
        updatedAt: now
    };
    const cats = await loadCategories();
    cats.push(category);
    await saveCategories(cats);
    return category;
}
export async function listCategories() {
    return await loadCategories();
}
export async function updateCategory(id, patch) {
    assertNonEmptyString(id, 'id', 1);
    const cats = await loadCategories();
    const cat = cats.find(c => c.id === id);
    if (!cat)
        throw new Error('Category not found');
    if (patch.name !== undefined) {
        assertNonEmptyString(patch.name, 'name', 2);
        cat.name = patch.name.trim();
    }
    if (patch.allowedPriorities !== undefined) {
        for (const p of patch.allowedPriorities)
            assertPriority(p);
        cat.allowedPriorities = uniqueBy(patch.allowedPriorities, p => p);
    }
    cat.updatedAt = Date.now();
    await saveCategories(cats);
    // Enforce relationship: tasks in this category must comply with allowed priorities
    const tasks = await loadTasks();
    const invalid = tasks.filter(t => t.categoryId === id && !cat.allowedPriorities.includes(t.priority));
    if (invalid.length > 0) {
        // Soft enforcement: downgrade invalid to the first allowed priority
        const fallback = cat.allowedPriorities[0];
        for (const t of invalid) {
            t.priority = fallback;
            t.updatedAt = Date.now();
        }
        await saveTasks(tasks);
    }
    return cat;
}
export async function deleteCategory(id) {
    assertNonEmptyString(id, 'id', 1);
    const cats = await loadCategories();
    const next = cats.filter(c => c.id !== id);
    if (next.length === cats.length)
        throw new Error('Category not found');
    await saveCategories(next);
    // Unassign category from tasks
    const tasks = await loadTasks();
    let changed = false;
    for (const t of tasks) {
        if (t.categoryId === id) {
            t.categoryId = undefined;
            t.updatedAt = Date.now();
            changed = true;
        }
    }
    if (changed)
        await saveTasks(tasks);
}
export async function categoryStats() {
    const [tasks, cats] = await Promise.all([loadTasks(), loadCategories()]);
    const byCat = groupBy(tasks.filter(t => t.categoryId), t => t.categoryId);
    const out = {};
    for (const cat of cats) {
        const tasksIn = byCat[cat.id] ?? [];
        const byP = { low: 0, medium: 0, high: 0 };
        for (const t of tasksIn)
            byP[t.priority] += 1;
        out[cat.name] = { total: tasksIn.length, byPriority: byP };
    }
    return out;
}

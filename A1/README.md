# Assignment 1: JavaScript Fundamentals

Browser-based task manager built with vanilla HTML, CSS, and JavaScript.

## Requirements Covered

- Pure JavaScript, no frameworks
- CRUD operations for tasks
- Browser storage via `localStorage`
- Task properties: `id`, `title`, `description`, `status`, `priority`, `dueDate`, `tags[]`
- Commands: `add`, `list`, `update`, `delete`, `filter`, `search`
- Async service/storage functions with error handling
- Input validation
- AI assistance evidence in `AI_codex.md`

## Project Files

- `index.html` - UI structure
- `styles.css` - page styling
- `app.js` - form handling, command parsing, output rendering
- `taskService.js` - CRUD logic, validation, search, filtering
- `storage.js` - `localStorage` adapter
- `AI_codex.md` - AI-assisted development notes
- `assigment_plan.md` - assignment planning notes

## How To Run

1. Open the `A1` folder.
2. Open `index.html` in a browser.
3. If ES modules are blocked by the browser, run a local static server and open the page through `http://localhost`.

Example local servers:

```bash
npx serve
```

or

```bash
python -m http.server
```

## Add Tasks From The Form

Fill in:

- Title
- Description
- Status
- Priority
- Due date
- Tags as comma-separated values

Then click `Add Task`.

## Command Usage

List all tasks:

```text
list
```

Add a task from the command bar:

```text
add title="Buy milk" desc="From the corner shop" status=todo priority=high dueDate=2026-03-20 tags=home,shopping
```

Update only selected fields:

```text
update <taskId> title="Buy oat milk" status=done tags=home,done
```

Delete a task:

```text
delete <taskId>
```

Search across title, description, status, priority, due date, and tags:

```text
search milk
```

Filter tasks:

```text
filter status=todo
filter priority=high
filter tag=home
filter dueDate=2026-03-20
```

## Validation Rules

- `title` must be at least 2 characters
- `status` must be one of `todo`, `in-progress`, `done`
- `priority` must be one of `low`, `medium`, `high`
- `dueDate` must be empty or `YYYY-MM-DD`
- `tags` are normalized into a unique string array

## Storage

- Tasks are stored in `localStorage`
- Storage key: `tasks`
- Data is saved as a JSON array
- Data remains after page reloads until browser storage is cleared

## Notes

- The async storage/service API is intentional even though `localStorage` is synchronous. It keeps the code aligned with the assignment and makes later migration easier.
- Output is shown as formatted JSON in the page for easy inspection during grading or defense.

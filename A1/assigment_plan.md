# Browser Task Manager – JavaScript Fundamentals Assignment

## Objective
Build a browser-based task management utility using pure JavaScript (no frameworks).
The application allows users to manage tasks locally in their browser with command-based interaction and persistent storage.

---

## Requirements Addressed

- No frameworks – Implemented using vanilla JavaScript, HTML, and CSS only.
- CRUD Operations – Create, Read, Update, Delete tasks.
- Browser Storage – Data stored using localStorage.
- Task Properties
  - id – unique identifier
  - title – short name (required)
  - description – optional text
  - status – todo | in-progress | done
  - priority – low | medium | high
  - dueDate – ISO format date (YYYY-MM-DD)
  - tags[] – array of labels
- Commands Implemented
  - add
  - list
  - update
  - delete
  - filter
  - search
- Async Operations – Storage operations wrapped in Promises.
- Error Handling – try/catch blocks and validation messages.
- Input Validation – Title length, valid status/priority values, date format checks.

---

## Features

- Command-based task management
- Persistent data across browser sessions
- Modular JavaScript structure
- JSON formatted output display
- Validation and user-friendly error messages
- Incremental Git commit history

---

## Project Structure

/project-root
  index.html
  styles.css
  app.js
  storage.js
  taskService.js
  commands.js
  /docs
    ai-log.md
  README.md

---

## File Descriptions

- index.html – User interface and command input
- styles.css – Basic layout styling
- app.js – UI logic and command execution
- storage.js – Async wrapper around browser storage
- taskService.js – CRUD logic, validation, and filtering
- commands.js – Command parsing and routing
- docs/ai-log.md – Record of AI assistance and prompts
- README.md – Documentation and usage guide

---

## How to Run

Option 1 – Direct Open
1. Download or clone the repository
2. Open the project folder
3. Double-click index.html
4. The application will open in your browser

Option 2 – Local Server (if modules are blocked)

Node.js:
npx serve

Python:
python -m http.server

Then open the displayed http://localhost link in your browser.

---

## Usage Instructions

All interaction is done through the command input box in the UI.

Add Task:
add Buy groceries

List Tasks:
list

Update Task:
update <taskId> New title

Delete Task:
delete <taskId>

Search Tasks:
search groceries

Filter Tasks:
filter status=todo
filter priority=high
filter tag=work

---

## Data Storage

- Uses localStorage
- Key name: tasks
- Data stored as JSON array
- Persists between browser sessions
- Clearing browser storage resets all tasks

---

## Validation Rules

- Title must contain at least 2 characters
- Status must be one of todo, in-progress, done
- Priority must be one of low, medium, high
- Due date must follow YYYY-MM-DD
- Tags must be text values

Invalid inputs trigger error messages instead of crashing the app.

---

## Error Handling

- All async operations use try/catch
- Prevents runtime crashes
- Handles missing IDs, invalid formats, and empty titles
- Displays readable error messages to the user

---

## Async Design

Although localStorage is synchronous, it is wrapped in Promises to:
- Simulate real asynchronous database behavior
- Meet assignment async requirements
- Allow easy migration to IndexedDB or APIs later

---

## Git Workflow

The repository demonstrates incremental development with multiple commits, including:
- Project initialization
- Storage implementation
- CRUD features
- Command system
- Search and filtering
- Validation and error handling
- Documentation updates

---

## AI-Assisted Development

AI tools were used for:
- Planning project architecture
- Designing validation logic
- Generating command parsing ideas
- Reviewing error-handling approaches

All prompts and summaries are recorded in:
/docs/ai-log.md

AI assistance was used as a reference and guide, while implementation, debugging, and integration were performed manually.

---

## Grading Criteria Alignment

Functionality – CRUD, filter, search, storage
Code Quality – Modular structure, readable logic
Error Handling – Validation + try/catch
Git Usage – Progressive commits
Documentation – README + AI log

---

## Future Improvements

- Visual task cards
- Drag-and-drop status changes
- IndexedDB storage option
- Import/export tasks
- UI themes

---

## Notes

This project demonstrates practical JavaScript fundamentals, modular design, and browser-based data persistence within a limited development timeframe.

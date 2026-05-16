import fs from "node:fs";
import path from "node:path";

import { DATA_FILE } from "../config/env.js";

// Provides the minimum JSON structure the backend expects for users and Todo entities.
const EMPTY_DB = {
  users: [],
  categories: [],
  priorities: [],
  tasks: [],
};

/**
 * Ensures the target data directory and JSON file exist before any read or write operation happens.
 */
function ensureDbFile() {
  const directory = path.dirname(DATA_FILE);
  // Create nested directories automatically so container volumes and fresh checkouts work the same way.
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    // Seed a brand-new JSON file with the empty database structure.
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
}

/**
 * Reads the JSON database and normalizes missing collections into empty arrays.
 */
export function readDb() {
  ensureDbFile();

  try {
    // Read and parse the entire JSON document because this backend uses a simple file-based store.
    const contents = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(contents);

    return {
      // Default missing collections so older or damaged files do not break route handlers.
      users: parsed.users ?? [],
      categories: parsed.categories ?? [],
      priorities: parsed.priorities ?? [],
      tasks: parsed.tasks ?? [],
    };
  } catch {
    // If parsing fails, recreate the file so the API can recover into a known-good empty state.
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
    return structuredClone(EMPTY_DB);
  }
}

/**
 * Rewrites the full JSON database with the latest in-memory state.
 */
export function writeDb(nextDb) {
  ensureDbFile();
  // The whole document is rewritten on each change because the dataset is intentionally small.
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextDb, null, 2));
}

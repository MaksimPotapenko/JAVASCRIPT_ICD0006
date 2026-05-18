import fs from "node:fs/promises";
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
async function ensureDbFile() {
  const directory = path.dirname(DATA_FILE);
  // Create nested directories automatically so container volumes and fresh checkouts work the same way.
  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    // Seed a brand-new JSON file with the empty database structure.
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
}

/**
 * Reads the JSON database and normalizes missing collections into empty arrays.
 */
export async function readDb() {
  await ensureDbFile();

  try {
    // Read and parse the entire JSON document because this backend uses a simple file-based store.
    const contents = await fs.readFile(DATA_FILE, "utf-8");
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
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
    return structuredClone(EMPTY_DB);
  }
}

/**
 * Rewrites the full JSON database with the latest in-memory state.
 */
export async function writeDb(nextDb) {
  await ensureDbFile();
  // The whole document is rewritten on each change because the dataset is intentionally small.
  await fs.writeFile(DATA_FILE, JSON.stringify(nextDb, null, 2));
}

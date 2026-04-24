import fs from "node:fs";
import path from "node:path";

import { DATA_FILE } from "../config/env.js";

const EMPTY_DB = {
  users: [],
  categories: [],
  priorities: [],
  tasks: [],
};

function ensureDbFile() {
  const directory = path.dirname(DATA_FILE);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
}

export function readDb() {
  ensureDbFile();

  try {
    const contents = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(contents);

    return {
      users: parsed.users ?? [],
      categories: parsed.categories ?? [],
      priorities: parsed.priorities ?? [],
      tasks: parsed.tasks ?? [],
    };
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
    return structuredClone(EMPTY_DB);
  }
}

export function writeDb(nextDb) {
  ensureDbFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextDb, null, 2));
}

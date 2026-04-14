import type { SessionState } from "@/types/api";

const STORAGE_KEY = "assignment4-session";

// Restores the saved session from localStorage and drops corrupted data if parsing fails.
export function readStoredSession(): SessionState | null {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as SessionState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// Persists the current session so auth survives a page refresh.
export function writeStoredSession(session: SessionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Removes the saved session from localStorage.
export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

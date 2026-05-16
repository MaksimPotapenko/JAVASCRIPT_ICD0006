import type { SessionState } from "@/types/api";

/**
 * Identifies the localStorage entry that persists the current auth session.
 */
const STORAGE_KEY = "assignment-5-auth-session";

/**
 * Restores the saved session from localStorage and drops corrupted data if parsing fails.
 */
export function readStoredSession(): SessionState | null {
  // The persisted session is optional, so missing storage simply means "guest mode".
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as SessionState;
  } catch {
    // Remove invalid JSON so the app does not keep failing on every page load.
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Persists the current session so auth survives a page refresh.
 */
export function writeStoredSession(session: SessionState) {
  // Persisting the whole session allows refresh-based auth to survive page reloads.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Removes the saved session from localStorage.
 */
export function clearStoredSession() {
  // Removing the stored session is the single source of truth for logging out locally.
  localStorage.removeItem(STORAGE_KEY);
}

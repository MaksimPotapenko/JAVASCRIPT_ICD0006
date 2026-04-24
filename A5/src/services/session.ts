import type { SessionState } from "@/types/api";

const STORAGE_KEY = "assignment-5-auth-session";

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

export function writeStoredSession(session: SessionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

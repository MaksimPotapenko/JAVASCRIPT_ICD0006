import type { AuthSession } from "@/types/nutikas";

const storageKey = "a7-nutikas-session";

export function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function writeStoredSession(session: AuthSession): void {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("a7-session-updated"));
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent("a7-session-updated"));
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = window.atob(normalized);
    return JSON.parse(parsed) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function extractRoles(token: string): string[] {
  const payload = decodeJwtPayload(token);
  const roleKeys = [
    "role",
    "roles",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  ];

  return roleKeys.flatMap((key) => {
    const value = payload[key];

    if (typeof value === "string") {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === "string");
    }

    return [];
  });
}

export function extractEmail(token: string): string | null {
  const payload = decodeJwtPayload(token);
  const keys = ["email", "unique_name", "sub"];

  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

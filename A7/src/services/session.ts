import type { AuthSession } from "@/types/nutikas";

// Keep the auth payload under one stable localStorage key for the whole app.
const storageKey = "a7-nutikas-session";

/**
 * Reads the persisted JWT session from localStorage, returning null if it is missing or invalid.
 */
export function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    // A missing localStorage entry simply means the user is currently anonymous.
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    // Broken JSON is cleared eagerly so the app can recover instead of crashing repeatedly.
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

/**
 * Persists the current session and notifies any listeners that auth state changed.
 */
export function writeStoredSession(session: AuthSession): void {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
  // Stores and router guards can re-hydrate when this synthetic event fires.
  window.dispatchEvent(new CustomEvent("a7-session-updated"));
}

/**
 * Removes the current session from storage and broadcasts the logout/update event.
 */
export function clearStoredSession(): void {
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent("a7-session-updated"));
}

/**
 * Decodes the middle JWT segment into a plain object without verifying the signature.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split(".");
    // JWT payloads use base64url encoding, so normalize it before passing to atob().
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = window.atob(normalized);
    // The payload is plain JSON after base64 decoding.
    return JSON.parse(parsed) as Record<string, unknown>;
  } catch {
    // Invalid token text should not crash the whole app; it just behaves like missing claims.
    return {};
  }
}

/**
 * Extracts all role claims from the token, supporting both simple and namespaced claim keys.
 */
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
      // Single-role tokens often expose one plain string claim.
      return [value];
    }

    if (Array.isArray(value)) {
      // Multi-role tokens may expose an array of values.
      return value.filter((entry): entry is string => typeof entry === "string");
    }

    return [];
  });
}

/**
 * Extracts the most useful email-like identifier from the JWT payload for the shell header.
 */
export function extractEmail(token: string): string | null {
  const payload = decodeJwtPayload(token);
  const keys = [
    "email",
    "unique_name",
    "name",
    "preferred_username",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    "sub",
  ];

  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.length > 0) {
      // Return the first populated claim because different identity servers use different fields.
      return value;
    }
  }

  // Some tokens may contain roles but no email-like field we can display in the shell.
  return null;
}

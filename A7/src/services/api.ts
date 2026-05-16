import { clearStoredSession, readStoredSession, writeStoredSession } from "@/services/session";
import type { ApiErrorShape, AuthSession, JwtResponse } from "@/types/nutikas";

// Default to the hosted Nutikas API, but allow local overrides during development if needed.
const apiBaseUrl = import.meta.env.VITE_NUTIKAS_BASE_URL ?? "https://nutikas.akaver.com/api/v1";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: BodyInit | object | null;
  retry?: boolean;
}

/**
 * Represents an API failure with both a message and the HTTP status code.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Exposes the resolved base URL so the shell can display which backend the app is targeting.
 */
export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

/**
 * Performs a typed fetch call, optionally attaching JWT auth and auto-refreshing the session on 401.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = false, body, headers, retry = false, ...init } = options;
  // Merge caller-provided headers with the defaults needed by the API contract.
  const requestHeaders = new Headers(headers);
  // Nutikas endpoints return JSON for both happy-path payloads and most error payloads.
  requestHeaders.set("Accept", "application/json");

  let payload = body as BodyInit | null | undefined;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    // Plain objects are serialized as JSON automatically so calling code stays concise.
    requestHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  if (auth) {
    // Protected routes read the persisted session and attach the JWT as a bearer token.
    const session = readStoredSession();
    if (session?.jwt) {
      requestHeaders.set("Authorization", `Bearer ${session.jwt}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    // Spread remaining fetch options such as method, signal, or mode from the caller.
    ...init,
    headers: requestHeaders,
    body: payload,
  });

  if (response.status === 401 && auth && !retry) {
    // Try exactly one refresh-and-retry cycle so expired sessions recover transparently.
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: true });
    }
  }

  if (!response.ok) {
    // Convert backend validation payloads into a readable Error for the UI/store layers.
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  if (response.status === 204) {
    // DELETE endpoints often return no content, so cast undefined into the requested generic type.
    return undefined as T;
  }

  // Successful non-empty responses are decoded into the caller's expected TypeScript shape.
  return (await response.json()) as T;
}

/**
 * Requests a new JWT/refresh-token pair and persists it if the backend accepts the current session.
 */
async function refreshSession(): Promise<AuthSession | null> {
  const session = readStoredSession();

  if (!session) {
    // No stored session means there is nothing to refresh.
    return null;
  }

  try {
    // Nutikas expects the previous jwt + refreshToken pair in the request body.
    const response = await fetch(buildUrl("/identity/Account/RefreshTokenData"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      // If refresh fails, clear the broken session so the UI returns to a clean logged-out state.
      clearStoredSession();
      return null;
    }

    const refreshed = (await response.json()) as JwtResponse;
    if (!refreshed.jwt || !refreshed.refreshToken) {
      // Defensive guard in case the backend responds without the expected token payload.
      clearStoredSession();
      return null;
    }

    const nextSession = { jwt: refreshed.jwt, refreshToken: refreshed.refreshToken };
    // Persist the rotated tokens so all future requests use the fresh pair.
    writeStoredSession(nextSession);
    return nextSession;
  } catch {
    // Network or parsing failures are treated as a hard logout to avoid retry loops.
    clearStoredSession();
    return null;
  }
}

/**
 * Normalizes different backend error shapes into one readable string for the UI.
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorShape;

    if (data.message) {
      // Most API errors already use a simple message property.
      return data.message;
    }

    if (data.title) {
      // ASP.NET-style problem details often expose the main text as title.
      return data.title;
    }

    if (data.detail) {
      // Some endpoints return a more specific detail field instead.
      return data.detail;
    }

    if (data.errors) {
      // Validation dictionaries are flattened by taking the first available entry.
      const [firstEntry] = Object.values(data.errors);
      if (firstEntry?.length) {
        return firstEntry[0];
      }
    }
  } catch {
    // Fall back to status text when the API returns an empty body or non-JSON content.
  }

  // statusText is still better than a generic message when the backend sends no structured payload.
  return response.statusText || "Unexpected API error";
}

/**
 * Builds an absolute API URL while accepting caller paths with or without a leading slash.
 */
function buildUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

import type { ApiMessage, RefreshTokenPayload, SessionState } from "@/types/api";
import { clearStoredSession, readStoredSession, writeStoredSession } from "@/services/session";

/**
 * Holds the backend base URL and allows overriding it through a Vite env variable.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/a6/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Extracts the most useful backend error text from the API response payload.
 */
function extractMessage(payload: unknown): string {
  // Non-object payloads cannot contain the structured error fields we expect.
  if (!payload || typeof payload !== "object") return "Request failed";

  // The backend may return either a single message or an array of validation messages.
  const messagePayload = payload as ApiMessage;
  if (messagePayload.message) return messagePayload.message;
  if (messagePayload.messages?.length) return messagePayload.messages.join(", ");

  return "Request failed";
}

/**
 * Parses JSON responses, handles empty 204 responses, and converts failed responses into ApiError instances.
 */
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    // DELETE requests often return no body, so we treat that as a valid empty result.
    return undefined as T;
  }

  const text = await response.text();
  // Parse JSON only when a response body is actually present.
  const payload = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!response.ok) {
    // Convert backend errors into a typed error so stores can show a clean message in the UI.
    throw new ApiError(extractMessage(payload), response.status);
  }

  return payload;
}

/**
 * Sends a basic JSON request without auth retry logic.
 * This low-level helper is reused by the refresh-token flow.
 */
async function rawRequest<T>(path: string, init: RequestInit = {}) {
  // This helper is mainly used for refresh-token flows where we do not want nested retry logic.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      // The backend expects JSON bodies for all auth and Todo endpoints in this app.
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

/**
 * Uses the stored refresh token to request a fresh JWT and updates the saved session on success.
 */
export async function refreshStoredSession(): Promise<SessionState | null> {
  // Refresh is only possible when we still have a persisted session pair locally.
  const session = readStoredSession();
  if (!session) return null;

  try {
    // The refresh endpoint expects the current JWT together with the refresh token.
    const payload = await rawRequest<SessionState>("/Account/RefreshToken", {
      method: "POST",
      body: JSON.stringify({
        jwt: session.token,
        refreshToken: session.refreshToken,
      } satisfies RefreshTokenPayload),
    });

    const nextSession: SessionState = {
      ...payload,
      // The refresh response does not need to change the email, so we keep the locally known value.
      email: session.email,
    };

    writeStoredSession(nextSession);
    return nextSession;
  } catch {
    // If refresh fails, the safest fallback is to clear the broken session and force a new login.
    clearStoredSession();
    return null;
  }
}

/**
 * Sends API requests with optional bearer auth and retries once after refreshing the token on 401.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retryOnAuthFailure?: boolean } = {},
): Promise<T> {
  // Most app requests are authenticated, but login/register can opt out.
  const { auth = true, retryOnAuthFailure = true } = options;
  const session = readStoredSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Attach the bearer token only for endpoints that require authentication.
      ...(auth && session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401 && auth && retryOnAuthFailure && session?.refreshToken) {
    // Retry once after refreshing the session so expired access tokens do not immediately log the user out.
    const refreshedSession = await refreshStoredSession();
    if (refreshedSession?.token) {
      return apiRequest<T>(path, init, { auth, retryOnAuthFailure: false });
    }
  }

  return parseResponse<T>(response);
}

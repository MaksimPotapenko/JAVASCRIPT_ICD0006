import type { ApiMessage, RefreshTokenPayload, SessionState } from "@/types/api";
import { clearStoredSession, readStoredSession, writeStoredSession } from "@/services/session";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://taltech.akaver.com/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed";

  const messagePayload = payload as ApiMessage;
  if (messagePayload.message) return messagePayload.message;
  if (messagePayload.messages?.length) return messagePayload.messages.join(", ");

  return "Request failed";
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!response.ok) {
    throw new ApiError(extractMessage(payload), response.status);
  }

  return payload;
}

async function rawRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

export async function refreshStoredSession(): Promise<SessionState | null> {
  const session = readStoredSession();
  if (!session) return null;

  try {
    const payload = await rawRequest<SessionState>("/Account/RefreshToken", {
      method: "POST",
      body: JSON.stringify({
        jwt: session.token,
        refreshToken: session.refreshToken,
      } satisfies RefreshTokenPayload),
    });

    const nextSession: SessionState = {
      ...payload,
      email: session.email,
    };

    writeStoredSession(nextSession);
    return nextSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retryOnAuthFailure?: boolean } = {},
): Promise<T> {
  const { auth = true, retryOnAuthFailure = true } = options;
  const session = readStoredSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(auth && session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401 && auth && retryOnAuthFailure && session?.refreshToken) {
    const refreshedSession = await refreshStoredSession();
    if (refreshedSession?.token) {
      return apiRequest<T>(path, init, { auth, retryOnAuthFailure: false });
    }
  }

  return parseResponse<T>(response);
}

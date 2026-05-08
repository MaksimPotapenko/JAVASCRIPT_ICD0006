import { clearStoredSession, readStoredSession, writeStoredSession } from "@/services/session";
import type { ApiErrorShape, AuthSession, JwtResponse } from "@/types/nutikas";

const apiBaseUrl = import.meta.env.VITE_NUTIKAS_BASE_URL ?? "https://nutikas.akaver.com/api/v1";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: BodyInit | object | null;
  retry?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = false, body, headers, retry = false, ...init } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  let payload = body as BodyInit | null | undefined;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    requestHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  if (auth) {
    const session = readStoredSession();
    if (session?.jwt) {
      requestHeaders.set("Authorization", `Bearer ${session.jwt}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: requestHeaders,
    body: payload,
  });

  if (response.status === 401 && auth && !retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: true });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function refreshSession(): Promise<AuthSession | null> {
  const session = readStoredSession();

  if (!session) {
    return null;
  }

  try {
    const response = await fetch(buildUrl("/identity/Account/RefreshTokenData"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      clearStoredSession();
      return null;
    }

    const refreshed = (await response.json()) as JwtResponse;
    if (!refreshed.jwt || !refreshed.refreshToken) {
      clearStoredSession();
      return null;
    }

    const nextSession = { jwt: refreshed.jwt, refreshToken: refreshed.refreshToken };
    writeStoredSession(nextSession);
    return nextSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorShape;

    if (data.message) {
      return data.message;
    }

    if (data.title) {
      return data.title;
    }

    if (data.detail) {
      return data.detail;
    }

    if (data.errors) {
      const [firstEntry] = Object.values(data.errors);
      if (firstEntry?.length) {
        return firstEntry[0];
      }
    }
  } catch {
    // Fall back to status text when the API returns an empty body or non-JSON content.
  }

  return response.statusText || "Unexpected API error";
}

function buildUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

import { apiRequest } from "@/services/api";
import { clearStoredSession, writeStoredSession } from "@/services/session";
import type { JwtResponse, LoginPayload, RegisterPayload, SessionState } from "@/types/api";

/**
 * Authenticates an existing user and persists the returned JWT/refresh-token pair locally.
 */
export async function login(payload: LoginPayload): Promise<SessionState> {
  const response = await apiRequest<JwtResponse>("/Account/Login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });

  // The backend response does not repeat the email, so we merge it back into the local session model.
  const session = { ...response, email: payload.email };
  writeStoredSession(session);
  return session;
}

/**
 * Registers a new user, then stores the returned session so the app can enter the protected area immediately.
 */
export async function register(payload: RegisterPayload): Promise<SessionState> {
  const response = await apiRequest<JwtResponse>("/Account/Register", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });

  // Registration immediately returns tokens, so the app can treat it the same as a successful login.
  const session = { ...response, email: payload.email };
  writeStoredSession(session);
  return session;
}

/**
 * Clears the locally stored auth session during logout.
 */
export function logout() {
  clearStoredSession();
}

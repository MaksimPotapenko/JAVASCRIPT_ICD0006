import { apiRequest } from "@/services/api";
import { clearStoredSession, writeStoredSession } from "@/services/session";
import type { JwtResponse, LoginPayload, RegisterPayload, SessionState } from "@/types/api";

/**
 * Authenticates an existing user and persists the returned JWT/refresh-token pair locally.
 */
export async function login(payload: LoginPayload): Promise<SessionState> {
  // Login is a guest request, so the auth header must stay disabled here.
  const response = await apiRequest<JwtResponse>(
    "/Account/Login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false },
  );

  // The backend response does not repeat the email, so we merge it back into the local session model.
  const session = { ...response, email: payload.email };
  writeStoredSession(session);
  return session;
}

/**
 * Registers a new user, then stores the returned session so the app can enter the protected area immediately.
 */
export async function register(payload: RegisterPayload): Promise<SessionState> {
  // Registration is also a guest request and immediately returns tokens on success.
  const response = await apiRequest<JwtResponse>(
    "/Account/Register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false },
  );

  // Registration immediately returns tokens, so the app can treat it the same as a successful login.
  const session = { ...response, email: payload.email };
  writeStoredSession(session);
  return session;
}

/**
 * Clears the locally stored auth session during logout.
 */
export function logout() {
  // The React app handles redirecting away from the dashboard after local session removal.
  clearStoredSession();
}

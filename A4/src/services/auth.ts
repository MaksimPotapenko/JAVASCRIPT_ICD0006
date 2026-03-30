import { apiRequest } from "@/services/api";
import { clearStoredSession, writeStoredSession } from "@/services/session";
import type { JwtResponse, LoginPayload, RegisterPayload, SessionState } from "@/types/api";

export async function login(payload: LoginPayload): Promise<SessionState> {
  const response = await apiRequest<JwtResponse>("/Account/Login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });

  const session = { ...response, email: payload.email };
  writeStoredSession(session);
  return session;
}

export async function register(payload: RegisterPayload): Promise<SessionState> {
  const response = await apiRequest<JwtResponse>("/Account/Register", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });

  const session = { ...response, email: payload.email };
  writeStoredSession(session);
  return session;
}

export function logout() {
  clearStoredSession();
}

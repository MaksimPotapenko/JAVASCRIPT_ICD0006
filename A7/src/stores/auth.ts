import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { loginUser, logoutUser, registerUser } from "@/services/nutikas";
import { clearStoredSession, extractEmail, extractRoles, readStoredSession, writeStoredSession } from "@/services/session";
import type { AuthSession, LoginInfo, RegisterInfo } from "@/types/nutikas";

export const useAuthStore = defineStore("auth", () => {
  // session is the single source of truth for all auth-derived UI state.
  const session = ref<AuthSession | null>(readStoredSession());
  const busy = ref(false);

  // These computed values let components react to auth changes without parsing JWTs themselves.
  const isAuthenticated = computed(() => Boolean(session.value?.jwt));
  const roles = computed(() => (session.value?.jwt ? extractRoles(session.value.jwt) : []));
  const email = computed(() => (session.value?.jwt ? extractEmail(session.value.jwt) : null));
  const isOrganiser = computed(() => roles.value.includes("organiser"));

  /** Re-reads the session from localStorage into Pinia state. */
  function hydrate(): void {
    session.value = readStoredSession();
  }

  /** Logs the user in and persists the returned JWT + refresh-token pair. */
  async function login(payload: LoginInfo): Promise<void> {
    busy.value = true;
    try {
      const response = await loginUser(payload);
      // persist() keeps Pinia state and localStorage in sync from one place.
      persist(response.jwt, response.refreshToken);
    } finally {
      busy.value = false;
    }
  }

  /** Registers a new user account and immediately stores the new authenticated session. */
  async function register(payload: RegisterInfo): Promise<void> {
    busy.value = true;
    try {
      const response = await registerUser(payload);
      // Registration returns the same kind of token pair as login, so the persistence path is shared.
      persist(response.jwt, response.refreshToken);
    } finally {
      busy.value = false;
    }
  }

  /** Logs the user out remotely when possible, then always clears the local session. */
  async function logout(): Promise<void> {
    const refreshToken = session.value?.refreshToken;
    busy.value = true;

    try {
      if (refreshToken) {
        // Best effort server-side logout so the refresh token is invalidated remotely too.
        await logoutUser(refreshToken);
      }
    } catch {
      // Logging out locally is still better than leaving a broken session in storage.
    } finally {
      // Always clear local state even if the backend logout endpoint fails.
      clearStoredSession();
      session.value = null;
      busy.value = false;
    }
  }

  /** Persists a valid token pair in both localStorage and the reactive store. */
  function persist(jwt: string | null, refreshToken: string | null): void {
    if (!jwt || !refreshToken) {
      throw new Error("Auth response did not contain tokens.");
    }

    const nextSession = { jwt, refreshToken };
    // LocalStorage keeps sessions alive across refreshes; Pinia updates the live reactive UI.
    writeStoredSession(nextSession);
    session.value = nextSession;
  }

  if (typeof window !== "undefined") {
    // Keep the store in sync if another tab or the API refresh flow updates localStorage.
    window.addEventListener("a7-session-updated", hydrate);
  }

  return {
    busy,
    email,
    hydrate,
    isAuthenticated,
    isOrganiser,
    login,
    logout,
    register,
    roles,
    session,
  };
});

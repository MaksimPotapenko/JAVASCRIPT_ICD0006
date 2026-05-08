import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { loginUser, logoutUser, registerUser } from "@/services/nutikas";
import { clearStoredSession, extractEmail, extractRoles, readStoredSession, writeStoredSession } from "@/services/session";
import type { AuthSession, LoginInfo, RegisterInfo } from "@/types/nutikas";

export const useAuthStore = defineStore("auth", () => {
  const session = ref<AuthSession | null>(readStoredSession());
  const busy = ref(false);

  const isAuthenticated = computed(() => Boolean(session.value?.jwt));
  const roles = computed(() => (session.value?.jwt ? extractRoles(session.value.jwt) : []));
  const email = computed(() => (session.value?.jwt ? extractEmail(session.value.jwt) : null));
  const isOrganiser = computed(() => roles.value.includes("organiser"));

  function hydrate(): void {
    session.value = readStoredSession();
  }

  async function login(payload: LoginInfo): Promise<void> {
    busy.value = true;
    try {
      const response = await loginUser(payload);
      persist(response.jwt, response.refreshToken);
    } finally {
      busy.value = false;
    }
  }

  async function register(payload: RegisterInfo): Promise<void> {
    busy.value = true;
    try {
      const response = await registerUser(payload);
      persist(response.jwt, response.refreshToken);
    } finally {
      busy.value = false;
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = session.value?.refreshToken;
    busy.value = true;

    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch {
      // Logging out locally is still better than leaving a broken session in storage.
    } finally {
      clearStoredSession();
      session.value = null;
      busy.value = false;
    }
  }

  function persist(jwt: string | null, refreshToken: string | null): void {
    if (!jwt || !refreshToken) {
      throw new Error("Auth response did not contain tokens.");
    }

    const nextSession = { jwt, refreshToken };
    writeStoredSession(nextSession);
    session.value = nextSession;
  }

  if (typeof window !== "undefined") {
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

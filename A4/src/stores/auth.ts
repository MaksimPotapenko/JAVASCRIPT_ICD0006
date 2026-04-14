import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";

import { login, logout, register } from "@/services/auth";
import { refreshStoredSession } from "@/services/api";
import { readStoredSession } from "@/services/session";
import type { LoginPayload, RegisterPayload, SessionState } from "@/types/api";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();
  const session = ref<SessionState | null>(readStoredSession());
  const isLoading = ref(false);
  const error = ref("");

  const isAuthenticated = computed(() => Boolean(session.value?.token));
  const fullName = computed(() => {
    if (!session.value) return "";
    return `${session.value.firstName} ${session.value.lastName}`.trim();
  });
  const email = computed(() => session.value?.email ?? "");

  // Logs in the user, updates store state, and redirects into the protected dashboard.
  async function loginUser(payload: LoginPayload) {
    isLoading.value = true;
    error.value = "";
    try {
      session.value = await login(payload);
      await router.push({ name: "dashboard" });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Login failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Registers a new user account, stores the session, and redirects to the dashboard.
  async function registerUser(payload: RegisterPayload) {
    isLoading.value = true;
    error.value = "";
    try {
      session.value = await register(payload);
      await router.push({ name: "dashboard" });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Registration failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Restores the session with the refresh token and sends the user back to login if refresh fails.
  async function refresh() {
    session.value = await refreshStoredSession();
    if (!session.value) {
      await router.push({ name: "login" });
    }
  }

  // Clears auth state and returns the UI to the login route.
  function logoutUser() {
    logout();
    session.value = null;
    router.push({ name: "login" });
  }

  return {
    email,
    error,
    fullName,
    isAuthenticated,
    isLoading,
    session,
    login: loginUser,
    logout: logoutUser,
    refresh,
    register: registerUser,
  };
});

import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";

import { login, logout, register } from "@/services/auth";
import { refreshStoredSession } from "@/services/api";
import { readStoredSession } from "@/services/session";
import type { LoginPayload, RegisterPayload, SessionState } from "@/types/api";

/**
 * Centralizes auth state, route redirects, and auth-related actions for the whole app.
 */
export const useAuthStore = defineStore("auth", () => {
  /**
   * Gives auth actions access to navigation after login, logout, and refresh failures.
   */
  const router = useRouter();
  /**
   * Holds the persisted session restored from localStorage when the app starts.
   */
  const session = ref<SessionState | null>(readStoredSession());
  /**
   * Tracks whether an auth action is currently in progress.
   */
  const isLoading = ref(false);
  /**
   * Stores the latest auth-related error message for the UI.
   */
  const error = ref("");

  /**
   * Tells the UI whether a valid JWT is currently available.
   */
  const isAuthenticated = computed(() => Boolean(session.value?.token));
  /**
   * Builds a readable full name from the stored session data.
   */
  const fullName = computed(() => {
    if (!session.value) return "";
    return `${session.value.firstName} ${session.value.lastName}`.trim();
  });
  /**
   * Exposes the authenticated user's email for header display.
   */
  const email = computed(() => session.value?.email ?? "");

  /**
   * Logs in the user, updates store state, and redirects into the protected dashboard.
   */
  async function loginUser(payload: LoginPayload) {
    isLoading.value = true;
    // Clear stale UI errors before starting a new auth request.
    error.value = "";
    try {
      session.value = await login(payload);
      // Navigation lives in the store so the form component stays minimal.
      await router.push({ name: "dashboard" });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Login failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Registers a new user account, stores the session, and redirects to the dashboard.
   */
  async function registerUser(payload: RegisterPayload) {
    isLoading.value = true;
    error.value = "";
    try {
      session.value = await register(payload);
      // Successful registration leads directly into the protected workspace.
      await router.push({ name: "dashboard" });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Registration failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Restores the session with the refresh token and sends the user back to login if refresh fails.
   */
  async function refresh() {
    session.value = await refreshStoredSession();
    if (!session.value) {
      // If refresh cannot recover the session, return to the public login route.
      await router.push({ name: "login" });
    }
  }

  /**
   * Clears auth state and returns the UI to the login route.
   */
  function logoutUser() {
    logout();
    session.value = null;
    // Redirect after logout so protected screens are not left visible with stale state.
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

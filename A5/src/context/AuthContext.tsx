import { createContext, useContext, useEffect, useReducer } from "react";

import { refreshStoredSession } from "@/services/api";
import { login, logout, register } from "@/services/auth";
import { readStoredSession } from "@/services/session";
import type { LoginPayload, RegisterPayload, SessionState } from "@/types/api";

interface AuthState {
  session: SessionState | null;
  isLoading: boolean;
  isReady: boolean;
  error: string;
}

type AuthAction =
  | { type: "auth/start" }
  | { type: "auth/success"; payload: SessionState | null }
  | { type: "auth/error"; payload: string }
  | { type: "auth/logout" }
  | { type: "auth/clear-error" };

interface AuthContextValue {
  state: AuthState;
  isAuthenticated: boolean;
  fullName: string;
  loginUser: (payload: LoginPayload) => Promise<void>;
  registerUser: (payload: RegisterPayload) => Promise<void>;
  logoutUser: () => void;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const initialState: AuthState = {
  session: readStoredSession(),
  isLoading: false,
  isReady: false,
  error: "",
};

/**
 * Centralizes auth state updates so login, logout, hydration, and refresh flows stay predictable.
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "auth/start":
      // Start actions clear stale errors and flip the loading flag for UI feedback.
      return { 
        ...state,
        isLoading: true,
        error: "",
      };
    case "auth/success":
      // Success stores the latest session snapshot and marks the auth layer as ready.
      return {
        ...state,
        session: action.payload,
        isLoading: false,
        isReady: true,
        error: "",
      };
    case "auth/error":
      // Errors stop loading but keep the auth layer usable so the user can retry.
      return {
        ...state,
        isLoading: false,
        isReady: true,
        error: action.payload,
      };
    case "auth/logout":
      // Logout clears the in-memory session while keeping the provider mounted.
      return {
        ...state,
        session: null,
        isLoading: false,
        isReady: true,
        error: "",
      };
    case "auth/clear-error":
      // Sometimes the UI only needs to dismiss a visible error banner.
      return {
        ...state,
        error: "",
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the authenticated session lifecycle and exposes auth actions to the rest of the app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // This guard prevents state updates if the component unmounts during async hydration.
    let isMounted = true;

    /**
     * Restores the stored session and immediately validates it through the refresh-token endpoint.
     */
    async function hydrateSession() {
      if (!state.session) {
        // With no stored session, the app can immediately consider auth initialization complete.
        dispatch({ type: "auth/success", payload: null });
        return;
      }

      // Stored tokens still need to be validated before the app trusts them.
      dispatch({ type: "auth/start" });

      const session = await refreshStoredSession();
      // Stop here if the provider was unmounted while the request was running.
      if (!isMounted) return;

      dispatch({ type: "auth/success", payload: session });
    }

    void hydrateSession();

    return () => {
      // Prevent late async completions from dispatching into an unmounted provider.
      isMounted = false;
    };
  }, []);

  /**
   * Signs in an existing user and stores the successful session in context state.
   */
  async function loginUser(payload: LoginPayload) {
    // Loading state disables the form and keeps the UX consistent during the request.
    dispatch({ type: "auth/start" });

    try {
      const session = await login(payload);
      dispatch({ type: "auth/success", payload: session });
    } catch (error) {
      dispatch({
        type: "auth/error",
        payload: error instanceof Error ? error.message : "Login failed",
      });
      throw error;
    }
  }

  /**
   * Creates an account and treats the successful response like an authenticated session.
   */
  async function registerUser(payload: RegisterPayload) {
    // Registration reuses the same auth state machine as login.
    dispatch({ type: "auth/start" });

    try {
      const session = await register(payload);
      dispatch({ type: "auth/success", payload: session });
    } catch (error) {
      dispatch({
        type: "auth/error",
        payload: error instanceof Error ? error.message : "Registration failed",
      });
      throw error;
    }
  }

  /**
   * Clears both the persisted session and the in-memory auth state.
   */
  function logoutUser() {
    // The service removes localStorage, and the reducer clears the React-visible session.
    logout();
    dispatch({ type: "auth/logout" });
  }

  /**
   * Forces a refresh-token based session renewal, useful for manual recovery flows.
   */
  async function refreshSession() {
    // Manual refresh can be useful for recovery or explicit session checks.
    dispatch({ type: "auth/start" });
    const session = await refreshStoredSession();
    dispatch({ type: "auth/success", payload: session });
  }

  /**
   * Removes the currently visible auth error from the state.
   */
  function clearError() {
    // Forms call this before submit so old errors do not linger into the next attempt.
    dispatch({ type: "auth/clear-error" });
  }

  const value: AuthContextValue = {
    state,
    // A valid token is enough for route guards and protected UI checks.
    isAuthenticated: Boolean(state.session?.token),
    // The UI prefers a friendly full name, but can fall back if one is missing.
    fullName: state.session ? `${state.session.firstName} ${state.session.lastName}`.trim() : "",
    loginUser,
    registerUser,
    logoutUser,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Provides strongly typed access to the shared auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // This helps catch provider wiring mistakes during development.
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

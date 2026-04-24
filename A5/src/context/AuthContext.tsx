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

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "auth/start":
      return { ...state, isLoading: true, error: "" };
    case "auth/success":
      return {
        ...state,
        session: action.payload,
        isLoading: false,
        isReady: true,
        error: "",
      };
    case "auth/error":
      return {
        ...state,
        isLoading: false,
        isReady: true,
        error: action.payload,
      };
    case "auth/logout":
      return {
        ...state,
        session: null,
        isLoading: false,
        isReady: true,
        error: "",
      };
    case "auth/clear-error":
      return { ...state, error: "" };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      if (!state.session) {
        dispatch({ type: "auth/success", payload: null });
        return;
      }

      dispatch({ type: "auth/start" });

      const session = await refreshStoredSession();
      if (!isMounted) return;

      dispatch({ type: "auth/success", payload: session });
    }

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loginUser(payload: LoginPayload) {
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

  async function registerUser(payload: RegisterPayload) {
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

  function logoutUser() {
    logout();
    dispatch({ type: "auth/logout" });
  }

  async function refreshSession() {
    dispatch({ type: "auth/start" });
    const session = await refreshStoredSession();
    dispatch({ type: "auth/success", payload: session });
  }

  function clearError() {
    dispatch({ type: "auth/clear-error" });
  }

  const value: AuthContextValue = {
    state,
    isAuthenticated: Boolean(state.session?.token),
    fullName: state.session ? `${state.session.firstName} ${state.session.lastName}`.trim() : "",
    loginUser,
    registerUser,
    logoutUser,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

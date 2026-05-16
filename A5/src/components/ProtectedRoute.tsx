import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

/**
 * Blocks access to private routes until a valid authenticated session is available.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // The auth context decides whether this wrapper should render content or redirect to login.
  const { state, isAuthenticated } = useAuth();

  if (!state.isReady) {
    // The app should not decide on redirects until the persisted session has been checked.
    return <div className="route-status">Restoring your session...</div>;
  }

  if (!isAuthenticated) {
    // Guests are redirected to the login page whenever they try to enter the dashboard.
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

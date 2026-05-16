import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

/**
 * Prevents authenticated users from returning to guest-only routes like login or register.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  // The auth context tells this wrapper both whether auth is ready and whether a user is signed in.
  const { state, isAuthenticated } = useAuth();

  if (!state.isReady) {
    // Wait until the auth provider finishes restoring or refreshing the stored session.
    return <div className="route-status">Checking your access...</div>;
  }

  if (isAuthenticated) {
    // Signed-in users should be sent straight to the protected app area.
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

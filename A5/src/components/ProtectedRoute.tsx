import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state, isAuthenticated } = useAuth();

  if (!state.isReady) {
    return <div className="route-status">Restoring your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { state, isAuthenticated } = useAuth();

  if (!state.isReady) {
    return <div className="route-status">Checking your access...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

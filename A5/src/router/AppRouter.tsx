import { Navigate, Route, Routes } from "react-router-dom";

import { GuestRoute } from "@/components/GuestRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

/**
 * Defines the public and protected routes used by the React Todo client.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

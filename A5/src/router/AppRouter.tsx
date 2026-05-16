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
      // The bare root forwards users into the protected app entry point.
      <Route path="/" element={<Navigate to="/app" replace />} />
      // Login and register stay guest-only so authenticated users do not bounce back to auth forms.
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
      // The dashboard route is protected and only renders for a valid authenticated session.
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      // Unknown URLs are normalized back into the main app entry point.
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";

/**
 * Renders the login form and forwards successful authentication into the protected app area.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { state, loginUser, clearError } = useAuth();
  // Stores the current editable login fields before they are submitted to the auth context.
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  /**
   * Submits the login form through the auth context so navigation and error handling stay centralized.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from trying to submit and reload the page.
    event.preventDefault();
    // Clear any previous visible auth error before attempting a new request.
    clearError();

    try {
      await loginUser(form);
      // Enter the private dashboard immediately after a successful login.
      navigate("/app");
    } catch {
      // The auth context already stores the user-facing error message.
    }
  }

  return (
    <AuthShell
      title="Sign in"
      intro="Use your TalTech Todo API account. Access tokens are stored with a refresh token and renewed automatically after authorization failures."
      footerLabel="Need an account?"
      footerHref="/register"
      footerAction="Create one"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <button type="submit" disabled={state.isLoading}>
          {state.isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

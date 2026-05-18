import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";

/**
 * Renders the registration form and signs the user into the protected app after success.
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const { state, registerUser, clearError } = useAuth();
  // Stores the editable registration fields before they are posted to the auth context.
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  /**
   * Submits the registration payload and moves the newly created user into the dashboard.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser from trying to submit and reload the page.
    event.preventDefault();
    // Clear any previous visible auth error before attempting a new request.
    clearError();

    try {
      await registerUser(form);
      // Registration returns tokens immediately, so the user can continue straight into the app.
      navigate("/app");
    } catch {
      // The auth context already stores the user-facing error message.
    }
  }

  return (
    <AuthShell
      title="Create account"
      intro="Registration returns both a JWT and refresh token immediately, so the app can continue directly into the protected Todo workspace."
      footerLabel="Already registered?"
      footerHref="/login"
      footerAction="Sign in"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>First name</span>
          <input
            type="text"
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>Last name</span>
          <input
            type="text"
            value={form.lastName}
            onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            required
          />
        </label>
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
          {state.isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

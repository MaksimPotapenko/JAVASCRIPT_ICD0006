import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { state, registerUser, clearError } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    try {
      await registerUser(form);
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

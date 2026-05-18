import { Link } from "react-router-dom";

interface AuthShellProps {
  title: string;
  intro: string;
  footerLabel: string;
  footerHref: string;
  footerAction: string;
  children: React.ReactNode;
}

/**
 * Provides a shared two-column layout for login and registration screens.
 */
export function AuthShell({
  title,
  intro,
  footerLabel,
  footerHref,
  footerAction,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Assignment 5</p>
        <h1>React Todo workspace with JWT and refresh-token security.</h1>
        <p>{intro}</p>
        <ul className="hero-points">
          <li>Context + reducers keep auth and Todo state centralized.</li>
          <li>Protected routing keeps private screens behind a valid session.</li>
          <li>CRUD flows cover categories, priorities, and tasks in one dashboard.</li>
        </ul>
        <a className="button-link button-link-ghost" href="https://mpotap.proxy.itcollege.ee/">
          Back to main page
        </a>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <h2>{title}</h2>
          <p>Use the TalTech Todo backend account you want to test with.</p>
        </div>
        {children}
        <p className="auth-footer">
          {footerLabel} <Link to={footerHref}>{footerAction}</Link>
        </p>
      </section>
    </main>
  );
}

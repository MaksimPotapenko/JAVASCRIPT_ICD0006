import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import { TodoProvider } from "@/context/TodoContext";
import { AppRouter } from "@/router/AppRouter";

/**
 * Composes the top-level router and global providers used across the React client.
 */
export function App() {
  return (
    // The basename keeps routing compatible with deployment under /a5/ behind nginx.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      // Auth state wraps the whole app so route guards and pages can read the current session.
      <AuthProvider>
        // Todo state lives under auth because the dashboard only makes sense for signed-in users.
        <TodoProvider>
          <AppRouter />
        </TodoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

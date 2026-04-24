import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import { TodoProvider } from "@/context/TodoContext";
import { AppRouter } from "@/router/AppRouter";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <TodoProvider>
          <AppRouter />
        </TodoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

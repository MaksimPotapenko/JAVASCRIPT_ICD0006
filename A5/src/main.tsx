import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/App";
import "@/styles.css";

/**
 * Boots the React application and mounts it into the root DOM node created by Vite.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  // StrictMode helps catch accidental side effects during development.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

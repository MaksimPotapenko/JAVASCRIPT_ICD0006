import cors from "cors";
import express from "express";

import { PORT } from "./config/env.js";
import { accountRouter } from "./routes/account.js";
import { todoRouter } from "./routes/todos.js";

/**
 * Creates the Express application that hosts the Assignment 6 Todo API.
 */
const app = express();

// Allow frontend containers and local development tools to call the API.
app.use(cors());
// Parse JSON bodies for auth and Todo CRUD requests.
app.use(express.json());

app.get("/api/v1/health", (_request, response) => {
  // A lightweight health-check endpoint used by deployments and quick smoke tests.
  response.json({ status: "ok" });
});

// Mount authentication endpoints before the protected Todo routes.
app.use("/api/v1/Account", accountRouter);
// Mount the category, priority, and task CRUD endpoints under the API prefix.
app.use("/api/v1", todoRouter);

app.use((error, _request, response, _next) => {
  // Keep unexpected server errors visible in logs while returning a safe generic message.
  console.error(error);
  response.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  // Confirm the listening port in logs so local and container startup is easy to verify.
  console.log(`A6 Express API listening on port ${PORT}`);
});

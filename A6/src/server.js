import cors from "cors";
import express from "express";

import { PORT } from "./config/env.js";
import { registerAccountRoutes } from "./routes/account.js";
import { registerTodoRoutes } from "./routes/todos.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_request, response) => {
  response.json({ status: "ok" });
});

registerAccountRoutes(app);
registerTodoRoutes(app);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`A6 Express API listening on port ${PORT}`);
});

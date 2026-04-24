import { v4 as uuid } from "uuid";

import { readDb, writeDb } from "../db/store.js";
import { buildSessionResponse, comparePassword, createRefreshToken, decodeAccessToken, hashPassword } from "../utils/auth.js";
import { sendValidationError } from "../utils/errors.js";

function validateRegistration(payload) {
  if (!payload.email?.trim()) return "Email is required";
  if (!payload.password?.trim()) return "Password is required";
  if (!payload.firstName?.trim()) return "First name is required";
  if (!payload.lastName?.trim()) return "Last name is required";
  if (payload.password.length < 6) return "Password must be at least 6 characters long";
  return null;
}

function validateLogin(payload) {
  if (!payload.email?.trim()) return "Email is required";
  if (!payload.password?.trim()) return "Password is required";
  return null;
}

export function registerAccountRoutes(app) {
  app.post("/api/v1/Account/Register", async (request, response) => {
    const errorMessage = validateRegistration(request.body ?? {});
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const email = request.body.email.trim().toLowerCase();
    const existingUser = db.users.find((user) => user.email === email);

    if (existingUser) {
      return sendValidationError(response, "User already exists");
    }

    const refreshToken = createRefreshToken();
    const user = {
      id: uuid(),
      email,
      passwordHash: await hashPassword(request.body.password),
      firstName: request.body.firstName.trim(),
      lastName: request.body.lastName.trim(),
      refreshToken,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    writeDb(db);

    return response.status(201).json(buildSessionResponse(user, refreshToken));
  });

  app.post("/api/v1/Account/Login", async (request, response) => {
    const errorMessage = validateLogin(request.body ?? {});
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const email = request.body.email.trim().toLowerCase();
    const user = db.users.find((item) => item.email === email);

    if (!user) {
      return response.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await comparePassword(request.body.password, user.passwordHash);
    if (!isPasswordValid) {
      return response.status(401).json({ message: "Invalid email or password" });
    }

    user.refreshToken = createRefreshToken();
    writeDb(db);

    return response.json(buildSessionResponse(user, user.refreshToken));
  });

  app.post("/api/v1/Account/RefreshToken", (request, response) => {
    const { jwt, refreshToken } = request.body ?? {};

    if (!jwt || !refreshToken) {
      return sendValidationError(response, "Both jwt and refreshToken are required");
    }

    const decoded = decodeAccessToken(jwt);
    const userId = decoded?.sub;

    if (!userId) {
      return response.status(401).json({ message: "Invalid jwt payload" });
    }

    const db = readDb();
    const user = db.users.find((item) => item.id === userId);

    if (!user || user.refreshToken !== refreshToken) {
      return response.status(401).json({ message: "Refresh token is invalid" });
    }

    user.refreshToken = createRefreshToken();
    writeDb(db);

    return response.json(buildSessionResponse(user, user.refreshToken));
  });
}

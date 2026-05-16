import { v4 as uuid } from "uuid";

import { readDb, writeDb } from "../db/store.js";
import { buildSessionResponse, comparePassword, createRefreshToken, decodeAccessToken, hashPassword } from "../utils/auth.js";
import { sendValidationError } from "../utils/errors.js";

/**
 * Validates the registration payload before we try to create and persist a new user.
 */
function validateRegistration(payload) {
  // Each field is checked explicitly so the API can return a clear single validation message.
  if (!payload.email?.trim()) return "Email is required";
  if (!payload.password?.trim()) return "Password is required";
  if (!payload.firstName?.trim()) return "First name is required";
  if (!payload.lastName?.trim()) return "Last name is required";
  if (payload.password.length < 6) return "Password must be at least 6 characters long";
  return null;
}

/**
 * Validates the minimum fields required to attempt a login.
 */
function validateLogin(payload) {
  if (!payload.email?.trim()) return "Email is required";
  if (!payload.password?.trim()) return "Password is required";
  return null;
}

/**
 * Registers the account endpoints used by the Vue and React clients.
 */
export function registerAccountRoutes(app) {
  app.post("/api/v1/Account/Register", async (request, response) => {
    // Validate first so bad payloads never reach hashing or disk writes.
    const errorMessage = validateRegistration(request.body ?? {});
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    // Normalize emails to lowercase so duplicate-account checks are stable.
    const email = request.body.email.trim().toLowerCase();
    const existingUser = db.users.find((user) => user.email === email);

    if (existingUser) {
      return sendValidationError(response, "User already exists");
    }

    // Generate the first refresh token immediately because registration also signs the user in.
    const refreshToken = createRefreshToken();
    const user = {
      id: uuid(),
      email,
      // Only the bcrypt hash is stored in the database; the plaintext password is discarded.
      passwordHash: await hashPassword(request.body.password),
      firstName: request.body.firstName.trim(),
      lastName: request.body.lastName.trim(),
      refreshToken,
      // createdAt can be useful later for debugging or migrations.
      createdAt: new Date().toISOString(),
    };

    // Persist the user before returning the session payload to the client.
    db.users.push(user);
    writeDb(db);

    return response.status(201).json(buildSessionResponse(user, refreshToken));
  });

  app.post("/api/v1/Account/Login", async (request, response) => {
    // Login needs only credentials, so validation is smaller than registration.
    const errorMessage = validateLogin(request.body ?? {});
    if (errorMessage) {
      return sendValidationError(response, errorMessage);
    }

    const db = readDb();
    const email = request.body.email.trim().toLowerCase();
    const user = db.users.find((item) => item.email === email);

    if (!user) {
      // Use the same response text for missing users and wrong passwords.
      return response.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the submitted password with the stored bcrypt hash.
    const isPasswordValid = await comparePassword(request.body.password, user.passwordHash);
    if (!isPasswordValid) {
      return response.status(401).json({ message: "Invalid email or password" });
    }

    // Rotate the refresh token on each successful login to invalidate older sessions.
    user.refreshToken = createRefreshToken();
    writeDb(db);

    return response.json(buildSessionResponse(user, user.refreshToken));
  });

  app.post("/api/v1/Account/RefreshToken", (request, response) => {
    // The frontend sends both tokens so the API can verify the refresh-token pair.
    const { jwt, refreshToken } = request.body ?? {};

    if (!jwt || !refreshToken) {
      return sendValidationError(response, "Both jwt and refreshToken are required");
    }

    // decodeAccessToken is enough here because the stored refresh token is the real source of truth.
    const decoded = decodeAccessToken(jwt);
    const userId = decoded?.sub;

    if (!userId) {
      return response.status(401).json({ message: "Invalid jwt payload" });
    }

    const db = readDb();
    const user = db.users.find((item) => item.id === userId);

    if (!user || user.refreshToken !== refreshToken) {
      // Refresh only succeeds when the submitted token matches the one currently stored for that user.
      return response.status(401).json({ message: "Refresh token is invalid" });
    }

    // Rotate again on refresh so stolen older refresh tokens become useless.
    user.refreshToken = createRefreshToken();
    writeDb(db);

    return response.json(buildSessionResponse(user, user.refreshToken));
  });
}

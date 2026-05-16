import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { ACCESS_TOKEN_TTL, JWT_SECRET } from "../config/env.js";

/**
 * Hashes plaintext passwords before they are stored in the JSON database.
 */
export function hashPassword(password) {
  // bcrypt with 10 rounds is a reasonable baseline for this coursework-scale backend.
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plaintext password against the stored bcrypt hash.
 */
export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Creates the short-lived access token returned to the frontend after login or refresh.
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      // Keep the token payload small while still exposing the user data the frontend needs.
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

/**
 * Verifies that an access token is correctly signed and not expired.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Decodes a token payload without signature enforcement, used only for refresh-token lookup flow.
 */
export function decodeAccessToken(token) {
  return jwt.decode(token);
}

/**
 * Creates a new opaque refresh token value.
 */
export function createRefreshToken() {
  return uuid();
}

/**
 * Shapes the auth response object expected by the frontend clients.
 */
export function buildSessionResponse(user, refreshToken) {
  return {
    // A fresh JWT is always returned together with the currently valid refresh token.
    token: signAccessToken(user),
    refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

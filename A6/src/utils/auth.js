import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { ACCESS_TOKEN_TTL, JWT_SECRET } from "../config/env.js";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function decodeAccessToken(token) {
  return jwt.decode(token);
}

export function createRefreshToken() {
  return uuid();
}

export function buildSessionResponse(user, refreshToken) {
  return {
    token: signAccessToken(user),
    refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

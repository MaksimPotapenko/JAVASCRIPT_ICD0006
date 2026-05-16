import { readDb } from "../db/store.js";
import { verifyAccessToken } from "../utils/auth.js";

/**
 * Protects API routes by validating the bearer token and attaching the authenticated user to the request.
 */
export function requireAuth(request, response, next) {
  // Expect the standard "Bearer <token>" Authorization header format.
  const authorization = request.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Missing bearer token" });
  }

  try {
    // Verify the JWT first, then resolve the actual user from the JSON database.
    const payload = verifyAccessToken(token);
    const db = readDb();
    const user = db.users.find((item) => item.id === payload.sub);

    if (!user) {
      return response.status(401).json({ message: "User not found" });
    }

    // Downstream route handlers use request.auth instead of decoding the token again.
    request.auth = { userId: user.id, email: user.email };
    next();
  } catch {
    // Expired or malformed tokens are all treated as unauthorized access attempts.
    return response.status(401).json({ message: "Invalid or expired token" });
  }
}

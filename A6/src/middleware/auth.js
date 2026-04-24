import { readDb } from "../db/store.js";
import { verifyAccessToken } from "../utils/auth.js";

export function requireAuth(request, response, next) {
  const authorization = request.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const payload = verifyAccessToken(token);
    const db = readDb();
    const user = db.users.find((item) => item.id === payload.sub);

    if (!user) {
      return response.status(401).json({ message: "User not found" });
    }

    request.auth = { userId: user.id, email: user.email };
    next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token" });
  }
}

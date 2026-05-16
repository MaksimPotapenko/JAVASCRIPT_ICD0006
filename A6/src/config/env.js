import path from "node:path";

// Use container/runtime overrides when available, otherwise fall back to local development defaults.
export const PORT = Number(process.env.PORT ?? 3000);
// This secret signs access tokens and should be overridden in real production environments.
export const JWT_SECRET = process.env.JWT_SECRET ?? "assignment-6-super-secret";
// Short-lived JWTs pair with refresh tokens to implement the required secure session flow.
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
// Persist the JSON database under /data so docker-compose can mount it as a volume.
export const DATA_FILE = process.env.DATA_FILE ?? path.resolve(process.cwd(), "data/db.json");

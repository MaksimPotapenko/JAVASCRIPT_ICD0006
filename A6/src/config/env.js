import path from "node:path";

export const PORT = Number(process.env.PORT ?? 3000);
export const JWT_SECRET = process.env.JWT_SECRET ?? "assignment-6-super-secret";
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
export const DATA_FILE = process.env.DATA_FILE ?? path.resolve(process.cwd(), "data/db.json");

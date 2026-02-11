import jwt from "jsonwebtoken";
import { mustGetEnv } from "./env";

export type JwtPayload = {
  sub: string;
};

const ACCESS_SECRET = mustGetEnv("JWT_ACCESS_SECRET") || "dev-access-secret";
const REFRESH_SECRET = mustGetEnv("JWT_REFRESH_SECRET") || "dev-refresh-secret";

export const ACCESS_EXPIRES_IN_SECONDS = 15 * 60;
export const REFRESH_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

export function signAccessToken(userId: string): string {
  const payload: JwtPayload = { sub: userId };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN_SECONDS });
}

export function signRefreshToken(userId: string): string {
  const payload: JwtPayload = { sub: userId };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN_SECONDS });
}

function parsePayload(decoded: unknown): JwtPayload {
  if (!decoded || typeof decoded !== "object") throw new Error("invalid token");
  const sub = (decoded as any).sub;
  if (typeof sub !== "string" || !sub) throw new Error("invalid token");
  return { sub };
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET);
  return parsePayload(decoded);
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET);
  return parsePayload(decoded);
}

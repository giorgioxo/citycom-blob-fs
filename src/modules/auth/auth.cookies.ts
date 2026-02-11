import type { CookieOptions, Response, Request } from "express";
import { isProd } from "./env";

export const REFRESH_COOKIE_NAME = "rt";

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}

export function getRefreshToken(req: Request): string | null {
  const v = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

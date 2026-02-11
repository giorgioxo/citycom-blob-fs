import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import { findUserById } from "./users.pg.store";

function getBearerToken(req: Request): string | null {
  const h = req.header("authorization");
  if (!h) return null;

  const [type, token] = h.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: "missing auth token" });

  try {
    const payload = verifyAccessToken(token);
    const userId = payload.sub;

    const user = await findUserById(userId);
    if (!user) return res.status(401).json({ message: "invalid auth" });

    req.userId = userId;
    return next();
  } catch {
    return res.status(401).json({ message: "invalid auth" });
  }
}

import type { Request, Response, NextFunction } from "express";
import { findUserById } from "./users.store";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");

  if (!userId) return res.status(401).json({ message: "missing auth header" });

  const user = findUserById(userId);

  if (!user) return res.status(401).json({ message: "invalid auth" });

  req.userId = userId;
  next();
}

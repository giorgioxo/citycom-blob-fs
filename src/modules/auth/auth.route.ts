import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { createUser, findUserByUsername, findUserById, addRefreshToken, hasRefreshToken, removeRefreshToken, removeAllRefreshTokens } from "./users.store";

import { signAccessToken, signRefreshToken, verifyRefreshToken, ACCESS_EXPIRES_IN_SECONDS } from "./jwt";

import { requireAuth } from "./auth.middleware";
import { setRefreshCookie, clearRefreshCookie, getRefreshToken } from "./auth.cookies";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) return res.status(400).json({ message: "username and password required" });
  if (typeof username !== "string" || typeof password !== "string") return res.status(400).json({ message: "invalid body" });

  const u = username.trim();
  if (u.length < 3) return res.status(400).json({ message: "username too short" });
  if (password.length < 6) return res.status(400).json({ message: "password too short" });

  const existingUser = findUserByUsername(u);
  if (existingUser) return res.status(409).json({ message: "user already exists" });

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = createUser(userId, u, passwordHash);

  return res.status(201).json({ id: user.id, username: user.username });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) return res.status(400).json({ message: "username and password required" });
  if (typeof username !== "string" || typeof password !== "string") return res.status(400).json({ message: "invalid body" });

  const u = username.trim();

  const user = findUserByUsername(u);
  if (!user) return res.status(401).json({ message: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid credentials" });

  const accessToken = signAccessToken(user.id);

  const refreshToken = signRefreshToken(user.id);
  addRefreshToken(user.id, refreshToken);
  setRefreshCookie(res, refreshToken);

  return res.status(200).json({
    id: user.id,
    username: user.username,
    accessToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_EXPIRES_IN_SECONDS,
  });
});

authRouter.post("/refresh", async (req, res) => {
  const cookieToken = getRefreshToken(req);

  const bodyToken = req.body?.refreshToken && typeof req.body.refreshToken === "string" ? req.body.refreshToken : null;

  const refreshToken = cookieToken ?? bodyToken;
  if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const userId = payload.sub;

    const user = findUserById(userId);
    if (!user) return res.status(401).json({ message: "invalid auth" });

    if (!hasRefreshToken(userId, refreshToken)) {
      return res.status(401).json({ message: "invalid auth" });
    }

    // rotate refresh token
    removeRefreshToken(userId, refreshToken);
    const newRefreshToken = signRefreshToken(userId);
    addRefreshToken(userId, newRefreshToken);
    setRefreshCookie(res, newRefreshToken);

    const newAccessToken = signAccessToken(userId);

    return res.status(200).json({
      accessToken: newAccessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_EXPIRES_IN_SECONDS,
    });
  } catch {
    return res.status(401).json({ message: "invalid auth" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const cookieToken = getRefreshToken(req);
  const bodyToken = req.body?.refreshToken && typeof req.body.refreshToken === "string" ? req.body.refreshToken : null;
  const refreshToken = cookieToken ?? bodyToken;

  clearRefreshCookie(res);

  if (!refreshToken) {
    return res.status(200).json({ ok: true });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    removeRefreshToken(payload.sub, refreshToken);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: true });
  }
});

authRouter.post("/logout-all", requireAuth, async (req, res) => {
  const userId = req.userId!;
  removeAllRefreshTokens(userId);
  clearRefreshCookie(res);
  return res.status(200).json({ ok: true });
});

export { authRouter };

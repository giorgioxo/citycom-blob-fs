import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { createUser, findUserByUsername } from "./users.store.js";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const body = req.body;
  const username = body.username;
  const password = body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }

  const existingUser = findUserByUsername(username);

  if (existingUser) {
    return res.status(409).json({
      message: "user already exists",
    });
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = createUser(userId, username, passwordHash);

  return res.status(201).json({
    id: user.id,
    username: user.username,
  });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ message: "username and password requried" });
  }

  const user = findUserByUsername(username);
  if (!user) {
    return res.status(401).json({
      message: "invalid credentials",
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "invalid credentials" });
  }

  return res.status(200).json({ id: user.id, username: user.username });
});

export { authRouter };

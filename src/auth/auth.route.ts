import { Router } from "express";
import crypto from "crypto";
import { createUser, findUserByUsername } from "./users.store.js";

const authRouter = Router();

authRouter.post("/register", (req, res) => {
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

  const user = createUser(userId, username, password);

  return res.status(201).json({
    id: user.id,
    username: user.username,
  });
});

export { authRouter };

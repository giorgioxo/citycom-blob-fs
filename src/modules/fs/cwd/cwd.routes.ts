import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware";
import { getWorkingDirectory, setWorkingDirectory } from "../../auth/users.pg.store";
import { normalizePath } from "../shared/path.utils";

export const cwdRouter = Router();

cwdRouter.get("/", requireAuth, async (req, res) => {
  const cwd = await getWorkingDirectory(req.userId!);
  return res.json({ cwd });
});

cwdRouter.put("/", requireAuth, async (req, res) => {
  const { path } = req.body ?? {};
  if (!path || typeof path !== "string") return res.status(400).json({ message: "path required" });
  if (!path.trim().startsWith("/")) return res.status(400).json({ message: "cwd must be absolute path" });

  const normalized = normalizePath(path);
  await setWorkingDirectory(req.userId!, normalized);

  return res.status(200).json({ cwd: normalized });
});

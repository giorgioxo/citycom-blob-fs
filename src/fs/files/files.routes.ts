import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware";
import { FsService } from "../fs.service";

export function filesRouter(fsService: FsService): Router {
  const router = Router();

  router.post("/", requireAuth, async (req, res) => {
    const { path, size } = req.body ?? {};
    if (!path) {
      return res.status(400).json({ message: "path required" });
    }
    try {
      await fsService.createFile(req.userId, path, size);
      return res.status(201).json({ ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";
      if (message === "path already exists") {
        return res.status(409).json({ message });
      }
      if (message === "parent directory does not exist" || message === "parent is not a directory" || message === "cannot create file at root") {
        return res.status(400).json({ message });
      }
      if (message === "parent is read-only") {
        return res.status(400).json({ message });
      }
      return res.status(500).json({ message: "internal error" });
    }
  });

  router.post("/move", requireAuth, async (req, res) => {
    const { from, to } = req.body ?? {};

    if (!from || !to) return res.status(400).json({ message: "from and to required" });

    try {
      await fsService.moveFile(req.userId, from, to);
      return res.status(200).json({ ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";

      if (message === "path not found") return res.status(404).json({ message });
      if (message === "not a file") return res.status(400).json({ message });
      if (message === "target already exists") return res.status(409).json({ message });

      if (
        message === "parent directory does not exist" ||
        message === "parent is not a directory" ||
        message === "parent is read-only" ||
        message === "target parent does not exist" ||
        message === "target parent is not a directory" ||
        message === "target parent is read-only" ||
        message === "target parent required" ||
        message === "cannot move root" ||
        message === "cannot move from root"
      ) {
        return res.status(400).json({ message });
      }

      return res.status(500).json({ message: "internal error" });
    }
  });

  router.post("/copy", requireAuth, async (req, res) => {
    const { from, to } = req.body ?? {};

    if (!from || !to) return res.status(400).json({ message: "from and to required" });

    try {
      await fsService.copyFile(req.userId, from, to);
      return res.status(201).json({ ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";

      if (message === "path not found") return res.status(404).json({ message });
      if (message === "not a file") return res.status(400).json({ message });
      if (message === "target already exists") return res.status(409).json({ message });

      if (
        message === "parent directory does not exist" ||
        message === "parent is not a directory" ||
        message === "parent is read-only" ||
        message === "target parent does not exist" ||
        message === "target parent is not a directory" ||
        message === "target parent is read-only" ||
        message === "target parent required" ||
        message === "cannot copy root" ||
        message === "cannot copy from root"
      ) {
        return res.status(400).json({ message });
      }
      return res.status(500).json({ message: "internal error" });
    }
  });
  router.delete("/", requireAuth, async (req, res) => {
    const { path } = req.body ?? {};

    if (!path) return res.status(400).json({ message: "path required" });

    try {
      await fsService.deleteFile(req.userId, path);
      return res.status(200).json({ ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";

      if (message === "path not found") return res.status(404).json({ message });
      if (message === "not a file") return res.status(400).json({ message });
      if (message === "parent is read-only") return res.status(400).json({ message });
      if (message === "cannot delete root") return res.status(400).json({ message });
      if (message === "parent directory does not exist") return res.status(400).json({ message });

      return res.status(500).json({ message: "internal error" });
    }
  });

  return router;
}

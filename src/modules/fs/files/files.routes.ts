import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware";
import { FsService } from "../fs.service";
import { readBodyBuffer } from "../shared/read-body-buffer";

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

  router.get("/content", requireAuth, async (req, res) => {
    const q = req.query.path;
    if (Array.isArray(q)) return res.status(400).json({ message: "path required" });

    const path = String(q ?? "");
    if (!path) return res.status(400).json({ message: "path required" });

    try {
      const { hash, content } = await fsService.readFileContent(req.userId, path);

      res.setHeader("content-type", "application/octet-stream");
      res.setHeader("content-length", String(content.length));
      res.setHeader("etag", hash);

      return res.status(200).send(content);
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";

      if (message === "path not found") return res.status(404).json({ message });
      if (message === "not a file") return res.status(400).json({ message });
      if (message === "cannot read root") return res.status(400).json({ message });

      if (message === "file has no content") return res.status(404).json({ message });
      if (message === "blob not found") return res.status(500).json({ message: "internal error", detail: message });

      return res.status(500).json({ message: "internal error" });
    }
  });

  router.put("/content", requireAuth, async (req, res) => {
    const q = req.query.path;
    if (Array.isArray(q)) return res.status(400).json({ message: "path required" });

    const path = String(q ?? "");
    if (!path) return res.status(400).json({ message: "path required" });

    try {
      const content = await readBodyBuffer(req, 10 * 1024 * 1024);
      const result = await fsService.writeFileContent(req.userId, path, content);
      return res.status(200).json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";

      if (message === "payload too large") return res.status(413).json({ message });
      if (message === "path not found") return res.status(404).json({ message });
      if (message === "not a file") return res.status(400).json({ message });
      if (message === "invalid request body" || message === "request aborted") return res.status(400).json({ message });

      if (
        message === "cannot write to root" ||
        message === "cannot write at root" ||
        message === "parent directory does not exist" ||
        message === "parent is not a directory" ||
        message === "parent is read-only" ||
        message === "file is read-only"
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

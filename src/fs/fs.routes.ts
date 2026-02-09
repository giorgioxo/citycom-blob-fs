import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { FsService } from "./fs.service";
import { InMemoryMetadataStore } from "../metadata/in-memory-metadata.store";

const fsRouter = Router();
const metadata = new InMemoryMetadataStore();
const fsService = new FsService(metadata);

fsRouter.post("/directories", requireAuth, async (req, res) => {
  const { path } = req.body ?? {};

  if (!path) {
    return res.status(400).json({ message: "path required" });
  }

  try {
    await fsService.createDirectory(req.userId, path);
    return res.status(201).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    if (message === "path already exists") {
      return res.status(409).json({ message });
    }
    if (message === "parent directory does not exist") {
      return res.status(400).json({ message });
    }
    if (message === "parent is not a directory") {
      return res.status(400).json({
        message,
      });
    }
    if (message === "parent is read-only") {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "internal error" });
  }
});

fsRouter.post("/directories/move", requireAuth, async (req, res) => {
  const { from, to } = req.body ?? {};

  if (!from || !to) return res.status(400).json({ message: "from and to required" });

  try {
    await fsService.moveDirectory(req.userId, from, to);
    return res.status(200).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";

    if (message === "path not found") return res.status(404).json({ message });
    if (message === "not a directory") return res.status(400).json({ message });
    if (message === "target already exists") return res.status(409).json({ message });

    if (
      message === "cannot move root" ||
      message === "cannot move from root" ||
      message === "target parent required" ||
      message === "cannot move directory into itself" ||
      message === "parent directory does not exist" ||
      message === "parent is not a directory" ||
      message === "parent is read-only" ||
      message === "target parent does not exist" ||
      message === "target parent is not a directory" ||
      message === "target parent is read-only"
    ) {
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: "internal error" });
  }
});

fsRouter.post("/directories/copy", requireAuth, async (req, res) => {
  const { from, to } = req.body ?? {};

  if (!from || !to) return res.status(400).json({ message: "from and to required" });

  try {
    await fsService.copyDirectory(req.userId, from, to);
    return res.status(201).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";

    if (message === "path not found") return res.status(404).json({ message });
    if (message === "not a directory") return res.status(400).json({ message });
    if (message === "target already exists") return res.status(409).json({ message });

    if (
      message === "cannot copy root" ||
      message === "cannot copy from root" ||
      message === "target parent required" ||
      message === "cannot copy directory into itself" ||
      message === "parent directory does not exist" ||
      message === "parent is not a directory" ||
      message === "parent is read-only" ||
      message === "target parent does not exist" ||
      message === "target parent is not a directory" ||
      message === "target parent is read-only"
    ) {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "internal error" });
  }
});

fsRouter.post("/files", requireAuth, async (req, res) => {
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

fsRouter.post("/files/move", requireAuth, async (req, res) => {
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

fsRouter.post("/files/copy", requireAuth, async (req, res) => {
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

fsRouter.patch("/nodes/read-only", requireAuth, async (req, res) => {
  const { path, readOnly } = req.body ?? {};

  if (!path || typeof readOnly !== "boolean") {
    return res.status(400).json({ message: "path and readOnly(boolean) required" });
  }

  try {
    await fsService.setReadOnly(req.userId, path, readOnly);
    return res.status(200).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    if (message === "path not found") {
      return res.status(404).json({ message });
    }
    if (message === "cannot change root permissions") {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "internal error" });
  }
});

fsRouter.get("/nodes", requireAuth, async (req, res) => {
  const path = String(req.query.path ?? "");

  if (!path) {
    return res.status(400).json({ message: "path required" });
  }

  try {
    const nodes = await fsService.listNodesRecursive(req.userId, path);

    return res.status(200).json({ nodes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";

    if (message === "path not found") return res.status(404).json({ message });
    if (message === "path is not a directory") return res.status(400).json({ message });

    return res.status(500).json({ message: "internal error", detail: message });
  }
});

fsRouter.get("/info", requireAuth, async (req, res) => {
  const path = String(req.query.path ?? "");

  if (!path) return res.status(400).json({ message: "path required" });

  try {
    const node = await fsService.getInfo(req.userId, path);
    return res.status(200).json({ node });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";

    if (message === "path not found") return res.status(404).json({ message });
    return res.status(500).json({ message: "internal error" });
  }
});

fsRouter.delete("/files", requireAuth, async (req, res) => {
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

fsRouter.delete("/directories", requireAuth, async (req, res) => {
  const { path } = req.body ?? {};

  if (!path) return res.status(400).json({ message: "path required" });

  try {
    await fsService.deleteDirectory(req.userId, path);
    return res.status(200).json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";

    if (message === "path not found") return res.status(404).json({ message });
    if (message === "not a directory") return res.status(400).json({ message });
    if (message === "cannot delete root") return res.status(400).json({ message });
    if (message === "parent is read-only") return res.status(400).json({ message });
    if (message === "parent directory does not exist") return res.status(400).json({ message });

    return res.status(500).json({ message: "internal error" });
  }
});

export { fsRouter };

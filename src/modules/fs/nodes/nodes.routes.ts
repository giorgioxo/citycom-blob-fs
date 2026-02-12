import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware";
import { FsService } from "../fs.service";
import { toPublicFsNode } from "../shared/fs-node.dto";

export function nodesRouter(fsService: FsService): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
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
  router.patch("/read-only", requireAuth, async (req, res) => {
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

  router.get("/info", requireAuth, async (req, res) => {
    const path = String(req.query.path ?? "");

    if (!path) return res.status(400).json({ message: "path required" });

    try {
      const node = await fsService.getInfo(req.userId, path);
      return res.status(200).json({ node: toPublicFsNode(node) });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";

      if (message === "path not found") return res.status(404).json({ message });
      return res.status(500).json({ message: "internal error" });
    }
  });

  return router;
}

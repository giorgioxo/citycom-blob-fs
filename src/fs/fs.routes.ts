import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { FsService } from "./fs.service";
import { InMemoryMetadataStore } from "../metadata/metadata.store";

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
    return res.status(500).json({ message: "internal error" });
  }
});

export { fsRouter };

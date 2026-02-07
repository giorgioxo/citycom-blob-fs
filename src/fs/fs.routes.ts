import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { FsService } from "./fs.service";

const fsRouter = Router();
const fsService = new FsService();

fsRouter.post("/directories", requireAuth, async (req, res) => {
  const { path } = req.body ?? {};

  if (!path) {
    return res.status(400).json({ message: "path required" });
  }
});

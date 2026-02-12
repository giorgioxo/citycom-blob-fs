import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { openapi } from "./openapi";
import { authRouter } from "./modules/auth/auth.route";
import { fsRouter } from "./modules/fs/fs.routes";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // swagger
  app.get("/docs.json", (_req, res) => res.json(openapi));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

  // routes
  app.use("/auth", authRouter);
  app.use("/api/fs", fsRouter);

  // health
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { openapi } from "./openapi";
import { authRouter } from "./modules/auth/auth.route";
import { fsRouter } from "./modules/fs/fs.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/docs.json", (_req, res) => res.json(openapi));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/api/fs", fsRouter);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`api listening on localhost:${port}`);
});

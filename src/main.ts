import express from "express";
import "dotenv/config";
import { authRouter } from "./modules/auth/auth.route";
import { fsRouter } from "./modules/fs/fs.routes";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);

app.use("/api/fs", fsRouter);

const port = 3000;

app.listen(port, () => {
  console.log(`api listening on localhost:${port}`);
});

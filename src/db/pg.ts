import pg from "pg";
import { mustGetEnv } from "../modules/auth/env";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: mustGetEnv("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/fsdb",
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("pg pool error", err);
});

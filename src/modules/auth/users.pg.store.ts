import { createHash } from "crypto";
import { pool } from "../../db/pg";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUser(id: string, username: string, passwordHash: string): Promise<User> {
  await pool.query(`INSERT INTO users (id, username, password_hash) VALUES ($1,$2,$3)`, [id, username, passwordHash]);
  return { id, username, passwordHash };
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const r = await pool.query(`SELECT id, username, password_hash FROM users WHERE username=$1 LIMIT 1`, [username]);
  if (r.rows.length === 0) return undefined;
  const u = r.rows[0];
  return { id: u.id, username: u.username, passwordHash: u.password_hash };
}

export async function findUserById(id: string): Promise<User | undefined> {
  const r = await pool.query(`SELECT id, username, password_hash FROM users WHERE id=$1 LIMIT 1`, [id]);
  if (r.rows.length === 0) return undefined;
  const u = r.rows[0];
  return { id: u.id, username: u.username, passwordHash: u.password_hash };
}

export async function addRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const h = hashToken(refreshToken);
  await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId, h]);
}

export async function hasRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
  const h = hashToken(refreshToken);
  const r = await pool.query(`SELECT 1 FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 LIMIT 1`, [userId, h]);
  return r.rows.length > 0;
}

export async function removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const h = hashToken(refreshToken);
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2`, [userId, h]);
}

export async function removeAllRefreshTokens(userId: string): Promise<void> {
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id=$1`, [userId]);
}
export async function getWorkingDirectory(userId: string): Promise<string> {
  const r = await pool.query(`select working_directory from users where id = $1`, [userId]);

  if (r.rows.length === 0) {
    throw new Error("user not found");
  }

  return r.rows[0].working_directory;
}

export async function setWorkingDirectory(userId: string, path: string): Promise<void> {
  const r = await pool.query(`update users set working_directory = $2 where id = $1`, [userId, path]);

  if ((r.rowCount ?? 0) === 0) {
    throw new Error("user not found");
  }
}

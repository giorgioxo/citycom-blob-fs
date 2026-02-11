import { createHash } from "crypto";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  refreshTokenHashes: Set<string>;
};

const usersByUsername = new Map<string, User>();
const usersById = new Map<string, User>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createUser(id: string, username: string, passwordHash: string): User {
  const user: User = {
    id,
    username,
    passwordHash,
    refreshTokenHashes: new Set<string>(),
  };
  usersByUsername.set(username, user);
  usersById.set(id, user);
  return user;
}

export function findUserByUsername(username: string): User | undefined {
  return usersByUsername.get(username);
}

export function findUserById(id: string): User | undefined {
  return usersById.get(id);
}

export function addRefreshToken(userId: string, refreshToken: string): void {
  const user = findUserById(userId);
  if (!user) return;
  user.refreshTokenHashes.add(hashToken(refreshToken));
}

export function hasRefreshToken(userId: string, refreshToken: string): boolean {
  const user = findUserById(userId);
  if (!user) return false;
  return user.refreshTokenHashes.has(hashToken(refreshToken));
}

export function removeRefreshToken(userId: string, refreshToken: string): void {
  const user = findUserById(userId);
  if (!user) return;
  user.refreshTokenHashes.delete(hashToken(refreshToken));
}

export function removeAllRefreshTokens(userId: string): void {
  const user = findUserById(userId);
  if (!user) return;
  user.refreshTokenHashes.clear();
}

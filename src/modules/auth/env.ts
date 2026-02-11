export const isProd = process.env.NODE_ENV === "production";

// In production secrets MUST be provided via env.
// In development we allow fallback secrets for easier run.

export function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (isProd && (!v || v.trim() === "")) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v ?? "";
}

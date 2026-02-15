export const isProd = process.env.NODE_ENV === "production";

export function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (isProd && (!v || v.trim() === "")) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v ?? "";
}

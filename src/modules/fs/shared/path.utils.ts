export function normalizePath(path: string): string {
  let p = path.trim();

  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+$/, "");

  return p === "" ? "/" : p;
}

export function parentOf(path: string): string | null {
  if (path === "/") return null;
  const idx = path.lastIndexOf("/");
  if (idx === 0) return "/";
  return path.slice(0, idx);
}

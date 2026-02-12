import { normalizePath } from "./path.utils";
import { getWorkingDirectory } from "../../auth/users.pg.store";

export async function resolvePath(ownerId: string, inputPath: string): Promise<string> {
  const p = String(inputPath ?? "").trim();
  if (!p) return "/";
  if (p.startsWith("/")) return normalizePath(p);

  const cwd = await getWorkingDirectory(ownerId);
  const full = cwd === "/" ? `/${p}` : `${cwd}/${p}`;
  return normalizePath(full);
}

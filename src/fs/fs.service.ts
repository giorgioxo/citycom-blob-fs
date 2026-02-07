import type { MetadataStore } from "../metadata/metadata.store";

export class FsService {
  constructor(private readonly metadata: MetadataStore) {}

  async createDirectory(ownerId: string, path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    const parentPath = this.parentOf(normalizedPath);

    const exists = await this.metadata.exists(ownerId, normalizedPath);

    if (exists) {
      throw new Error("path already exists");
    }

    if (parentPath !== null) {
      const parentNode = await this.metadata.getNode(ownerId, parentPath);
      if (!parentNode) {
        throw new Error("parent directory does not exist");
      }

      if (parentNode.kind !== "dir") {
        throw new Error("parent is not a directory");
      }
    }

    const now = new Date();

    await this.metadata.createNode({
      ownerId,
      path: normalizedPath,
      kind: "dir",
      createDate: now,
      updateDate: now,
    });
  }

  private normalizePath(path: string): string {
    let p = path.trim();

    if (!p.startsWith("/")) p = "/" + p;
    p = p.replace(/\/+$/, "");

    return p === "" ? "/" : p;
  }

  private parentOf(path: string): string | null {
    if (path === "/") return null;
    const idx = path.lastIndexOf("/");
    if (idx === 0) return "/";
    return path.slice(0, idx);
  }
}

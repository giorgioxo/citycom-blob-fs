import type { MetadataStore, FsNode } from "../metadata/metadata.store";

export class FsService {
  constructor(private readonly metadata: MetadataStore) {}

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

      if (parentNode.readOnly) {
        throw new Error("parent is read-only");
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

  async setReadOnly(ownerId: string, path: string, readOnly: boolean): Promise<void> {
    const normalizedPath = this.normalizePath(path);

    await this.metadata.updateNode(ownerId, normalizedPath, {
      readOnly,
      updateDate: new Date(),
    });
  }

  async listNodesRecursive(ownerId: string, path: string): Promise<FsNode[]> {
    const base = this.normalizePath(path);

    const baseNode = await this.metadata.getNode(ownerId, base);
    if (!baseNode) {
      throw new Error("path not found");
    }
    if (baseNode.kind !== "dir") {
      throw new Error("path is not a directory");
    }

    const prefix = base === "/" ? "/" : base + "/";

    const nodes = await this.metadata.listByPrefix(ownerId, prefix);

    return nodes.filter((n) => n.path !== base);
  }

  async createFile(ownerId: string, path: string, size?: number): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    const parentPath = this.parentOf(normalizedPath);

    const exists = await this.metadata.exists(ownerId, normalizedPath);
    if (exists) {
      throw new Error("path already exists");
    }
    if (parentPath === null) {
      throw new Error("cannot create file at root");
    }

    const parentNode = await this.metadata.getNode(ownerId, parentPath);
    if (!parentNode) {
      throw new Error("parent directory does not exist");
    }
    if (parentNode.kind !== "dir") {
      throw new Error("parent is not a directory");
    }
    if (parentNode.readOnly) {
      throw new Error("parent is read-only");
    }
    const now = new Date();
    await this.metadata.createNode({
      ownerId,
      path: normalizedPath,
      kind: "file",
      createDate: now,
      updateDate: now,
      size,
    });
  }
}

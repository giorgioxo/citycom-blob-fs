import { FsNode, MetadataStore } from "./metadata.store";

export class InMemoryMetadataStore implements MetadataStore {
  private readonly nodes = new Map<string, FsNode>();

  async createNode(node: FsNode): Promise<void> {
    this.nodes.set(this.key(node.ownerId, node.path), node);
  }

  async updateNode(ownerId: string, path: string, patch: Partial<FsNode>): Promise<void> {
    const key = this.key(ownerId, path);
    const current = this.nodes.get(key);
    if (!current) throw new Error("path not found");
    this.nodes.set(key, { ...current, ...patch });
  }

  async exists(ownerId: string, path: string): Promise<boolean> {
    if (path === "/" && !this.nodes.has(this.key(ownerId, "/"))) {
      const now = new Date();
      this.nodes.set(this.key(ownerId, "/"), {
        ownerId,
        path: "/",
        kind: "dir",
        createDate: now,
        updateDate: now,
      });
    }
    return this.nodes.has(this.key(ownerId, path));
  }

  async getNode(ownerId: string, path: string): Promise<FsNode | undefined> {
    const key = this.key(ownerId, path);
    if (path === "/" && !this.nodes.has(key)) {
      const now = new Date();
      this.nodes.set(key, { ownerId, path: "/", kind: "dir", createDate: now, updateDate: now });
    }
    return this.nodes.get(key);
  }

  async moveNode(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const fromKey = this.key(ownerId, fromPath);
    const toKey = this.key(ownerId, toPath);

    const current = this.nodes.get(fromKey);
    if (!current) throw new Error("path not found");

    if (this.nodes.has(toKey)) throw new Error("target already exists");

    this.nodes.delete(fromKey);
    this.nodes.set(toKey, { ...current, path: toPath });
  }

  async listByPrefix(ownerId: string, prefix: string): Promise<FsNode[]> {
    const out: FsNode[] = [];
    const pfx = `${ownerId}:${prefix}`;
    for (const [key, node] of this.nodes) {
      if (key.startsWith(pfx)) out.push(node);
    }
    return out;
  }

  async listChildren(ownerId: string, dirPath: string, limit: number, afterPath?: string): Promise<FsNode[]> {
    const base = dirPath;
    const prefix = base === "/" ? "/" : base + "/";

    const out: FsNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.ownerId !== ownerId) continue;
      if (node.path === base) continue;
      if (!node.path.startsWith(prefix)) continue;

      const suffix = node.path.slice(prefix.length);
      if (!suffix) continue;
      if (suffix.includes("/")) continue;

      if (afterPath && node.path <= afterPath) continue;

      out.push(node);
    }

    out.sort((a, b) => a.path.localeCompare(b.path));
    return out.slice(0, limit);
  }

  async deleteNode(ownerId: string, path: string): Promise<void> {
    const key = this.key(ownerId, path);
    const exists = this.nodes.has(key);
    if (!exists) throw new Error("path not found");
    this.nodes.delete(key);
  }

  private key(ownerId: string, path: string): string {
    return `${ownerId}:${path}`;
  }
}

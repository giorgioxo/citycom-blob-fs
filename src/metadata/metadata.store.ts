export type FsNodeKind = "dir" | "file";

export type FsNode = {
  ownerId: string;
  path: string;
  kind: FsNodeKind;
  createDate: Date;
  updateDate: Date;
  size?: number;
  blobHash?: number;
};

export interface MetadataStore {
  createNode(node: FsNode): Promise<void>;
  exists(ownerId: string, path: string): Promise<boolean>;
  getNode(ownerId: string, path: string): Promise<FsNode | undefined>;
  listByPrefix(ownerId: string, prefix: string): Promise<FsNode[]>;
}

export class InMemoryMetadataStore implements MetadataStore {
  private readonly nodes = new Map<string, FsNode>();

  async createNode(node: FsNode): Promise<void> {
    this.nodes.set(this.key(node.ownerId, node.path), node);
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

  async listByPrefix(ownerId: string, prefix: string): Promise<FsNode[]> {
    const out: FsNode[] = [];
    const pfx = `${ownerId}:${prefix}`;
    for (const [key, node] of this.nodes) {
      if (key.startsWith(pfx)) out.push(node);
    }
    return out;
  }

  private key(ownerId: string, path: string): string {
    return `${ownerId}:${path}`;
  }
}

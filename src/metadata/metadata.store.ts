export type FsNodeKind = "dir" | "file";

export type FsNode = {
  ownerId: string;
  path: string;
  kind: FsNodeKind;
  createDate: Date;
  updateDate: Date;
};

export interface MetadataStore {
  createNode(node: FsNode): Promise<void>;
  exists(ownerId: string, path: string): Promise<boolean>;
  getNode(ownerId: string, path: string): Promise<FsNode | undefined>;
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

  private key(ownerId: string, path: string): string {
    return `${ownerId}:${path}`;
  }
}

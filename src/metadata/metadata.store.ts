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
}

export class InMemoryMetadataStore implements MetadataStore {
  private readonly nodes = new Map<string, FsNode>();

  async createNode(node: FsNode): Promise<void> {
    this.nodes.set(this.key(node.ownerId, node.path), node);
  }

  async exists(ownerId: string, path: string): Promise<boolean> {
    return this.nodes.has(this.key(ownerId, path));
  }

  private key(ownerId: string, path: string): string {
    return `${ownerId}:${path}`;
  }
}

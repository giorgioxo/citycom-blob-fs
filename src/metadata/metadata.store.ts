export type FsNodeKind = "dir" | "file";

export type FsNode = {
  ownerId: string;
  path: string;
  kind: FsNodeKind;
  createDate: Date;
  updateDate: Date;
  size?: number;
  blobHash?: string;
  readOnly?: boolean;
};

export interface MetadataStore {
  createNode(node: FsNode): Promise<void>;
  updateNode(ownerId: string, path: string, patch: Partial<FsNode>): Promise<void>;
  exists(ownerId: string, path: string): Promise<boolean>;
  getNode(ownerId: string, path: string): Promise<FsNode | undefined>;
  listByPrefix(ownerId: string, prefix: string): Promise<FsNode[]>;
  deleteNode(ownerId: string, path: string): Promise<void>;
}

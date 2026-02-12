export type DbClient = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }>;
};

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
  createNode(node: FsNode, tx?: DbClient): Promise<void>;
  updateNode(ownerId: string, path: string, patch: Partial<FsNode>, tx?: DbClient): Promise<void>;
  exists(ownerId: string, path: string, tx?: DbClient): Promise<boolean>;
  getNode(ownerId: string, path: string, tx?: DbClient): Promise<FsNode | undefined>;
  listByPrefix(ownerId: string, prefix: string, tx?: DbClient): Promise<FsNode[]>;
  listChildren(ownerId: string, dirPath: string, limit: number, afterPath?: string, tx?: DbClient): Promise<FsNode[]>;
  deleteNode(ownerId: string, path: string, tx?: DbClient): Promise<void>;
  moveNode(ownerId: string, fromPath: string, toPath: string, tx?: DbClient): Promise<void>;
}

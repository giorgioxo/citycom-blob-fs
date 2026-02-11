import type { DbClient } from "../metadata/metadata.store";

export type BlobHash = string;

export interface BlobStore {
  put(content: Buffer, tx?: DbClient): Promise<{ hash: BlobHash; size: number }>;
  get(hash: BlobHash, tx?: DbClient): Promise<Buffer | undefined>;
  retain(hash: BlobHash, tx?: DbClient): Promise<void>;
  release(hash: BlobHash, tx?: DbClient): Promise<void>;
}

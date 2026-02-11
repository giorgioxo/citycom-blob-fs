export type BlobHash = string;

export interface BlobStore {
  put(content: Buffer): Promise<{ hash: BlobHash; size: number }>;
  get(hash: BlobHash): Promise<Buffer | undefined>;
  retain(hash: BlobHash): Promise<void>;
  release(hash: BlobHash): Promise<void>;
}

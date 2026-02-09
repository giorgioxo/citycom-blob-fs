export type BlobHash = string;

export interface BlobStore {
  put(content: Buffer): Promise<{ hash: BlobHash; size: number }>;
  get(hash: BlobHash): Promise<Buffer | undefined>;
  release(hash: BlobHash): Promise<void>;
}

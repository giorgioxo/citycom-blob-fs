import type { BlobStore, BlobHash } from "./blob.store";
import { hashBuffer } from "./blob-hash";

export class InMemoryBlobStore implements BlobStore {
  private readonly blobs = new Map<BlobHash, Buffer>();

  async put(content: Buffer): Promise<{ hash: BlobHash; size: number }> {
    const hash = hashBuffer(content);

    if (!this.blobs.has(hash)) {
      this.blobs.set(hash, Buffer.from(content));
    }
    return { hash, size: content.length };
  }

  async get(hash: BlobHash): Promise<Buffer | undefined> {
    return this.blobs.get(hash);
  }

  async release(hash: BlobHash): Promise<void> {
    this.blobs.delete(hash);
  }
}

import type { BlobStore, BlobHash } from "./blob.store";
import { hashBuffer } from "./blob-hash";

type StoreBlob = {
  content: Buffer;
  refCount: number;
};

export class InMemoryBlobStore implements BlobStore {
  private readonly blobs = new Map<BlobHash, StoreBlob>();

  async put(content: Buffer): Promise<{ hash: BlobHash; size: number }> {
    const hash = hashBuffer(content);
    const existing = this.blobs.get(hash);

    if (existing) {
      existing.refCount += 1;
      return { hash, size: existing.content.length };
    }

    this.blobs.set(hash, { content: Buffer.from(content), refCount: 1 });
    return { hash, size: content.length };
  }

  async get(hash: BlobHash): Promise<Buffer | undefined> {
    return this.blobs.get(hash)?.content;
  }

  async retain(hash: BlobHash): Promise<void> {
    const existing = this.blobs.get(hash);
    if (!existing) return;
    existing.refCount += 1;
  }

  async release(hash: BlobHash): Promise<void> {
    const existing = this.blobs.get(hash);
    if (!existing) return;

    existing.refCount -= 1;

    if (existing.refCount <= 0) {
      this.blobs.delete(hash);
    }
  }
}

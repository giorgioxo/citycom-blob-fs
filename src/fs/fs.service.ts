import type { MetadataStore } from "../metadata/metadata.store";

export class FsService {
  constructor(private readonly metadata: MetadataStore) {}

  async createDirectory(ownerId: string, path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    const exists = await this.metadata.exists(ownerId, normalizedPath);

    if (exists) {
      throw new Error("path already exists");
    }

    const now = new Date();

    await this.metadata.createNode({
      ownerId,
      path: normalizedPath,
      kind: "dir",
      createDate: now,
      updateDate: now,
    });
  }

  private normalizePath(path: string): string {
    let p = path.trim();

    if (!p.startsWith("/")) p = "/" + p;
    p = p.replace(/\/+$/, "");

    return p === "" ? "/" : p;
  }
}

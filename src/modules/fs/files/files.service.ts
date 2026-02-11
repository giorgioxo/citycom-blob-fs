import type { MetadataStore } from "../../metadata/metadata.store";
import { normalizePath, parentOf } from "../shared/path.utils";
import type { BlobStore } from "../../blob/blob.store";
import { hashBuffer } from "../../blob/blob-hash";

export class FilesService {
  constructor(private readonly metadata: MetadataStore, private readonly blobs: BlobStore) {}

  async createFile(ownerId: string, path: string, size?: number): Promise<void> {
    const normalizedPath = normalizePath(path);
    const parentPath = parentOf(normalizedPath);

    const exists = await this.metadata.exists(ownerId, normalizedPath);
    if (exists) throw new Error("path already exists");
    if (parentPath === null) throw new Error("cannot create file at root");

    const parentNode = await this.metadata.getNode(ownerId, parentPath);
    if (!parentNode) throw new Error("parent directory does not exist");
    if (parentNode.kind !== "dir") throw new Error("parent is not a directory");
    if (parentNode.readOnly) throw new Error("parent is read-only");

    const now = new Date();
    await this.metadata.createNode({
      ownerId,
      path: normalizedPath,
      kind: "file",
      createDate: now,
      updateDate: now,
      size,
    });
  }

  async moveFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = normalizePath(fromPath);
    const to = normalizePath(toPath);

    if (from === "/" || to === "/") throw new Error("cannot move root");

    const node = await this.metadata.getNode(ownerId, from);
    if (!node) throw new Error("path not found");
    if (node.kind !== "file") throw new Error("not a file");

    const targetExists = await this.metadata.exists(ownerId, to);
    if (targetExists) throw new Error("target already exists");

    const fromParent = parentOf(from);
    if (!fromParent) throw new Error("cannot move from root");

    const toParent = parentOf(to);
    if (!toParent) throw new Error("target parent required");

    const fromParentNode = await this.metadata.getNode(ownerId, fromParent);
    if (!fromParentNode) throw new Error("parent directory does not exist");
    if (fromParentNode.kind !== "dir") throw new Error("parent is not a directory");
    if (fromParentNode.readOnly) throw new Error("parent is read-only");

    const toParentNode = await this.metadata.getNode(ownerId, toParent);
    if (!toParentNode) throw new Error("target parent does not exist");
    if (toParentNode.kind !== "dir") throw new Error("target parent is not a directory");
    if (toParentNode.readOnly) throw new Error("target parent is read-only");

    await this.metadata.moveNode(ownerId, from, to);
    await this.metadata.updateNode(ownerId, to, { updateDate: new Date() });
  }

  async copyFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = normalizePath(fromPath);
    const to = normalizePath(toPath);

    if (from === "/" || to === "/") throw new Error("cannot copy root");

    const source = await this.metadata.getNode(ownerId, from);
    if (!source) throw new Error("path not found");
    if (source.kind !== "file") throw new Error("not a file");

    const targetExists = await this.metadata.exists(ownerId, to);
    if (targetExists) throw new Error("target already exists");

    const fromParent = parentOf(from);
    if (!fromParent) throw new Error("cannot copy from root");

    const toParent = parentOf(to);
    if (!toParent) throw new Error("target parent required");

    const fromParentNode = await this.metadata.getNode(ownerId, fromParent);
    if (!fromParentNode) throw new Error("parent directory does not exist");
    if (fromParentNode.kind !== "dir") throw new Error("parent is not a directory");
    if (fromParentNode.readOnly) throw new Error("parent is read-only");

    const toParentNode = await this.metadata.getNode(ownerId, toParent);
    if (!toParentNode) throw new Error("target parent does not exist");
    if (toParentNode.kind !== "dir") throw new Error("target parent is not a directory");
    if (toParentNode.readOnly) throw new Error("target parent is read-only");

    const now = new Date();

    await this.metadata.createNode({
      ownerId,
      path: to,
      kind: "file",
      createDate: now,
      updateDate: now,
      size: source.size,
      blobHash: source.blobHash,
      readOnly: source.readOnly,
    });

    if (source.blobHash) {
      await this.blobs.retain(source.blobHash);
    }
  }

  async writeFileContent(ownerId: string, path: string, content: Buffer): Promise<{ hash: string; size: number }> {
    const filePath = normalizePath(path);
    if (filePath === "/") throw new Error("cannot write to root");

    const node = await this.metadata.getNode(ownerId, filePath);
    if (!node) throw new Error("path not found");
    if (node.kind !== "file") throw new Error("not a file");

    const parentPath = parentOf(filePath);
    if (!parentPath) throw new Error("cannot write at root");

    const parentNode = await this.metadata.getNode(ownerId, parentPath);
    if (!parentNode) throw new Error("parent directory does not exist");
    if (parentNode.kind !== "dir") throw new Error("parent is not a directory");
    if (parentNode.readOnly) throw new Error("parent is read-only");
    if (node.readOnly) throw new Error("file is read-only");

    const oldHash = node.blobHash;
    const newHash = hashBuffer(content);
    const newSize = content.length;

    if (oldHash && oldHash === newHash) {
      await this.metadata.updateNode(ownerId, filePath, {
        size: newSize,
        updateDate: new Date(),
      });
      return { hash: newHash, size: newSize };
    }

    const { hash, size } = await this.blobs.put(content);

    await this.metadata.updateNode(ownerId, filePath, {
      blobHash: hash,
      size,
      updateDate: new Date(),
    });

    if (oldHash) {
      await this.blobs.release(oldHash);
    }

    return { hash, size };
  }

  async deleteFile(ownerId: string, path: string): Promise<void> {
    const normalizedPath = normalizePath(path);

    if (normalizedPath === "/") throw new Error("cannot delete root");

    const node = await this.metadata.getNode(ownerId, normalizedPath);

    if (!node) throw new Error("path not found");
    if (node.kind !== "file") throw new Error("not a file");

    const parentPath = parentOf(normalizedPath);

    if (parentPath) {
      const parentNode = await this.metadata.getNode(ownerId, parentPath);

      if (!parentNode) throw new Error("parent directory does not exist");
      if (parentNode.readOnly) throw new Error("parent is read-only");
    }

    const oldHash = node.blobHash;

    await this.metadata.deleteNode(ownerId, normalizedPath);

    if (oldHash) {
      await this.blobs.release(oldHash);
    }
  }
}

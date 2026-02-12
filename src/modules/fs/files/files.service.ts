import type { MetadataStore } from "../../metadata/metadata.store";
import type { BlobStore } from "../../blob/blob.store";
import { parentOf } from "../shared/path.utils";
import { resolvePath } from "../shared/resolve-path";
import { withTx } from "../../../db/pg";
import { hashBuffer } from "../../blob/blob-hash";

export class FilesService {
  constructor(private readonly metadata: MetadataStore, private readonly blobs: BlobStore) {}

  async createFile(ownerId: string, path: string, size?: number): Promise<void> {
    return withTx(async (tx) => {
      const normalizedPath = await resolvePath(ownerId, path);
      const parentPath = parentOf(normalizedPath);

      const exists = await this.metadata.exists(ownerId, normalizedPath, tx);
      if (exists) throw new Error("path already exists");
      if (parentPath === null) throw new Error("cannot create file at root");

      const parentNode = await this.metadata.getNode(ownerId, parentPath, tx);
      if (!parentNode) throw new Error("parent directory does not exist");
      if (parentNode.kind !== "dir") throw new Error("parent is not a directory");
      if (parentNode.readOnly) throw new Error("parent is read-only");

      const now = new Date();
      await this.metadata.createNode(
        {
          ownerId,
          path: normalizedPath,
          kind: "file",
          createDate: now,
          updateDate: now,
          size,
          readOnly: false,
        },
        tx
      );
    });
  }

  async moveFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return withTx(async (tx) => {
      const from = await resolvePath(ownerId, fromPath);
      const to = await resolvePath(ownerId, toPath);

      if (from === "/" || to === "/") throw new Error("cannot move root");

      const node = await this.metadata.getNode(ownerId, from, tx);
      if (!node) throw new Error("path not found");
      if (node.kind !== "file") throw new Error("not a file");

      const targetExists = await this.metadata.exists(ownerId, to, tx);
      if (targetExists) throw new Error("target already exists");

      const fromParent = parentOf(from);
      if (!fromParent) throw new Error("cannot move from root");

      const toParent = parentOf(to);
      if (!toParent) throw new Error("target parent required");

      const fromParentNode = await this.metadata.getNode(ownerId, fromParent, tx);
      if (!fromParentNode) throw new Error("parent directory does not exist");
      if (fromParentNode.kind !== "dir") throw new Error("parent is not a directory");
      if (fromParentNode.readOnly) throw new Error("parent is read-only");

      const toParentNode = await this.metadata.getNode(ownerId, toParent, tx);
      if (!toParentNode) throw new Error("target parent does not exist");
      if (toParentNode.kind !== "dir") throw new Error("target parent is not a directory");
      if (toParentNode.readOnly) throw new Error("target parent is read-only");

      await this.metadata.moveNode(ownerId, from, to, tx);
      await this.metadata.updateNode(ownerId, to, { updateDate: new Date() }, tx);
    });
  }

  async copyFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = await resolvePath(ownerId, fromPath);
    const to = await resolvePath(ownerId, toPath);

    if (from === "/" || to === "/") throw new Error("cannot copy root");

    return withTx(async (tx) => {
      const source = await this.metadata.getNode(ownerId, from, tx);
      if (!source) throw new Error("path not found");
      if (source.kind !== "file") throw new Error("not a file");

      const targetExists = await this.metadata.exists(ownerId, to, tx);
      if (targetExists) throw new Error("target already exists");

      const fromParent = parentOf(from);
      if (!fromParent) throw new Error("cannot copy from root");

      const toParent = parentOf(to);
      if (!toParent) throw new Error("target parent required");

      const fromParentNode = await this.metadata.getNode(ownerId, fromParent, tx);
      if (!fromParentNode) throw new Error("parent directory does not exist");
      if (fromParentNode.kind !== "dir") throw new Error("parent is not a directory");
      if (fromParentNode.readOnly) throw new Error("parent is read-only");

      const toParentNode = await this.metadata.getNode(ownerId, toParent, tx);
      if (!toParentNode) throw new Error("target parent does not exist");
      if (toParentNode.kind !== "dir") throw new Error("target parent is not a directory");
      if (toParentNode.readOnly) throw new Error("target parent is read-only");

      const now = new Date();

      await this.metadata.createNode(
        {
          ownerId,
          path: to,
          kind: "file",
          createDate: now,
          updateDate: now,
          size: source.size,
          blobHash: source.blobHash,
          readOnly: source.readOnly ?? false,
        },
        tx
      );

      if (source.blobHash) {
        await this.blobs.retain(source.blobHash, tx);
      }
    });
  }

  async writeFileContent(ownerId: string, path: string, content: Buffer): Promise<{ hash: string; size: number }> {
    return withTx(async (tx) => {
      const filePath = await resolvePath(ownerId, path);
      if (filePath === "/") throw new Error("cannot write to root");

      const node = await this.metadata.getNode(ownerId, filePath, tx);
      if (!node) throw new Error("path not found");
      if (node.kind !== "file") throw new Error("not a file");

      const parentPath = parentOf(filePath);
      if (!parentPath) throw new Error("cannot write at root");

      const parentNode = await this.metadata.getNode(ownerId, parentPath, tx);
      if (!parentNode) throw new Error("parent directory does not exist");
      if (parentNode.kind !== "dir") throw new Error("parent is not a directory");
      if (parentNode.readOnly) throw new Error("parent is read-only");
      if (node.readOnly) throw new Error("file is read-only");

      const oldHash = node.blobHash;

      const newHash = hashBuffer(content);
      const newSize = content.length;

      if (oldHash && oldHash === newHash) {
        await this.metadata.updateNode(ownerId, filePath, { size: newSize, updateDate: new Date() }, tx);
        return { hash: newHash, size: newSize };
      }

      const { hash, size } = await this.blobs.put(content, tx);

      await this.metadata.updateNode(ownerId, filePath, { blobHash: hash, size, updateDate: new Date() }, tx);

      if (oldHash) {
        await this.blobs.release(oldHash, tx);
      }

      return { hash, size };
    });
  }

  async readFileContent(ownerId: string, path: string): Promise<{ hash: string; content: Buffer }> {
    const filePath = await resolvePath(ownerId, path);
    if (filePath === "/") throw new Error("cannot read root");

    const node = await this.metadata.getNode(ownerId, filePath);
    if (!node) throw new Error("path not found");
    if (node.kind !== "file") throw new Error("not a file");

    const hash = node.blobHash;
    if (!hash) throw new Error("file has no content");

    const content = await this.blobs.get(hash);
    if (!content) throw new Error("blob not found");

    return { hash, content };
  }

  async deleteFile(ownerId: string, path: string): Promise<void> {
    return withTx(async (tx) => {
      const normalizedPath = await resolvePath(ownerId, path);
      if (normalizedPath === "/") throw new Error("cannot delete root");

      const node = await this.metadata.getNode(ownerId, normalizedPath, tx);
      if (!node) throw new Error("path not found");
      if (node.kind !== "file") throw new Error("not a file");

      const parentPath = parentOf(normalizedPath);
      if (parentPath) {
        const parentNode = await this.metadata.getNode(ownerId, parentPath, tx);
        if (!parentNode) throw new Error("parent directory does not exist");
        if (parentNode.readOnly) throw new Error("parent is read-only");
      }

      const oldHash = node.blobHash;

      await this.metadata.deleteNode(ownerId, normalizedPath, tx);

      if (oldHash) {
        await this.blobs.release(oldHash, tx);
      }
    });
  }
}

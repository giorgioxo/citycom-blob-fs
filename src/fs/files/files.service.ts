import type { MetadataStore } from "../../metadata/metadata.store";
import { normalizePath, parentOf } from "../shared/path.utils";

export class FilesService {
  constructor(private readonly metadata: MetadataStore) {}

  async createFile(ownerId: string, path: string, size?: number): Promise<void> {
    const normalizedPath = normalizePath(path);
    const parentPath = parentOf(normalizedPath);

    const exists = await this.metadata.exists(ownerId, normalizedPath);
    if (exists) {
      throw new Error("path already exists");
    }
    if (parentPath === null) {
      throw new Error("cannot create file at root");
    }

    const parentNode = await this.metadata.getNode(ownerId, parentPath);
    if (!parentNode) {
      throw new Error("parent directory does not exist");
    }
    if (parentNode.kind !== "dir") {
      throw new Error("parent is not a directory");
    }
    if (parentNode.readOnly) {
      throw new Error("parent is read-only");
    }
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

    await this.metadata.deleteNode(ownerId, normalizedPath);
  }
}

import type { FsNode, MetadataStore } from "../../metadata/metadata.store";
import type { BlobStore } from "../../blob/blob.store";
import { normalizePath, parentOf } from "../shared/path.utils";
import { withTx } from "../../../db/pg";

export class DirectoriesService {
  constructor(private readonly metadata: MetadataStore, private readonly blobs: BlobStore) {}

  async setReadOnly(ownerId: string, path: string, readOnly: boolean): Promise<void> {
    return withTx(async (tx) => {
      const normalizedPath = normalizePath(path);
      if (normalizedPath === "/") throw new Error("cannot change root permissions");

      const node = await this.metadata.getNode(ownerId, normalizedPath, tx);
      if (!node) throw new Error("path not found");

      await this.metadata.updateNode(ownerId, normalizedPath, { readOnly, updateDate: new Date() }, tx);
    });
  }

  async listDirectory(ownerId: string, path: string, limit = 50, afterPath?: string): Promise<FsNode[]> {
    const base = normalizePath(path);

    const baseNode = await this.metadata.getNode(ownerId, base);
    if (!baseNode) throw new Error("path not found");
    if (baseNode.kind !== "dir") throw new Error("path is not a directory");

    const safeLimit = Math.max(1, Math.min(limit, 200));

    return this.metadata.listChildren(ownerId, base, safeLimit, afterPath);
  }

  async listNodesRecursive(ownerId: string, path: string): Promise<FsNode[]> {
    const base = normalizePath(path);

    const baseNode = await this.metadata.getNode(ownerId, base);
    if (!baseNode) throw new Error("path not found");
    if (baseNode.kind !== "dir") throw new Error("path is not a directory");

    const prefix = base === "/" ? "/" : base + "/";

    const nodes = await this.metadata.listByPrefix(ownerId, prefix);

    return nodes.filter((n) => n.path !== base);
  }

  async createDirectory(ownerId: string, path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    if (normalizedPath === "/") throw new Error("path already exists");

    return withTx(async (tx) => {
      const parts = normalizedPath.split("/").filter(Boolean);

      let currentPath = "/";
      let currentNode = await this.metadata.getNode(ownerId, currentPath, tx);

      if (!currentNode) throw new Error("parent directory does not exist");
      if (currentNode.kind !== "dir") throw new Error("parent is not a directory");
      if (currentNode.readOnly) throw new Error("parent is read-only");

      for (let i = 0; i < parts.length; i++) {
        const name = parts[i];
        const isLast = i === parts.length - 1;

        const nextPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;

        const existing = await this.metadata.getNode(ownerId, nextPath, tx);

        if (existing) {
          if (existing.kind !== "dir") throw new Error("parent is not a directory");
          if (existing.readOnly) throw new Error("parent is read-only");
          if (isLast) throw new Error("path already exists");

          currentPath = nextPath;
          currentNode = existing;
          continue;
        }

        if (!currentNode) throw new Error("parent directory does not exist");
        if (currentNode.kind !== "dir") throw new Error("parent is not a directory");
        if (currentNode.readOnly) throw new Error("parent is read-only");

        const now = new Date();

        await this.metadata.createNode(
          {
            ownerId,
            path: nextPath,
            kind: "dir",
            createDate: now,
            updateDate: now,
            readOnly: false,
          },
          tx
        );

        currentPath = nextPath;
        currentNode = await this.metadata.getNode(ownerId, currentPath, tx);

        if (!currentNode) throw new Error("parent directory does not exist");
        if (currentNode.kind !== "dir") throw new Error("parent is not a directory");
        if (currentNode.readOnly) throw new Error("parent is read-only");
      }
    });
  }

  async moveDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = normalizePath(fromPath);
    const to = normalizePath(toPath);

    if (from === "/" || to === "/") throw new Error("cannot move root");
    if (to === from || to.startsWith(from + "/")) throw new Error("cannot move directory into itself");

    return withTx(async (tx) => {
      const source = await this.metadata.getNode(ownerId, from, tx);
      if (!source) throw new Error("path not found");
      if (source.kind !== "dir") throw new Error("not a directory");

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

      const prefix = from + "/";
      const descendants = await this.metadata.listByPrefix(ownerId, prefix, tx);

      descendants.sort((a, b) => b.path.length - a.path.length);

      for (const node of descendants) {
        const suffix = node.path.slice(from.length);
        const newPath = to + suffix;
        await this.metadata.moveNode(ownerId, node.path, newPath, tx);
        await this.metadata.updateNode(ownerId, newPath, { updateDate: new Date() }, tx);
      }

      await this.metadata.moveNode(ownerId, from, to, tx);
      await this.metadata.updateNode(ownerId, to, { updateDate: new Date() }, tx);
    });
  }

  async copyDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = normalizePath(fromPath);
    const to = normalizePath(toPath);

    if (from === "/" || to === "/") throw new Error("cannot copy root");
    if (to === from || to.startsWith(from + "/")) throw new Error("cannot copy directory into itself");

    return withTx(async (tx) => {
      const source = await this.metadata.getNode(ownerId, from, tx);
      if (!source) throw new Error("path not found");
      if (source.kind !== "dir") throw new Error("not a directory");

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
          kind: "dir",
          createDate: now,
          updateDate: now,
          readOnly: source.readOnly,
        },
        tx
      );

      const prefix = from + "/";
      const descendants = await this.metadata.listByPrefix(ownerId, prefix, tx);

      descendants.sort((a, b) => a.path.length - b.path.length);

      for (const node of descendants) {
        const suffix = node.path.slice(from.length);
        const newPath = to + suffix;

        await this.metadata.createNode(
          {
            ...node,
            ownerId,
            path: newPath,
            createDate: now,
            updateDate: now,
          },
          tx
        );

        if (node.kind === "file" && node.blobHash) {
          await this.blobs.retain(node.blobHash, tx);
        }
      }
    });
  }

  async deleteDirectory(ownerId: string, path: string): Promise<void> {
    const base = normalizePath(path);

    if (base === "/") throw new Error("cannot delete root");

    return withTx(async (tx) => {
      const baseNode = await this.metadata.getNode(ownerId, base, tx);
      if (!baseNode) throw new Error("path not found");
      if (baseNode.kind !== "dir") throw new Error("not a directory");

      const parentPath = parentOf(base);
      if (parentPath) {
        const parentNode = await this.metadata.getNode(ownerId, parentPath, tx);
        if (!parentNode) throw new Error("parent directory does not exist");
        if (parentNode.readOnly) throw new Error("parent is read-only");
      }

      const prefix = base + "/";
      const descendants = await this.metadata.listByPrefix(ownerId, prefix, tx);
      descendants.sort((a, b) => b.path.length - a.path.length);

      for (const node of descendants) {
        if (node.kind === "file" && node.blobHash) {
          await this.blobs.release(node.blobHash, tx);
        }
        await this.metadata.deleteNode(ownerId, node.path, tx);
      }

      await this.metadata.deleteNode(ownerId, base, tx);
    });
  }
}

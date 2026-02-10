import type { FsNode, MetadataStore } from "../../metadata/metadata.store";
import { normalizePath, parentOf } from "../shared/path.utils";

export class DirectoriesService {
  constructor(private readonly metadata: MetadataStore) {}

  async setReadOnly(ownerId: string, path: string, readOnly: boolean): Promise<void> {
    const normalizedPath = normalizePath(path);
    if (normalizedPath === "/") throw new Error("cannot change root permissions");

    const node = await this.metadata.getNode(ownerId, normalizedPath);
    if (!node) throw new Error("path not found");

    await this.metadata.updateNode(ownerId, normalizedPath, {
      readOnly,
      updateDate: new Date(),
    });
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
    const parentPath = parentOf(normalizedPath);

    const exists = await this.metadata.exists(ownerId, normalizedPath);
    if (exists) throw new Error("path already exists");

    if (parentPath !== null) {
      const parentNode = await this.metadata.getNode(ownerId, parentPath);

      if (!parentNode) throw new Error("parent directory does not exist");
      if (parentNode.kind !== "dir") throw new Error("parent is not a directory");
      if (parentNode.readOnly) throw new Error("parent is read-only");
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

  async moveDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = normalizePath(fromPath);
    const to = normalizePath(toPath);

    if (from === "/" || to === "/") throw new Error("cannot move root");

    if (to === from || to.startsWith(from + "/")) throw new Error("cannot move directory into itself");

    const source = await this.metadata.getNode(ownerId, from);
    if (!source) throw new Error("path not found");
    if (source.kind !== "dir") throw new Error("not a directory");

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

    const prefix = from + "/";
    const descendants = await this.metadata.listByPrefix(ownerId, prefix);

    descendants.sort((a, b) => b.path.length - a.path.length);

    for (const node of descendants) {
      const suffix = node.path.slice(from.length);
      const newPath = to + suffix;
      await this.metadata.moveNode(ownerId, node.path, newPath);
      await this.metadata.updateNode(ownerId, newPath, { updateDate: new Date() });
    }

    await this.metadata.moveNode(ownerId, from, to);
    await this.metadata.updateNode(ownerId, to, { updateDate: new Date() });
  }

  async copyDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    const from = normalizePath(fromPath);
    const to = normalizePath(toPath);

    if (from === "/" || to === "/") throw new Error("cannot copy root");

    if (to === from || to.startsWith(from + "/")) throw new Error("cannot copy directory into itself");

    const source = await this.metadata.getNode(ownerId, from);
    if (!source) throw new Error("path not found");
    if (source.kind !== "dir") throw new Error("not a directory");

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
      kind: "dir",
      createDate: now,
      updateDate: now,
      readOnly: source.readOnly,
    });

    const prefix = from + "/";
    const descendants = await this.metadata.listByPrefix(ownerId, prefix);

    descendants.sort((a, b) => a.path.length - b.path.length);

    for (const node of descendants) {
      const suffix = node.path.slice(from.length);
      const newPath = to + suffix;

      await this.metadata.createNode({
        ...node,
        ownerId,
        path: newPath,
        createDate: now,
        updateDate: now,
      });
    }
  }

  async deleteDirectory(ownerId: string, path: string): Promise<void> {
    const base = normalizePath(path);

    if (base === "/") throw new Error("cannot delete root");

    const baseNode = await this.metadata.getNode(ownerId, base);
    if (!baseNode) throw new Error("path not found");
    if (baseNode.kind !== "dir") throw new Error("not a directory");

    const parentPath = parentOf(base);
    if (parentPath) {
      const parentNode = await this.metadata.getNode(ownerId, parentPath);
      if (!parentNode) throw new Error("parent directory does not exist");
      if (parentNode.readOnly) throw new Error("parent is read-only");
    }

    const prefix = base + "/";

    const descendants = await this.metadata.listByPrefix(ownerId, prefix);
    descendants.sort((a, b) => b.path.length - a.path.length);

    for (const node of descendants) {
      await this.metadata.deleteNode(ownerId, node.path);
    }

    await this.metadata.deleteNode(ownerId, base);
  }
}

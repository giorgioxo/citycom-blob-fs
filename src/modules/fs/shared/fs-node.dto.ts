import type { FsNode } from "../../metadata/metadata.store";

export type PublicFsNode = {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createDate: Date;
  updateDate: Date;
  ownerId: string;
};

function nameFromPath(path: string): string {
  if (path === "/") return "/";
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0) return "";
  return name.slice(i + 1).toLowerCase();
}

function mimeFromNode(node: FsNode): string {
  if (node.kind === "dir") return "inode/directory";

  const ext = extOf(nameFromPath(node.path));
  switch (ext) {
    case "txt":
      return "text/plain; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "html":
      return "text/html; charset=utf-8";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

export function toPublicFsNode(node: FsNode): PublicFsNode {
  return {
    name: nameFromPath(node.path),
    path: node.path,
    size: node.kind === "dir" ? 0 : Number(node.size ?? 0),
    mimeType: mimeFromNode(node),
    createDate: node.createDate,
    updateDate: node.updateDate,
    ownerId: node.ownerId,
  };
}

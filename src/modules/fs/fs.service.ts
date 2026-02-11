import type { FsNode } from "../metadata/metadata.store";
import { DirectoriesService } from "./directories/directories.service";
import { FilesService } from "./files/files.service";
import { NodesService } from "./nodes/nodes.service";

export class FsService {
  constructor(private readonly files: FilesService, private readonly dirs: DirectoriesService, private readonly nodes: NodesService) {}

  getInfo(ownerId: string, path: string): Promise<FsNode> {
    return this.nodes.getInfo(ownerId, path);
  }

  createDirectory(ownerId: string, path: string): Promise<void> {
    return this.dirs.createDirectory(ownerId, path);
  }

  listDirectory(ownerId: string, path: string): Promise<FsNode[]> {
    return this.dirs.listDirectory(ownerId, path);
  }

  moveDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.dirs.moveDirectory(ownerId, fromPath, toPath);
  }

  copyDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.dirs.copyDirectory(ownerId, fromPath, toPath);
  }

  deleteDirectory(ownerId: string, path: string): Promise<void> {
    return this.dirs.deleteDirectory(ownerId, path);
  }

  listNodesRecursive(ownerId: string, path: string): Promise<FsNode[]> {
    return this.dirs.listNodesRecursive(ownerId, path);
  }

  setReadOnly(ownerId: string, path: string, readOnly: boolean): Promise<void> {
    return this.dirs.setReadOnly(ownerId, path, readOnly);
  }

  createFile(ownerId: string, path: string, size?: number): Promise<void> {
    return this.files.createFile(ownerId, path, size);
  }

  moveFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.files.moveFile(ownerId, fromPath, toPath);
  }

  copyFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.files.copyFile(ownerId, fromPath, toPath);
  }

  writeFileContent(ownerId: string, path: string, content: Buffer): Promise<{ hash: string; size: number }> {
    return this.files.writeFileContent(ownerId, path, content);
  }

  readFileContent(ownerId: string, path: string): Promise<{ hash: string; content: Buffer }> {
    return this.files.readFileContent(ownerId, path);
  }

  deleteFile(ownerId: string, path: string): Promise<void> {
    return this.files.deleteFile(ownerId, path);
  }
}

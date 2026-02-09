import type { FsNode } from "../metadata/metadata.store";
import { DirectoriesService } from "./directories/directories.service";
import { FilesService } from "./files/files.service";
import { NodesService } from "./shared/nodes.service";

export class FsService {
  constructor(private readonly files: FilesService, private readonly dirs: DirectoriesService, private readonly nodes: NodesService) {}

  async getInfo(ownerId: string, path: string): Promise<FsNode> {
    return this.nodes.getInfo(ownerId, path);
  }

  async createDirectory(ownerId: string, path: string): Promise<void> {
    return this.dirs.createDirectory(ownerId, path);
  }

  async moveDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.dirs.moveDirectory(ownerId, fromPath, toPath);
  }

  async copyDirectory(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.dirs.copyDirectory(ownerId, fromPath, toPath);
  }

  async deleteDirectory(ownerId: string, path: string): Promise<void> {
    return this.dirs.deleteDirectory(ownerId, path);
  }

  async listNodesRecursive(ownerId: string, path: string): Promise<FsNode[]> {
    return this.dirs.listNodesRecursive(ownerId, path);
  }

  async setReadOnly(ownerId: string, path: string, readOnly: boolean): Promise<void> {
    return this.dirs.setReadOnly(ownerId, path, readOnly);
  }

  async createFile(ownerId: string, path: string, size?: number): Promise<void> {
    return this.files.createFile(ownerId, path, size);
  }

  async moveFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.files.moveFile(ownerId, fromPath, toPath);
  }

  async copyFile(ownerId: string, fromPath: string, toPath: string): Promise<void> {
    return this.files.copyFile(ownerId, fromPath, toPath);
  }

  async deleteFile(ownerId: string, path: string): Promise<void> {
    return this.files.deleteFile(ownerId, path);
  }
}

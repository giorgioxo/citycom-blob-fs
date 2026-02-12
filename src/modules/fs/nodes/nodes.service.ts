import { resolvePath } from "../shared/resolve-path";
import type { FsNode, MetadataStore } from "../../metadata/metadata.store";

export class NodesService {
  constructor(private readonly metadata: MetadataStore) {}

  async getInfo(ownerId: string, path: string): Promise<FsNode> {
    const normalizedPath = await resolvePath(ownerId, path);

    const node = await this.metadata.getNode(ownerId, normalizedPath);
    if (!node) throw new Error("path not found");

    return node;
  }
}

import { Router } from "express";
import { InMemoryMetadataStore } from "../metadata/in-memory-metadata.store";
import { InMemoryBlobStore } from "../blob/in-memory-blob.store";
import { FsService } from "./fs.service";

import { DirectoriesService } from "./directories/directories.service";
import { FilesService } from "./files/files.service";
import { NodesService } from "./nodes/nodes.service";

import { directoriesRouter } from "./directories/directories.routes";
import { filesRouter } from "./files/files.routes";
import { nodesRouter } from "./nodes/nodes.routes";

const fsRouter = Router();

const metadata = new InMemoryMetadataStore();
const blobs = new InMemoryBlobStore();
const dirs = new DirectoriesService(metadata, blobs);
const files = new FilesService(metadata, blobs);
const nodes = new NodesService(metadata);

const fsService = new FsService(files, dirs, nodes);

fsRouter.use("/directories", directoriesRouter(fsService));
fsRouter.use("/files", filesRouter(fsService));
fsRouter.use("/", nodesRouter(fsService));

export { fsRouter };

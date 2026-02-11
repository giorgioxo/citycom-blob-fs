import { Router } from "express";
import { FsService } from "./fs.service";

import { DirectoriesService } from "./directories/directories.service";
import { FilesService } from "./files/files.service";
import { NodesService } from "./nodes/nodes.service";

import { directoriesRouter } from "./directories/directories.routes";
import { filesRouter } from "./files/files.routes";
import { nodesRouter } from "./nodes/nodes.routes";

import { PostgresMetadataStore } from "../metadata/postgres-metadata.store";
import { PostgresBlobStore } from "../blob/postgres-blob.store";

const fsRouter = Router();

const metadata = new PostgresMetadataStore();
const blobs = new PostgresBlobStore();

const dirs = new DirectoriesService(metadata, blobs);
const files = new FilesService(metadata, blobs);
const nodes = new NodesService(metadata);

const fsService = new FsService(files, dirs, nodes);

fsRouter.use("/directories", directoriesRouter(fsService));
fsRouter.use("/files", filesRouter(fsService));
fsRouter.use("/", nodesRouter(fsService));

export { fsRouter };

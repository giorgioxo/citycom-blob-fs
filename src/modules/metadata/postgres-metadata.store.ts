import type { DbClient, FsNode, MetadataStore } from "./metadata.store";
import { pool } from "../../db/pg";

function rowToNode(r: any): FsNode {
  return {
    ownerId: r.owner_id,
    path: r.path,
    kind: r.kind,
    createDate: r.create_date,
    updateDate: r.update_date,
    size: r.size ?? undefined,
    blobHash: r.blob_hash ?? undefined,
    readOnly: r.read_only ?? false,
  };
}

export class PostgresMetadataStore implements MetadataStore {
  async createNode(node: FsNode, tx?: DbClient): Promise<void> {
    const db = tx ?? pool;

    await db.query(
      `
      insert into fs_nodes (owner_id, path, kind, create_date, update_date, size, blob_hash, read_only)
      values ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [node.ownerId, node.path, node.kind, node.createDate, node.updateDate, node.size ?? null, node.blobHash ?? null, node.readOnly ?? false]
    );
  }

  async updateNode(ownerId: string, path: string, patch: Partial<FsNode>, tx?: DbClient): Promise<void> {
    const db = tx ?? pool;

    const current = await this.getNode(ownerId, path, tx);
    if (!current) throw new Error("path not found");

    const next: FsNode = { ...current, ...patch };

    const r = await db.query(
      `
      update fs_nodes
      set
        kind = $3,
        create_date = $4,
        update_date = $5,
        size = $6,
        blob_hash = $7,
        read_only = $8
      where owner_id = $1 and path = $2
      `,
      [ownerId, path, next.kind, next.createDate, next.updateDate, next.size ?? null, next.blobHash ?? null, next.readOnly ?? false]
    );

    if ((r.rowCount ?? 0) === 0) throw new Error("path not found");
  }

  async exists(ownerId: string, path: string, tx?: DbClient): Promise<boolean> {
    const db = tx ?? pool;

    if (path === "/") {
      await db.query(
        `
        insert into fs_nodes (owner_id, path, kind, create_date, update_date, read_only)
        values ($1,'/','dir', now(), now(), false)
        on conflict (owner_id, path) do nothing
        `,
        [ownerId]
      );
    }

    const r = await db.query(`select 1 from fs_nodes where owner_id = $1 and path = $2 limit 1`, [ownerId, path]);
    return (r.rowCount ?? r.rows.length) > 0;
  }

  async getNode(ownerId: string, path: string, tx?: DbClient): Promise<FsNode | undefined> {
    const db = tx ?? pool;

    if (path === "/") {
      await this.exists(ownerId, "/", tx);
    }

    const r = await db.query(`select * from fs_nodes where owner_id = $1 and path = $2`, [ownerId, path]);
    if ((r.rowCount ?? r.rows.length) === 0) return undefined;
    return rowToNode(r.rows[0]);
  }

  async listByPrefix(ownerId: string, prefix: string, tx?: DbClient): Promise<FsNode[]> {
    const db = tx ?? pool;

    const r = await db.query(
      `
      select * from fs_nodes
      where owner_id = $1 and path like $2
      order by path asc
      `,
      [ownerId, `${prefix}%`]
    );

    return r.rows.map(rowToNode);
  }

  async deleteNode(ownerId: string, path: string, tx?: DbClient): Promise<void> {
    const db = tx ?? pool;

    const r = await db.query(`delete from fs_nodes where owner_id = $1 and path = $2`, [ownerId, path]);
    if ((r.rowCount ?? 0) === 0) throw new Error("path not found");
  }

  async moveNode(ownerId: string, fromPath: string, toPath: string, tx?: DbClient): Promise<void> {
    const db = tx ?? pool;

    const r = await db.query(
      `
      update fs_nodes
      set path = $3
      where owner_id = $1 and path = $2
      `,
      [ownerId, fromPath, toPath]
    );

    if ((r.rowCount ?? 0) === 0) throw new Error("path not found");
  }
}

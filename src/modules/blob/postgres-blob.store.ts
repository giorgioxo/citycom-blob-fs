import type { BlobHash, BlobStore } from "./blob.store";
import type { DbClient } from "../metadata/metadata.store";
import { pool } from "../../db/pg";
import { hashBuffer } from "./blob-hash";

export class PostgresBlobStore implements BlobStore {
  async put(content: Buffer, tx?: DbClient): Promise<{ hash: BlobHash; size: number }> {
    const db = tx ?? pool;
    const hash = hashBuffer(content);

    const r = await db.query(
      `
      INSERT INTO blobs (hash, size, ref_count, content)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (hash)
      DO UPDATE SET ref_count = blobs.ref_count + 1
      RETURNING size
      `,
      [hash, content.length, content]
    );

    const size = Number((r.rows[0] as any).size);
    return { hash, size };
  }

  async get(hash: BlobHash, tx?: DbClient): Promise<Buffer | undefined> {
    const db = tx ?? pool;
    const r = await db.query(`SELECT content FROM blobs WHERE hash=$1 LIMIT 1`, [hash]);
    if (r.rows.length === 0) return undefined;
    return (r.rows[0] as any).content as Buffer;
  }

  async retain(hash: BlobHash, tx?: DbClient): Promise<void> {
    const db = tx ?? pool;
    await db.query(`UPDATE blobs SET ref_count = ref_count + 1 WHERE hash=$1`, [hash]);
  }

  async release(hash: BlobHash, tx?: DbClient): Promise<void> {
    const db = tx ?? pool;

    const r = await db.query(`UPDATE blobs SET ref_count = ref_count - 1 WHERE hash=$1 RETURNING ref_count`, [hash]);
    if (r.rows.length === 0) return;

    const ref = Number((r.rows[0] as any).ref_count);
    if (ref <= 0) {
      await db.query(`DELETE FROM blobs WHERE hash=$1`, [hash]);
    }
  }
}

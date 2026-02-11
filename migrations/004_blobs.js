exports.up = (pgm) => {
  pgm.createTable("blobs", {
    hash: { type: "text", primaryKey: true },
    size: { type: "bigint", notNull: true },
    ref_count: { type: "bigint", notNull: true, default: 0 },
    content: { type: "bytea", notNull: true },
    create_date: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.sql(`
    ALTER TABLE fs_nodes
    ADD CONSTRAINT fs_nodes_blob_hash_fk
    FOREIGN KEY (blob_hash)
    REFERENCES blobs(hash)
    DEFERRABLE INITIALLY DEFERRED
  `);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE fs_nodes DROP CONSTRAINT IF EXISTS fs_nodes_blob_hash_fk`);
  pgm.dropTable("blobs");
};

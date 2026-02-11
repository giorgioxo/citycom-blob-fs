/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("fs_nodes", {
    id: { type: "bigserial", primaryKey: true },

    owner_id: { type: "uuid", notNull: true },

    path: { type: "text", notNull: true },
    kind: { type: "text", notNull: true },

    create_date: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    update_date: { type: "timestamptz", notNull: true, default: pgm.func("now()") },

    size: { type: "bigint" },
    blob_hash: { type: "text" },
    read_only: { type: "boolean", notNull: true, default: false },
  });

  pgm.createIndex("fs_nodes", ["owner_id", "path"], { unique: true });

  pgm.createIndex("fs_nodes", ["owner_id", "path"]);

  pgm.createIndex("fs_nodes", ["owner_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("fs_nodes");
};

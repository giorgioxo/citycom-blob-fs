exports.up = (pgm) => {
  pgm.createTable("refresh_tokens", {
    user_id: { type: "uuid", notNull: true, references: '"users"', onDelete: "CASCADE" },
    token_hash: { type: "text", notNull: true },
    create_date: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("refresh_tokens", ["user_id", "token_hash"], { unique: true });
  pgm.createIndex("refresh_tokens", "user_id");
};

exports.down = (pgm) => {
  pgm.dropTable("refresh_tokens");
};

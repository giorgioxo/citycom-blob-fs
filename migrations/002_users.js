exports.up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true },
    username: { type: "text", notNull: true },
    password_hash: { type: "text", notNull: true },
    create_date: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("users", "username", { unique: true });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};

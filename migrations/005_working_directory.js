/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("users", {
    working_directory: { type: "text", notNull: true, default: "/" },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("users", "working_directory");
};

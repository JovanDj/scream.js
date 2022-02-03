// Update with your config settings.

module.exports = {
  development: {
    client: "sqlite3",
    migrations: {
      extension: "ts",
    },
    useNullAsDefault: true,
    connection: {
      filename: "./dev.sqlite3",
    },
  },
};

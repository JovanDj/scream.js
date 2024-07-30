import type { Knex } from "knex";

export const config: Record<string, Knex.Config> = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "migration-test.sqlite",
    },
    useNullAsDefault: true,
    debug: true,
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
      extension: ".ts",
    },
  },

  // staging: {
  //   client: "postgresql",
  //   connection: {
  //     database: "my_db",
  //     user: "username",
  //     password: "password",
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10,
  //   },
  //   migrations: {
  //     tableName: "knex_migrations",
  //   },
  // },

  // production: {
  //   client: "postgresql",
  //   connection: {
  //     database: "my_db",
  //     user: "username",
  //     password: "password",
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10,
  //   },
  //   migrations: {
  //     tableName: "knex_migrations",
  //   },
  // },
};

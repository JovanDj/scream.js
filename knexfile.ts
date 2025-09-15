import type { Knex } from "knex";

const config: Record<string, Knex.Config> = {
	development: {
		client: "better-sqlite3",
		connection: {
			filename: "db.sqlite",
		},
		debug: true,
		migrations: {
			directory: "./migrations",
			extension: "ts",
			tableName: "knex_migrations",
		},
		useNullAsDefault: true,
	},

	e2e: {
		client: "better-sqlite3",
		connection: {
			filename: "tmp/e2e.sqlite",
		},
		migrations: {
			directory: "./migrations",
			extension: "ts",
			tableName: "knex_migrations",
		},
		useNullAsDefault: true,
	},

	integration: {
		client: "better-sqlite3",
		connection: {
			filename: ":memory:",
		},
		migrations: {
			directory: "./migrations",
			extension: "ts",
			tableName: "knex_migrations",
		},
		useNullAsDefault: true,
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

export default config;

import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../");

const config: Record<string, Knex.Config> = {
	development: {
		client: "better-sqlite3",
		connection: {
			filename: path.join(root, "db.sqlite"),
		},
		debug: true,
		migrations: {
			directory: path.join(root, "migrations"),
			extension: "ts",
			tableName: "knex_migrations",
		},
		seeds: { directory: path.join(root, "seeds") },
		useNullAsDefault: true,
	},

	e2e: {
		client: "better-sqlite3",
		connection: {
			filename: "tmp/e2e.sqlite",
		},
		migrations: {
			directory: path.join(root, "migrations"),
			extension: "ts",
			tableName: "knex_migrations",
		},
		seeds: { directory: path.join(root, "seeds") },

		useNullAsDefault: true,
	},

	integration: {
		client: "better-sqlite3",
		connection: {
			filename: ":memory:",
		},
		migrations: {
			directory: path.join(root, "migrations"),
			extension: "ts",
			tableName: "knex_migrations",
		},
		seeds: { directory: path.join(root, "seeds") },

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

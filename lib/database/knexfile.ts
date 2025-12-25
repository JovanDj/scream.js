import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../");
const defaultAppRoot = path.join(root, "apps", "todo");
const appRoot = path.resolve(root, process.env["APP_ROOT"] ?? defaultAppRoot);
const migrationsDir =
	process.env["KNEX_MIGRATIONS_DIR"] ?? path.join(appRoot, "migrations");
const seedsDir = process.env["KNEX_SEEDS_DIR"] ?? path.join(appRoot, "seeds");

const config: Record<string, Knex.Config> = {
	development: {
		client: "better-sqlite3",
		connection: {
			filename: path.join(root, "db.sqlite"),
		},
		debug: true,
		migrations: {
			directory: migrationsDir,
			extension: "ts",
			tableName: "knex_migrations",
		},
		seeds: { directory: seedsDir },
		useNullAsDefault: true,
	},

	e2e: {
		client: "better-sqlite3",
		connection: {
			filename: "tmp/e2e.sqlite",
		},
		migrations: {
			directory: migrationsDir,
			extension: "ts",
			tableName: "knex_migrations",
		},
		seeds: { directory: seedsDir },

		useNullAsDefault: true,
	},

	integration: {
		client: "better-sqlite3",
		connection: {
			filename: ":memory:",
		},
		migrations: {
			directory: migrationsDir,
			extension: "ts",
			tableName: "knex_migrations",
		},
		seeds: { directory: seedsDir },

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

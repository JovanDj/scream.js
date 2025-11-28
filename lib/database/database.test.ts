import { describe, it, type TestContext } from "node:test";
import { Database } from "./database.js";
import { ScreamQueryBuilder } from "./query-builder/scream-query-builder.js";
import { sql } from "./query-builder/sql-template-string.js";
import { SqliteConnection } from "./sqlite/sqlite-connection.js";

describe("Database Read Queries", { concurrency: true }, () => {
	const withDb = async (
		run: (db: Database) => Promise<void>,
	): Promise<void> => {
		const connection = await SqliteConnection.connect({ database: ":memory:" });
		const queryBuilder = new ScreamQueryBuilder();
		const db = new Database(connection, queryBuilder);

		try {
			await connection.transaction(async (trx) => {
				await trx.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)`,
				);
				await trx.run(sql`INSERT INTO users (id, name) VALUES (1, 'Alice')`);
			});

			await run(db);
		} finally {
			await connection.close();
		}
	};

	it("should find a user by ID", async (t: TestContext) => {
		t.plan(1);
		await withDb(async (db) => {
			const user = await db.one<{ id: number; name: string }>((builder) =>
				builder.select("*").from("users").where("id", "=", "1"),
			);

			t.assert.deepStrictEqual(user, { id: 1, name: "Alice" });
		});
	});

	it("should return undefined if user does not exist", async (t: TestContext) => {
		t.plan(1);
		await withDb(async (db) => {
			const user = await db.one<{ id: number; name: string }>((builder) =>
				builder.select("*").from("users").where("id", "=", "999"),
			);

			t.assert.deepStrictEqual(user, undefined);
		});
	});
});

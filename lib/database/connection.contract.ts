import { describe, it, type TestContext } from "node:test";
import type { Connection } from "./connection.js";
import { sql } from "./query-builder/sql-template-string.js";

export const connectionContract = (
	name: string,
	connect: () => Promise<Connection>,
) => {
	describe(name, { concurrency: true }, () => {
		it("runs mutations and reads rows", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE users (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL
					)`,
				);

				const inserted = await connection.run(
					sql`INSERT INTO users (name) VALUES (${"Alice"})`,
				);
				const updated = await connection.run(
					sql`UPDATE users SET name = ${"Bob"} WHERE id = ${1}`,
				);
				const user = await connection.get<{ id: number; name: string }>(
					sql`SELECT id, name FROM users WHERE id = ${1}`,
				);
				const users = await connection.all<{ id: number; name: string }>(
					sql`SELECT id, name FROM users ORDER BY id`,
				);
				const missingUser = await connection.get(
					sql`SELECT id, name FROM users WHERE id = ${99}`,
				);
				const deleted = await connection.run(
					sql`DELETE FROM users WHERE id = ${1}`,
				);

				t.assert.deepStrictEqual(inserted.insertedId(), 1);
				t.assert.deepStrictEqual(inserted.affectedRows(), 1);
				t.assert.deepStrictEqual(updated.insertedId(), undefined);
				t.assert.deepStrictEqual(updated.affectedRows(), 1);
				t.assert.deepStrictEqual(user, { id: 1, name: "Bob" });
				t.assert.deepStrictEqual(users, [{ id: 1, name: "Bob" }]);
				t.assert.deepStrictEqual(missingUser, undefined);
				t.assert.deepStrictEqual(deleted.insertedId(), undefined);
				t.assert.deepStrictEqual(deleted.affectedRows(), 1);
			} finally {
				await connection.close();
			}
		});

		it("enforces foreign keys", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE parents (id INTEGER PRIMARY KEY)`,
				);
				await connection.run(
					sql`CREATE TABLE children (
						id INTEGER PRIMARY KEY,
						parent_id INTEGER NOT NULL REFERENCES parents(id)
					)`,
				);

				await t.assert.rejects(() =>
					connection.run(
						sql`INSERT INTO children (id, parent_id) VALUES (${1}, ${99})`,
					),
				);
			} finally {
				await connection.close();
			}
		});

		it("commits transactions and returns callback values", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				const result = await connection.transaction(async (transaction) => {
					await transaction.run(
						sql`INSERT INTO users (id, name) VALUES (${1}, ${"Alice"})`,
					);
					return "committed";
				});
				const user = await connection.get(
					sql`SELECT id, name FROM users WHERE id = ${1}`,
				);

				t.assert.deepStrictEqual(result, "committed");
				t.assert.deepStrictEqual(user, { id: 1, name: "Alice" });
			} finally {
				await connection.close();
			}
		});

		it("rolls transactions back when the callback fails", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				await t.assert.rejects(() =>
					connection.transaction(async (transaction) => {
						await transaction.run(
							sql`INSERT INTO users (id, name) VALUES (${1}, ${"Alice"})`,
						);
						throw new Error("rollback");
					}),
				);
				const user = await connection.get(
					sql`SELECT id, name FROM users WHERE id = ${1}`,
				);

				t.assert.deepStrictEqual(user, undefined);
			} finally {
				await connection.close();
			}
		});

		it("closes the connection", async (t: TestContext) => {
			const connection = await connect();

			await connection.close();

			await t.assert.rejects(() => connection.get(sql`SELECT 1`));
		});
	});
};
